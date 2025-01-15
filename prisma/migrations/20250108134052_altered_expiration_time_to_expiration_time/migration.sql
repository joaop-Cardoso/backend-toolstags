/*
  Warnings:

  - You are about to drop the column `expirationTime` on the `Session` table. All the data in the column will be lost.
  - Added the required column `ExpirationTime` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "expirationTime",
ADD COLUMN     "ExpirationTime" TIMESTAMP(3) NOT NULL;
