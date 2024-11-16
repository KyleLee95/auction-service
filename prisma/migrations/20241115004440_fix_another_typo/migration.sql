/*
  Warnings:

  - You are about to drop the column `buyItNowEnabeled` on the `Auction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Auction" DROP COLUMN "buyItNowEnabeled",
ADD COLUMN     "buyItNowEnabled" BOOLEAN NOT NULL DEFAULT false;
