/*
  Warnings:

  - Added the required column `tagName` to the `ToolTags` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toolName` to the `ToolTags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ToolTags" ADD COLUMN     "tagName" TEXT NOT NULL,
ADD COLUMN     "toolName" TEXT NOT NULL;
