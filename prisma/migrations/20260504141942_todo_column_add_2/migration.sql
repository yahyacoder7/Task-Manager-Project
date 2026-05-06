/*
  Warnings:

  - You are about to drop the column `exprectedTime` on the `Todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "exprectedTime",
ADD COLUMN     "expectedTime" "ExpectedTime";
