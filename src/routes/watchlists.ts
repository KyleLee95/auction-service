import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import prisma from "../db";
import { z } from "zod";
import {
  CategoryModel,
  WatchListModel,
  WatchListModelInput,
  WatchListModelWithAuctionAndCategory,
  type CompleteCategory,
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
        .optional()
        .openapi({ example: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1" }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(
              WatchListModelWithAuctionAndCategory.optional(),
            ),
          }),
        },
      },
      description: "Retrieve all WatchLists",
    },
  },
});

router.openapi(getUserWatchListsRoute, async (c) => {
  const { userId } = c.req.query();
  const watchlists = await prisma.watchlist.findFirst({
    where: {
      userId: userId,
    },
    include: {
      categories: { include: { category: true } },
      auctions: {
        include: {
          auction: { include: { categories: { include: { category: true } } } },
        },
      },
    },
  });
  if (!watchlists) {
    return c.json({ watchlists: [] }, 200);
  }
  return c.json({ watchlists }, 200);
});

const checkIfAuctionIsOnUserWatchlistRoute = createRoute({
  method: "get",
  path: "/check",
  tags: ["Watchlist"],
  request: {
    query: z.object({
      userId: z
        .string()
        .openapi({ example: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1" }),
      auctionId: z.coerce.number().openapi({ example: 1 }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z
            .object({
              isOnWatchlist: z.boolean(),
            })
            .openapi({ example: { isOnWatchlist: true } }),
        },
      },
      description: "Retrieve all WatchLists",
    },
  },
});

router.openapi(checkIfAuctionIsOnUserWatchlistRoute, async (c) => {
  const { userId, auctionId } = c.req.queries();

  const isOnWatchlist = await prisma.auctionsOnWatchlists.findFirst({
    where: {
      auctionId: Number(auctionId),
      watchlist: { userId: String(userId) },
    },
  });
  return c.json({ isOnWatchlist: isOnWatchlist === null ? false : true }, 200);
});

const getWatchListsByIdRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Watchlist"],
  request: {
    params: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            watchlists: z.array(
              WatchListModelWithAuctionAndCategory.optional(),
            ),
          }),
        },
      },
      description: "Retrieve all WatchLists",
    },
  },
});

router.openapi(getWatchListsByIdRoute, async (c) => {
  const watchlistId = c.req.param("id");
  const watchlists = await prisma.watchlist.findMany({
    where: {
      id: parseInt(watchlistId),
    },
    include: {
      categories: { include: { category: true } },
      auctions: {
        include: {
          auction: { include: { categories: { include: { category: true } } } },
        },
      },
    },
  });
  if (!watchlists.length) {
    return c.json({ watchlists: [] }, 200);
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
  const { id } = c.req.param();

  const { name, maxPrice, keyword, categories } = await c.req.json(); // New watchlist data

  // Validate if the watchlist exists
  const watchlist = await prisma.watchlist.findUnique({
    where: { id: parseInt(id) },
  });

  if (!watchlist) {
    return c.json({ message: "Watchlist not found" }, 500);
  }

  // Update watchlist fields
  await prisma.watchlist.update({
    where: { id: parseInt(id) },
    data: {
      name,
      maxPrice,
      keyword,
    },
  });

  // Update categories
  if (categories && categories.length > 0) {
    // Remove existing categories
    await prisma.categoriesOnWatchlists.deleteMany({
      where: { watchlistId: parseInt(id) },
    });

    // Add new categories
    await prisma.categoriesOnWatchlists.createMany({
      data: categories.map((category: z.infer<typeof CategoryModel>) => ({
        watchlistId: parseInt(id),
        categoryId: parseInt(category.id),
      })),
    });
  }

  // Fetch the updated watchlist with its categories
  const finalWatchlist = await prisma.watchlist.findUnique({
    where: { id: parseInt(id) },
    include: {
      categories: {
        include: {
          category: true,
        },
      },
    },
  });

  return c.json({ watchlists: [finalWatchlist] }, 200);
});

const createWatchlistRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Watchlist"],
  request: {
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
            watchlists: z.array(WatchListModelInput),
          }),
        },
      },
      description: "Create a new watchlist for a user",
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

router.openapi(createWatchlistRoute, async (c) => {
  const body = await c.req.json();
  const watchlist = await prisma.watchlist.create({
    data: {
      userId: String(body.userId),
      name: body.name,
      maxPrice: parseFloat(body.maxPrice),
      keyword: body.keyword,
      categories: {
        create: body.categories.map((category: CompleteCategory) => ({
          categoryId: category.id,
        })),
      },
    },
  });

  return c.json(
    {
      watchlistss: [watchlist],
    },
    200,
  );
});

const addAuctionToWatchlistRoute = createRoute({
  method: "post",
  path: "/addAuction",
  tags: ["Watchlist"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              userId: z.string(),
              auctionId: z.coerce.number(),
            })
            .openapi({
              example: {
                userId: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1",
                auctionId: 1,
              },
            }),
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
      description: "Successfully added the auction to the user's watchlist",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "The specified auction is already on the user's watchlist",
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
  const { userId, auctionId } = body;

  // Check if the auction is already in the watchlist
  let userWatchlist = await prisma.watchlist.findFirst({
    where: {
      userId,
    },
  });

  if (!userWatchlist) {
    userWatchlist = await prisma.watchlist.create({
      data: {
        name: "My Watchlist",
        maxPrice: 10000.0,
        userId: userId || "",
      },
    });
  }

  // Add the auction to the watchlist
  await prisma.auctionsOnWatchlists.create({
    data: {
      watchlistId: Number(userWatchlist.id),
      auctionId: Number(auctionId),
    },
  });

  const finalWatchlist = await prisma.watchlist.findFirst({
    where: { id: userWatchlist.id },
    include: { auctions: true },
  });

  return c.json({ watchlists: [finalWatchlist] }, 200);
});

const removeAuctionFromWatchlistRoute = createRoute({
  method: "delete",
  path: "/removeAuction",
  tags: ["Watchlist"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              userId: z.string(),
              auctionId: z.coerce.number(),
            })
            .openapi({
              example: {
                userId: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1",
                auctionId: 1,
              },
            }),
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
      description: "Remove an auction from a user's watchlist",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }).openapi({
            example: {
              message: "Could not find the auction/watchlist combination",
            },
          }),
        },
      },
      description: "Not found",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "Error. Could not complete request.",
    },
  },
});

router.openapi(removeAuctionFromWatchlistRoute, async (c) => {
  const body = await c.req.json();
  const { userId, auctionId } = body;
  const userWatchlist = await prisma.watchlist.findFirst({
    where: {
      userId,
    },
    select: { id: true },
  });

  if (!userWatchlist) {
    return c.json(
      { message: "The auction is not on the user's watchlist" },
      500,
    );
  }

  await prisma.auctionsOnWatchlists.delete({
    where: {
      watchlistId_auctionId: {
        auctionId: parseInt(auctionId),
        watchlistId: userWatchlist.id,
      },
    },
  });

  const updatedWatchlist = await prisma.watchlist.findFirst({
    where: { id: userWatchlist.id },
    include: {
      categories: { include: { category: true } },
      auctions: { include: { auction: true } },
    },
  });

  return c.json(
    {
      watchlists: [updatedWatchlist],
    },
    200,
  );
});

export { router as watchlistRouter };
