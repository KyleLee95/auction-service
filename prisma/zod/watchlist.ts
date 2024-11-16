import * as z from "zod";
import {
  type CompleteUser,
  type CompleteAuctionsOnWatchLists,
  type CompleteCategoriesOnWatchLists,
  type IncludeAuction,
  type IncludeCategory,
  RelatedUserModel,
  RelatedCategoriesOnWatchListsModel,
  AuctionModel,
  CategoryModel,
  RelatedAuctionsOnWatchListsModel,
} from "./index";

export const WatchListModelInput = z
  .object({
    userId: z.number().int(),
    name: z.string(),
  })
  .openapi("WatchlistInput");

export const WatchListModel = z
  .object({
    id: z.number().int(),
    name: z.string(),
    userId: z.number().int(),
  })
  .openapi("Watchlist");

export const WatchListModelWithAuctionAndCategory = z
  .object({
    id: z.number().int(),
    name: z.string(),
    userId: z.number().int(),
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
  })
  .openapi("Watchlist");

export interface IWatchListIncludeAuctionAndCategory {
  id: number;
  name: string;
  userId: number;
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
  user: CompleteUser;
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
      user: RelatedUserModel,
      auctions: RelatedAuctionsOnWatchListsModel.array(),
      categories: RelatedCategoriesOnWatchListsModel.array(),
    }),
);
