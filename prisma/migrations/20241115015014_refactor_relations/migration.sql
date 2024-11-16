-- DropForeignKey
ALTER TABLE "WatchList" DROP CONSTRAINT "WatchList_auctionId_fkey";

-- AlterTable
ALTER TABLE "WatchList" ALTER COLUMN "auctionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "WatchList" ADD CONSTRAINT "WatchList_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
