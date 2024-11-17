import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { BidModel, BidModelInput } from "../../prisma/zod";
import prisma from "../db";
const router = new OpenAPIHono();

const createBid = createRoute({
  method: "post",
  path: "/",
  tags: ["Bid"],
  request: {
    query: z.object({
      userId: z
        .string()
        .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
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
          schema: BidModelInput,
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
            bid: BidModel,
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
    //use the moment when the request is received as the time placed.
    //since we can't trust the client to be honest about what time the bid was created
    const timeReceived = new Date(Date.now());
    const lastBid = await prisma.bid.findFirst({
      where: {
        amount: { gte: parseFloat(amount) },
      },
    });

    if (!lastBid) {
      const newBid = await prisma.bid.create({
        data: {
          placedAt: timeReceived.toISOString(),
          amount: parseFloat(amount),
          userId: userId,
          auctionId: parseInt(auctionId),
        },
      });
      return c.json({ bid: newBid }, 200);
    }
    return c.json(
      {
        error: `Could not create bid because the most recent bid amount is larger:$${lastBid.amount}.`,
      },
      400,
    );
  } catch (error) {
    console.error("Error Creaing Bid:", error);
    return c.json({ error: "Failed to Created bid" }, 500);
  }
});
export { router as bidsRouter };
