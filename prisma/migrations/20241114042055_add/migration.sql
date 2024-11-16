/*
  Warnings:

  - You are about to drop the column `priceLimit` on the `WatchList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WatchList" DROP COLUMN "priceLimit";

-- CreateTable
CREATE TABLE "CategoriesOnWatchLists" (
    "watchlistId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CategoriesOnWatchLists_pkey" PRIMARY KEY ("watchlistId","categoryId")
);

-- AddForeignKey
ALTER TABLE "CategoriesOnWatchLists" ADD CONSTRAINT "CategoriesOnWatchLists_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "WatchList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnWatchLists" ADD CONSTRAINT "CategoriesOnWatchLists_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
