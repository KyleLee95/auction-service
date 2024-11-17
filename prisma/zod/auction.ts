import * as z from "zod";
import {
  type CompleteUser,
  type CompleteBid,
  type CompleteCategory,
  type CompleteWatchList,
  type CompleteAuctionsOnWatchLists,
  RelatedAuctionsOnWatchListsModel,
  RelatedBidModel,
  RelatedUserModel,
  RelatedCategoryModel,
  RelatedWatchListModel,
} from "./index";

export const AuctionModelInput = z
  .object({
    title: z.string().openapi({ example: "Cool Auction Title" }),
    description: z.string().openapi({ example: "Cool description" }),
    startPrice: z.number().openapi({ example: 0.99 }), // Accepts number from client
    shippingPrice: z.number().openapi({ example: 0.99 }),
    startTime: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    endTime: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    isActive: z.boolean().openapi({ example: true }),
    buyerId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    sellerId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    quantity: z.number().int().openapi({ example: 10 }),
    buyItNowEnabled: z.boolean().openapi({ example: false }),
    deleted: z.boolean().openapi({ example: false }),
    flagged: z.boolean().openapi({ example: false }),
    closedAt: z.coerce
      .date()
      .optional()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    createdAt: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    updatedAt: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
  })
  .openapi("AuctionInput");

// Input schema for client input (expects `startPrice` as `number`)
export const AuctionModel = z
  .object({
    id: z.number().int().optional().openapi({ example: 1 }),
    title: z.string().openapi({ example: "Cool Auction Title" }),
    description: z.string().openapi({ example: "Cool description" }),
    startPrice: z.number().openapi({ example: 0.99 }), // Accepts number from client
    shippingPrice: z.number().openapi({ example: 0.99 }),
    startTime: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    endTime: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    isActive: z.boolean().openapi({ example: true }),
    buyerId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" })
      .optional(),
    sellerId: z
      .string()
      .openapi({ example: "c1eb0520-90a1-7030-7847-c8ca5bfbe65e" }),
    quantity: z.number().int().openapi({ example: 10 }),
    buyItNowEnabled: z.boolean().openapi({ example: false }),
    deleted: z.boolean().openapi({ example: false }),
    flagged: z.boolean().openapi({ example: false }),
    closedAt: z.coerce
      .date()
      .optional()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    createdAt: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
    updatedAt: z.coerce
      .date()
      .openapi({ example: new Date(Date.now()).toISOString() }),
  })
  .openapi("Auction");

// CompleteAuction interface with explicit types
export interface CompleteAuction {
  id?: number;
  title: string;
  description: string;
  startPrice: number;
  shippingPrice: number;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  buyItNowEnabled: boolean;
  deleted: boolean;
  flagged: boolean;
  sellerId: string;
  buyerId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  seller: CompleteUser;
  bids: CompleteBid[];
  categories: CompleteCategory[];
  watchlist: CompleteWatchList[];
}

export interface IncludeAuction {
  id?: number;
  title: string;
  description: string;
  startPrice: number;
  shippingPrice: number;
  startTime: Date;
  endTime: Date;
  quantity: number;
  isActive: boolean;
  buyItNowEnabled: boolean;
  deleted: boolean;
  flagged: boolean;
  sellerId: string;
  buyerId?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  seller: CompleteUser;
  bids: CompleteBid[];
}

export interface CompleteAuction extends z.infer<typeof AuctionModel> {
  seller: CompleteUser;
  buyer?: CompleteUser | null;
  bids: CompleteBid[];
  categories: CompleteCategory[];
  watchlist: CompleteWatchList[];
  AuctionsOnWatchLists: CompleteAuctionsOnWatchLists[];
}

/**
 * RelatedAuctionModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedAuctionModel: z.ZodSchema<CompleteAuction> = z.lazy(() =>
  AuctionModel.extend({
    seller: RelatedUserModel,
    buyer: RelatedUserModel.nullish(),
    bids: RelatedBidModel.array(),
    categories: RelatedCategoryModel.array(),
    watchlist: RelatedWatchListModel.array(),
    AuctionsOnWatchLists: RelatedAuctionsOnWatchListsModel.array(),
  }),
);
