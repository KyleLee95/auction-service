/*
  Warnings:

  - You are about to drop the column `paramName` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[value]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_paramName_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "paramName",
ADD COLUMN     "value" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_value_key" ON "Category"("value");
