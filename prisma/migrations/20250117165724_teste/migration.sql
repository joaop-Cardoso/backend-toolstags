/*
  Warnings:

  - Added the required column `ue` to the `ToolTags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ToolTags" ADD COLUMN     "ue" TEXT NOT NULL;
