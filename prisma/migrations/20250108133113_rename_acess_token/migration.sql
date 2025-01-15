/*
  Warnings:

  - You are about to drop the column `AcessToken` on the `Session` table. All the data in the column will be lost.
  - Added the required column `acessToken` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "AcessToken",
ADD COLUMN     "acessToken" TEXT NOT NULL;
