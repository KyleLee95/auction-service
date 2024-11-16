/*
  Warnings:

  - You are about to drop the column `auctionId` on the `WatchList` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "WatchList" DROP CONSTRAINT "WatchList_auctionId_fkey";

-- AlterTable
ALTER TABLE "WatchList" DROP COLUMN "auctionId";
