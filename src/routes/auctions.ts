import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import prisma from "../db";
import { z } from "zod";
import {
  AuctionModel,
  AuctionModelInput,
  BidModelWithAuction,
  type CompleteCategory,
} from "../../prisma/zod";
import { ParamsSchema } from "./schemas";
const router = new OpenAPIHono();
const ASC: string = "asc";
const DESC: string = "desc";

const searchAuctionsRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["Auction"],
  request: {
    query: z
      .object({
        term: z.string().optional(),
        categories: z
          .array(
            z.string().transform((string) => {
              return string
                .toLowerCase() // Convert to lowercase
                .replace(/[^\w\s]/g, "") // Remove all punctuation
                .replace(/\s+/g, "-"); // Replace spaces with hyphens
            }),
          )
          .or(
            z.string().transform((string) => {
              return string
                .toLowerCase() // Convert to lowercase
                .replace(/[^\w\s]/g, "") // Remove all punctuation
                .replace(/\s+/g, "-"); // Replace spaces with hyphens
            }),
          )
          .optional(),
        order: z.enum(["asc", "desc"]).default("asc"),
        maxPrice: z.coerce.number().optional().default(10000),
        minPrice: z.coerce.number().optional().default(0),
      })
      .openapi({
        example: {
          term: "rayban sunglasses",
          categories: ["sunglasses", "rayban"],
          order: "asc",
          maxPrice: 10000.0,
          minPrice: 0.0,
        },
      }),
    description:
      "Get auctions that match the search terms either by keyword or item category",
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            auctions: z.array(AuctionModel).or(z.array(z.any())),
          }),
        },
      },
      description:
        "Retrieve all Auctions matching the search term either by keyword or by item category",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Error searching for auctions that match your request",
    },
  },
});

router.openapi(searchAuctionsRoute, async (c) => {
  const { term, categories, order, maxPrice } = c.req.query();
  const categoriesToFilterBy = c.req.queries("categories");

  if (!term && !categories) {
    return c.json(
      { error: "A query term or category name is required is required" },
      500,
    );
  }

  try {
    if (term && !categories) {
      const keywordInTitleResults = await prisma.auction.findMany({
        orderBy: { endTime: order === DESC ? "desc" : "asc" },
        where: {
          isActive: true,
          title: {
            contains: term,
            mode: "insensitive",
          },
          OR: [
            {
              buyItNowPrice: {
                lte: parseFloat(maxPrice),
                gt: 0,
              },
            },
            {
              bids: {
                some: { amount: { lte: parseFloat(maxPrice) } },
              },
            },
          ],
        },
        include: {
          categories: true,
          bids: {
            orderBy: {
              amount: "desc",
            },
            take: 1,
          },
        },
      });

      return c.json(
        {
          auctions: keywordInTitleResults,
        },
        200,
      );
    }

    if (!term && categories) {
      const taggedWithCategories = await prisma.auction.findMany({
        where: {
          isActive: true,
          OR: [
            {
              buyItNowPrice: {
                lte: parseFloat(maxPrice),
                gt: 0,
              },
            },
            {
              bids: {
                some: {
                  amount: {
                    lte: parseFloat(maxPrice),
                  },
                },
              },
            },
          ],
          AND: [
            {
              categories: {
                some: {
                  category: {
                    value: {
                      in: categoriesToFilterBy,
                    },
                  },
                },
              },
            },
          ],
        },
        orderBy: { endTime: order === DESC ? "desc" : "asc" },
        include: {
          bids: {
            orderBy: {
              amount: "desc",
            },
            take: 1, // Include the current highest bid
          },
          categories: {
            include: {
              category: true,
            },
          },
        },
      });
      return c.json(
        {
          auctions: taggedWithCategories,
        },
        200,
      );
    }

    const termMatchesKeywordAndCategory = await prisma.auction.findMany({
      where: {
        isActive: true,
        title: {
          contains: term,
          mode: "insensitive",
        },
        OR: [
          {
            buyItNowPrice: {
              lte: parseFloat(maxPrice),
              gt: 0,
            },
          },
          {
            bids: {
              some: {
                amount: {
                  lte: parseFloat(maxPrice),
                },
              },
            },
          },
        ],
        AND: [
          {
            categories: {
              some: {
                category: {
                  value: {
                    in: categoriesToFilterBy,
                  },
                },
              },
            },
          },
        ],
      },
      include: {
        bids: {
          orderBy: {
            amount: "desc",
          },
          take: 1, // Include the current highest bid
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return c.json(
      {
        auctions: termMatchesKeywordAndCategory,
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return c.json({ error: "Failed to fetch auctions" }, 500);
  }
});

const getAuctionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Auction"],
  request: {
    query: z
      .object({
        userId: z
          .string()
          .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
        includeBidOn: z.coerce.boolean().optional().openapi({ example: false }),
        order: z.enum(["asc", "desc"]).default("asc"),
      })
      .openapi({
        example: {
          userId: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e",
          includeBidOn: false,
          order: "asc",
        },
      }),
    description:
      "Get all auctions with optional query params finding auctions that belong to a user via their unique userId",
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            auctions: z.array(AuctionModel),
            bidOnAuctions: z.array(BidModelWithAuction).or(z.array(z.any())),
          }),
        },
      },
      description:
        "Retrieve all auctions that a user is both selling and, optionally, has bid on",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "userId is required",
    },
  },
});

