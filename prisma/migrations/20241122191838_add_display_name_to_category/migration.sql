/*
  Warnings:

  - You are about to drop the column `name` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[displayName]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paramName]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayName` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paramName` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "name",
ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "paramName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_displayName_key" ON "Category"("displayName");

-- CreateIndex
CREATE UNIQUE INDEX "Category_paramName_key" ON "Category"("paramName");
