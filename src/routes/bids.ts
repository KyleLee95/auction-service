import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { BidModel } from "../../prisma/zod";
import prisma from "../db";
import { notifyNewBid } from "../mq/publishers";
const router = new OpenAPIHono();

const createBid = createRoute({
  method: "post",
  path: "/",
  tags: ["Bid"],
  request: {
    query: z.object({
      userId: z
        .string()
        .openapi({ example: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1" }),
      auctionId: z
        .preprocess((val) => {
          if (typeof val === "string") {
            const num = Number(val);
            if (Number.isInteger(num)) {
              return num;
            } else {
              return NaN;
            }
          }
          return val;
        }, z.number().int())
        .openapi({ example: 1 }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({ amount: z.coerce.number() }).openapi({
            example: {
              amount: 4000,
            },
          }),
        },
      },
    },
    description: "Created a bid on an auction",
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            bids: z.array(BidModel),
          }),
        },
      },
      description: "Create a bid on an auctionf or the specified amount",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Bad Request." }),
          }),
        },
      },
      description: "Create a bid on an auction for the specified amount",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string().openapi({ example: "Bad Request." }),
          }),
        },
      },
      description: "Create a bid on an auctionf or the specified amount",
    },
  },
});

router.openapi(createBid, async (c) => {
  const { userId, auctionId } = c.req.query();
  const { amount } = await c.req.json();

  if (!userId) {
    return c.json({ error: "userId is required" }, 400);
  }
  if (!auctionId) {
    return c.json({ error: "auctionId is required" }, 400);
  }

  try {
    const timeReceived = new Date();

    const newBid = await prisma.$transaction(async (prisma) => {
      // Fetch the highest bid for the auction
      const lastBid = await prisma.bid.findFirst({
        where: { auctionId: parseInt(auctionId) },
        orderBy: { amount: "desc" }, // Get the highest bid
        include: {
          auction: true,
        },
      });

      // Validate the bid amount
      if (lastBid && parseFloat(amount) <= lastBid.amount) {
        throw new Error(
          `Bid amount must be greater than the current highest bid: $${lastBid.amount}.`,
        );
      }
      if (lastBid) {
        await notifyNewBid({
          userIds: [lastBid.userId],
          auction: lastBid.auction,
          bid: lastBid,
        });
      }

      // Create the new bid
      return prisma.bid.create({
        data: {
          placedAt: timeReceived.toISOString(),
          amount: parseFloat(amount),
          userId: userId,
          auctionId: parseInt(auctionId),
        },
      });
    });

    return c.json({ bids: [newBid] }, 200);
  } catch (error) {
    console.error("Error Creating Bid:", error.message);
    return c.json(
      {
        error: error.message || "Failed to create bid",
      },
      error.message?.includes("Bid amount must be greater") ? 400 : 500,
    );
  }
});

export { router as bidsRouter };