router.openapi(getAuctionsRoute, async (c) => {
  const { userId, includeBidOn, order } = c.req.query();
  if (!userId) {
    return c.json({ error: "userId is required" }, 500);
  }

  try {
    const userAuctions = await prisma.auction.findMany({
      where: {
        sellerId: userId,
      },
      orderBy: { endTime: order === ASC ? "asc" : "desc" },
    });

    if (includeBidOn === "true") {
      const bidOnAuctions = await prisma.bid.findMany({
        where: {
          userId: userId,
        },
        include: {
          auction: true,
        },
      });

      return c.json(
        {
          auctions: userAuctions,
          bidOnAuctions: bidOnAuctions,
        },
        200,
      );
    }

    return c.json(
      {
        auctions: userAuctions,
        bidOnAuctions: [],
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return c.json({ error: "Failed to fetch auctions" }, 500);
  }
});

const getAuctionByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Auction"],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ auctions: z.array(AuctionModel) }),
        },
      },
      description: "Retrieve an auction by Id",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Not found",
    },
  },
});

router.openapi(getAuctionByIdRoute, async (c) => {
  const { id } = c.req.valid("param");
  const auction = await prisma.auction.findFirst({
    where: {
      id: id,
    },
    include: {
      categories: true,
      bids: true,
    },
  });
  if (!auction) {
    return c.json({ message: "Could not find auction" }, 404);
  }
  return c.json(
    {
      auctions: [auction],
    },
    200,
  );
});

const createAuctionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Auction"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AuctionModelInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ auctions: z.array(AuctionModel) }),
        },
      },
      description: "Create an auction",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Could not create auction",
    },
  },
});

