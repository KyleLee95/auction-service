import * as z from "zod";
import {
  type CompleteAuctionsOnWatchLists,
  type CompleteCategoriesOnWatchLists,
  type IncludeAuction,
  type IncludeCategory,
  RelatedCategoriesOnWatchListsModel,
  AuctionModel,
  CategoryModel,
  RelatedAuctionsOnWatchListsModel,
} from "./index";

export const WatchListModelInput = z
  .object({
    userId: z
      .string()
      .optional()
      .openapi({ example: "c1bba5c0-b001-7085-7a2e-e74d5399c3d1" }),
    name: z.string().openapi({ example: "Rayban Sunglasses < $100" }),
    categories: z
      .array(z.object({ id: z.number(), label: z.string(), value: z.string() }))
      .optional()
      .openapi({
        example: [{ id: 1, label: "Autos", value: "autos" }],
      }),
    maxPrice: z.number().optional().openapi({ example: 100 }),
    keyword: z.string().optional().openapi({ example: "Rayban" }),
  })
  .openapi("WatchlistInput");

export const WatchListModel = z
  .object({
    id: z.number().int(),
    name: z.string(),
    userId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    categories: z
      .array(z.object({ id: z.number(), label: z.string(), value: z.string() }))
      .optional()
      .openapi({
        example: [{ id: 1, label: "Autos", value: "autos" }],
      }),
    maxPrice: z.number().optional().openapi({ example: 100 }),
    keyword: z.string().optional().openapi({ example: "Rayban" }),
  })

  .openapi("Watchlist");

export const WatchListModelWithAuctionAndCategory = z
  .object({
    id: z.number().int(),
    name: z.string(),
    userId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    auctions: z.array(
      z.object({
        watchlistId: z.number().int(),
        auctionId: z.number().int(),
        auction: AuctionModel,
      }),
    ),
    categories: z.array(
      z.object({
        watchlistId: z.number().int(),
        categoryId: z.number().int(),
        category: CategoryModel,
      }),
    ),
    maxPrice: z.number().optional().openapi({ example: 2000 }),
    keyword: z.string().optional().openapi({ example: "Rayban" }),
  })
  .openapi("Watchlist");

export interface IWatchListIncludeAuctionAndCategory {
  id: number;
  name: string;
  userId: string;
  maxPrice: number;
  auctions: {
    watchlistId: number;
    auctionId: number;
    auction: IncludeAuction;
  }[];
  categories: {
    watchlistId: number;
    auctionId: number;
    category: IncludeCategory[];
  };
}

export interface CompleteWatchList extends z.infer<typeof WatchListModel> {
  auctions: CompleteAuctionsOnWatchLists[];
  categories: CompleteCategoriesOnWatchLists[];
}

/**
 * RelatedWatchListModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedWatchListModel: z.ZodSchema<CompleteWatchList> = z.lazy(
  () =>
    WatchListModel.extend({
      auctions: RelatedAuctionsOnWatchListsModel.array(),
      categories: RelatedCategoriesOnWatchListsModel.array(),
    }),
);
