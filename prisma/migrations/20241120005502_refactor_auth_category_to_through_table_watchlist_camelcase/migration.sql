/*
  Warnings:

  - You are about to drop the `AuctionsOnWatchLists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CategoriesOnWatchLists` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WatchList` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_AuctionCategories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuctionsOnWatchLists" DROP CONSTRAINT "AuctionsOnWatchLists_auctionId_fkey";

-- DropForeignKey
ALTER TABLE "AuctionsOnWatchLists" DROP CONSTRAINT "AuctionsOnWatchLists_watchlistId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnWatchLists" DROP CONSTRAINT "CategoriesOnWatchLists_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnWatchLists" DROP CONSTRAINT "CategoriesOnWatchLists_watchlistId_fkey";

-- DropForeignKey
ALTER TABLE "WatchList" DROP CONSTRAINT "WatchList_userId_fkey";

-- DropForeignKey
ALTER TABLE "_AuctionCategories" DROP CONSTRAINT "_AuctionCategories_A_fkey";

-- DropForeignKey
ALTER TABLE "_AuctionCategories" DROP CONSTRAINT "_AuctionCategories_B_fkey";

-- DropTable
DROP TABLE "AuctionsOnWatchLists";

-- DropTable
DROP TABLE "CategoriesOnWatchLists";

-- DropTable
DROP TABLE "WatchList";

-- DropTable
DROP TABLE "_AuctionCategories";

-- CreateTable
CREATE TABLE "Watchlist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Watchlist',
    "userId" TEXT NOT NULL,

    CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriesOnAuctions" (
    "auctionId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CategoriesOnAuctions_pkey" PRIMARY KEY ("auctionId","categoryId")
);

-- CreateTable
CREATE TABLE "AuctionsOnWatchlists" (
    "watchlistId" INTEGER NOT NULL,
    "auctionId" INTEGER NOT NULL,

    CONSTRAINT "AuctionsOnWatchlists_pkey" PRIMARY KEY ("watchlistId","auctionId")
);

-- CreateTable
CREATE TABLE "CategoriesOnWatchlists" (
    "watchlistId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "CategoriesOnWatchlists_pkey" PRIMARY KEY ("watchlistId","categoryId")
);

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("awsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnAuctions" ADD CONSTRAINT "CategoriesOnAuctions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnAuctions" ADD CONSTRAINT "CategoriesOnAuctions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionsOnWatchlists" ADD CONSTRAINT "AuctionsOnWatchlists_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionsOnWatchlists" ADD CONSTRAINT "AuctionsOnWatchlists_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnWatchlists" ADD CONSTRAINT "CategoriesOnWatchlists_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnWatchlists" ADD CONSTRAINT "CategoriesOnWatchlists_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
