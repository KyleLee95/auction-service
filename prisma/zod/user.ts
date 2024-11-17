import * as z from "zod";
import {
  type CompleteAuction,
  type CompleteBid,
  type CompleteWatchList,
  RelatedAuctionModel,
  RelatedWatchListModel,
  RelatedBidModel,
} from "./index";

export const UserModelInput = z
  .object({
    name: z.string(),
    isAdmin: z.boolean(),
    suspended: z.boolean(),
  })
  .openapi("UserInput");
export const UserModel = z
  .object({
    userId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    name: z.string(),
    isAdmin: z.boolean(),
    suspended: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .openapi("User");

export interface CompleteUser extends z.infer<typeof UserModel> {
  items: CompleteAuction[];
  bids: CompleteBid[];
  watchlist: CompleteWatchList[];
}

/**
 * RelatedUserModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedUserModel: z.ZodSchema<CompleteUser> = z.lazy(() =>
  UserModel.extend({
    items: RelatedAuctionModel.array(),
    bids: RelatedBidModel.array(),
    watchlist: RelatedWatchListModel.array(),
  }),
);
