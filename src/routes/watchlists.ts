import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import prisma from "../db";
import { z } from "zod";
import {
  WatchListModel,
  WatchListModelInput,
  WatchListModelWithAuctionAndCategory,
  AuctionsOnWatchListsModel,
} from "../../prisma/zod";
import { ParamsSchema } from "./schemas";
const router = new OpenAPIHono();

const getUserWatchListsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Watchlist"],
  request: {
    query: z.object({
      userId: z
        .string()
        .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    }),
  },

  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(WatchListModelWithAuctionAndCategory),
          }),
        },
      },
      description: "Retrieve all WatchLists",
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

router.openapi(getUserWatchListsRoute, async (c) => {
  const { userId } = c.req.query();
  const watchlists = await prisma.watchList.findMany({
    where: {
      userId: userId,
    },
    include: {
      categories: { include: { category: true } },
      auctions: { include: { auction: true } },
    },
  });
  if (!watchlists.length) {
    return c.json({ message: "No WatchLists Found" }, 404);
  }
  return c.json({ watchlists }, 200);
});

const updateUserWatchListsRoute = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Watchlist"],
  request: {
    params: ParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: WatchListModelInput,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(WatchListModel),
          }),
        },
      },
      description: "Update a watchlist that matches the unqiue watchlistId",
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

router.openapi(updateUserWatchListsRoute, async (c) => {
  const { id } = c.req.query();
  const body = await c.req.json();
  const updatedWatchlist = await prisma.watchList.update({
    where: { id: parseInt(id) },
    data: {
      ...body,
    },
  });
  return c.json({ watchlists: [updatedWatchlist] }, 200);
});

//add auction to watchlist

const addAuctionToWatchlistRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Watchlist"],
  request: {
    params: z
      .object({
        watchlistId: z
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
              name: "watchlistId",
              required: true,
            },
            description: "The unique watchlist identifier.",
            example: 123,
          }),
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
            description: "The unique auction identifier.",
            example: 123,
          }),
      })
      .strict(),
    body: {
      content: {
        "application/json": {
          schema: AuctionsOnWatchListsModel,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(WatchListModelWithAuctionAndCategory),
          }),
        },
      },
      description: "Add an auction to a user's watchlist",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Not found",
    },
  },
});

router.openapi(addAuctionToWatchlistRoute, async (c) => {
  const body = await c.req.json();
  const addedAuction = await prisma.auctionsOnWatchLists.create({
    data: {
      auctionId: parseInt(body.auctionId),
      watchlistId: parseInt(body.watchlistId),
    },
  });
  if (!addedAuction) {
    return c.json({ message: "Failed to add auction to watchlist" }, 500);
  }

  const updatedWatchlist = await prisma.watchList.findFirst({
    where: { id: parseInt(body.watchlistId) },
    include: {
      categories: { include: { category: true } },
      auctions: { include: { auction: true } },
    },
  });
  if (!updatedWatchlist) {
    if (!addedAuction) {
      return c.json({ message: "Failed to add auction to watchlist" }, 500);
    }
  }

  return c.json(
    {
      watchlists: [updatedWatchlist],
    },
    200,
  );
});

//TODO: Delete auction from watchlist

const removeAuctionFromWatchlistRoute = createRoute({
  method: "delete",
  path: "/{watchlistId}/auction/{auctionId}",
  tags: ["Watchlist"],
  request: {
    params: z
      .object({
        watchlistId: z
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
              name: "watchlistId",
              required: true,
            },
            description: "The unique watchlist identifier.",
            example: 123,
          }),
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
            description: "The unique auction identifier.",
            example: 123,
          }),
      })
      .strict(),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(WatchListModelWithAuctionAndCategory),
          }),
        },
      },
      description: "Remove an auction from a user's watchlist",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Not found",
    },
  },
});

router.openapi(removeAuctionFromWatchlistRoute, async (c) => {
  const { watchlistId, auctionId } = c.req.query();
  const deletedAuction = await prisma.auctionsOnWatchLists.delete({
    where: {
      watchlistId_auctionId: {
        auctionId: parseInt(auctionId),
        watchlistId: parseInt(watchlistId),
      },
    },
  });
  if (!deletedAuction) {
    return c.json({ message: "Failed to add auction to watchlist" }, 500);
  }

  const updatedWatchlist = await prisma.watchList.findFirst({
    where: { id: parseInt(watchlistId) },
    include: {
      categories: { include: { category: true } },
      auctions: { include: { auction: true } },
    },
  });
  if (!updatedWatchlist) {
    if (!updatedWatchlist) {
      return c.json({ message: "Failed to add auction to watchlist" }, 500);
    }
  }

  return c.json(
    {
      watchlists: [updatedWatchlist],
    },
    200,
  );
});

export { router as watchlistRouter };