router.openapi(createAuctionRoute, async (c) => {
  const {
    title,
    description,
    startPrice,
    shippingPrice,
    buyItNowPrice,
    startTime,
    endTime,
    isActive,
    sellerId,
    quantity,
    buyItNowEnabled,
    deleted,
    flagged,
    createdAt,
    closedAt,
    buyerId,
    updatedAt,
    categories,
  } = await c.req.json();
  const newAuction = await prisma.auction.create({
    data: {
      title,
      description,
      startPrice,
      shippingPrice,
      buyItNowPrice,
      startTime,
      endTime,
      isActive,
      sellerId,
      quantity,
      buyItNowEnabled,
      deleted,
      flagged,
      closedAt,
      createdAt,
      updatedAt,
    },
  });

  if (!newAuction) {
    return c.json({ message: "Could not create auction" }, 422);
  }
  const associatedCategories =
    await prisma.categoriesOnAuctions.createManyAndReturn({
      data: categories.map((category) => {
        return { categoryId: category.id, auctionId: newAuction.id };
      }),
    });

  const matchingWatchlists = await prisma.watchlist.findMany({
    where: {
      categories: {
        some: {
          categoryId: {
            in: associatedCategories.map((category) => category.categoryId), // Replace with the new auction's category IDs
          },
        },
      },
      maxPrice: {
        gte: newAuction.startPrice, // Optional: Match max price
      },
    },
    include: {
      user: true, // Include the user for sending notifications
    },
  });

  console.log("matchingWatchlists", matchingWatchlists);

  //TODO: send email to everyone that matches this query.
  //send a rabbitMQ message to the notification service with all of the user data

  return c.json({ auctions: [newAuction] }, 200);
});

const updateAuctionRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Auction"],
  request: {
    params: ParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: AuctionModelInput,
        },
        "multipart/form-data": {
          schema: AuctionModelInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ auctions: z.array(AuctionModel) }),
        },
      },
      description: "Update an auction with a matching Id",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Could not update auction",
    },
  },
});

router.openapi(updateAuctionRoute, async (c) => {
  const { id } = c.req.valid("param");
  const body = await c.req.json();

  const updatedAuction = await prisma.auction.update({
    where: {
      id: id,
    },
    data: body,
  });
  if (!updatedAuction) {
    return c.json({ message: "Could not update auction" }, 422);
  }

  return c.json({ auctions: [updatedAuction] }, 200);
});

const setAuctionInactiveRoute = createRoute({
  method: "put",
  path: "/{auctionId}/inactive",
  tags: ["Auction"],
  request: {
    params: z
      .object({
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
          .openapi({
            param: {
              in: "path",
              name: "auctionId",
              required: true,
            },
            description: "The unique resource identifier.",
            example: 123,
          }),
      })
      .strict(),

    body: {
      content: {
        "application/json": {
          schema: z.object({
            isActive: z.boolean().openapi({ example: false }),
          }),
        },
      },
    },
  },

  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ auctions: z.array(AuctionModel) }),
        },
      },
      description: "set the active state of the auction",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Could not process body",
    },
  },
});

router.openapi(setAuctionInactiveRoute, async (c) => {
  const { auctionId } = c.req.valid("param");
  const body = await c.req.json();
  const updatedAuction = await prisma.auction.update({
    where: {
      id: auctionId,
    },
    data: {
      isActive: body.isActive,
    },
  });
  if (!updatedAuction) {
    return c.json({ message: "Could not update auction" }, 422);
  }
  return c.json(
    {
      auctions: [updatedAuction],
    },
    200,
  );
});

const flagAuctionRoute = createRoute({
  method: "put",
  path: "/{auctionId}/flag",
  tags: ["Auction"],
  request: {
    params: z
      .object({
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
          .openapi({
            param: {
              in: "path",
              name: "auctionId",
              required: true,
            },
            description: "The unique resource identifier.",
            example: 123,
          }),
      })
      .strict(),

    body: {
      content: {
        "application/json": {
          schema: z.object({
            isFlagged: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
  },

  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ auctions: z.array(AuctionModel) }),
        },
      },
      description: "flag an auction for inappropriate content",
    },
    422: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Could not process body",
    },
  },
});

router.openapi(flagAuctionRoute, async (c) => {
  const { auctionId } = c.req.valid("param");
  const body = await c.req.json();
  const updatedAuction = await prisma.auction.update({
    where: {
      id: auctionId,
    },
    data: {
      flagged: body.isFlagged,
    },
  });
  if (!updatedAuction) {
    return c.json({ message: "Could not update auction" }, 422);
  }
  return c.json(
    {
      auctions: [updatedAuction],
    },
    200,
  );
});

export { router as auctionsRouter };
