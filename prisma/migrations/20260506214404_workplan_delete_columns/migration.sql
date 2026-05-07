/*
  Warnings:

  - You are about to drop the column `repeatInterval` on the `Workplan` table. All the data in the column will be lost.
  - You are about to drop the column `repeatUnit` on the `Workplan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Workplan" DROP COLUMN "repeatInterval",
DROP COLUMN "repeatUnit";
