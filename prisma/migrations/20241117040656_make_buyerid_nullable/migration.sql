-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_buyerId_fkey";

-- AlterTable
ALTER TABLE "Auction" ALTER COLUMN "buyerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("awsId") ON DELETE SET NULL ON UPDATE CASCADE;
