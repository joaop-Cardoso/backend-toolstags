/*
  Warnings:

  - The primary key for the `ToolTags` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ToolTags" DROP CONSTRAINT "ToolTags_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ToolTags_pkey" PRIMARY KEY ("id");
