/*
  Warnings:

  - You are about to drop the column `userId` on the `Auction` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Auction" DROP CONSTRAINT "Auction_userId_fkey";

-- AlterTable
ALTER TABLE "Auction" DROP COLUMN "userId",
ADD COLUMN     "shippingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0.00;
