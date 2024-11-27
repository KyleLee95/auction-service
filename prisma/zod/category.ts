import * as z from "zod";
import {
  type CompleteAuction,
  type CompleteCategoriesOnWatchLists,
  RelatedAuctionModel,
  RelatedCategoriesOnWatchListsModel,
} from "./index";

export const CategoryModelInput = z
  .object({
    label: z.string(),
    value: z.string(),
  })
  .openapi("CategoryInput");

export const CategoryModel = z
  .object({
    id: z.number().int().openapi({ example: 1 }),
    label: z.string().openapi({ example: "Autos" }),
    value: z.string().openapi({ example: "autos" }),
  })
  .openapi("Category");

export interface IncludeCategory {
  id: number;
  label: string;
  value: string;
}

export interface CompleteCategory extends z.infer<typeof CategoryModel> {
  auctions: CompleteAuction[];
  watchlists: CompleteCategoriesOnWatchLists[];
}

/**
 * RelatedCategoryModel contains all relations on your model in addition to the scalars
 *
 * NOTE: Lazy required in case of potential circular dependencies within schema
 */
export const RelatedCategoryModel: z.ZodSchema<CompleteCategory> = z.lazy(() =>
  CategoryModel.extend({
    auctions: RelatedAuctionModel.array(),
    watchlists: RelatedCategoriesOnWatchListsModel.array(),
  }),
);
