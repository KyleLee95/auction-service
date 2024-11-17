/*
  Warnings:

  - A unique constraint covering the columns `[awsId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `buyerId` on table `Auction` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `awsId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_buyerId_fkey";

-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_sellerId_fkey";

-- DropForeignKey
ALTER TABLE "Bid" DROP CONSTRAINT "Bid_userId_fkey";

-- DropForeignKey
ALTER TABLE "WatchList" DROP CONSTRAINT "WatchList_userId_fkey";

-- AlterTable
ALTER TABLE "Auction" ALTER COLUMN "sellerId" SET DATA TYPE TEXT,
ALTER COLUMN "buyerId" SET NOT NULL,
ALTER COLUMN "buyerId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Bid" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "awsId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WatchList" ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_awsId_key" ON "User"("awsId");

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("awsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("awsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("awsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchList" ADD CONSTRAINT "WatchList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("awsId") ON DELETE RESTRICT ON UPDATE CASCADE;
