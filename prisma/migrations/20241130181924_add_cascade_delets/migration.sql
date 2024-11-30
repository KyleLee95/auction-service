-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_auctionId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnAuctions" DROP CONSTRAINT "CategoriesOnAuctions_auctionId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnAuctions" DROP CONSTRAINT "CategoriesOnAuctions_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnWatchlists" DROP CONSTRAINT "CategoriesOnWatchlists_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnAuctions" ADD CONSTRAINT "CategoriesOnAuctions_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnAuctions" ADD CONSTRAINT "CategoriesOnAuctions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnWatchlists" ADD CONSTRAINT "CategoriesOnWatchlists_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
