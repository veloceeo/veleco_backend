/*
  Warnings:

  - You are about to drop the column `name` on the `admin` table. All the data in the column will be lost.
  - Added the required column `first_name` to the `admin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `admin` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "admin" DROP COLUMN "name",
ADD COLUMN     "first_name" TEXT NOT NULL,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "last_name" TEXT NOT NULL,
ALTER COLUMN "type" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "type" SET DEFAULT 'USER';
