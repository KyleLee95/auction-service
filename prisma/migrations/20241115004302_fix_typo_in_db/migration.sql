/*
  Warnings:

  - You are about to drop the column `buyItNowEnabeld` on the `Auction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Auction" DROP COLUMN "buyItNowEnabeld",
ADD COLUMN     "buyItNowEnabeled" BOOLEAN NOT NULL DEFAULT false;
