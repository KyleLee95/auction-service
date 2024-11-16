/*
  Warnings:

  - You are about to drop the column `clasedAt` on the `Auction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Auction" DROP COLUMN "clasedAt",
ADD COLUMN     "closedAt" TIMESTAMP(3);
