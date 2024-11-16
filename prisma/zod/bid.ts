import * as z from "zod";
import {
  type CompleteUser,
  type CompleteAuction,
  RelatedUserModel,
  RelatedAuctionModel,
  AuctionModel,
  type IncludeAuction,
} from "./index";

export const BidModelInput = z
  .object({
    amount: z.number().openapi({ example: 100.99 }),
    userId: z.number().int().openapi({ example: 1 }),
    auctionId: z.number().int().openapi({ example: 1 }),
  })
  .openapi("BidInput");

export const BidModel = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    amount: z.number().openapi({ example: 100.99 }),
    userId: z.number().int().openapi({ example: 1 }),
    auctionId: z.number().int().openapi({ example: 1 }),
    placedAt: z.date().openapi({ example: new Date(Date.now()).toISOString() }),
  })
  .openapi("Bid");

export const BidModelWithAuction = z.object({
  id: z.number().int().openapi({ example: 1 }),
  amount: z.number().openapi({ example: 100.99 }),
  userId: z.number().int().openapi({ example: 1 }),
  auctionId: z.number().int().openapi({ example: 1 }),
  placedAt: z.date().openapi({ example: new Date(Date.now()).toISOString() }),
  auction: AuctionModel,
});

export interface IBidModelWithAuction
  extends z.infer<typeof BidModelWithAuction> {
  auction: IncludeAuction;
}

export interface CompleteBid extends z.infer<typeof BidModel> {
  bidder: CompleteUser;
  auction: CompleteAuction;
}

/**
 * RelatedBidModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedBidModel: z.ZodSchema<CompleteBid> = z.lazy(() =>
  BidModel.extend({
    bidder: RelatedUserModel,
    auction: RelatedAuctionModel,
  }),
);
