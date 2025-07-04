/*
  Warnings:

  - You are about to drop the column `phone` on the `seller` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `seller` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `_sellerTostore` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[seller_email]` on the table `seller` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seller_email` to the `seller` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_name` to the `seller` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_password` to the `seller` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_phone` to the `seller` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seller_id` to the `store` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_sellerTostore" DROP CONSTRAINT "_sellerTostore_A_fkey";

-- DropForeignKey
ALTER TABLE "_sellerTostore" DROP CONSTRAINT "_sellerTostore_B_fkey";

-- DropForeignKey
ALTER TABLE "seller" DROP CONSTRAINT "seller_user_id_fkey";

-- DropForeignKey
ALTER TABLE "store" DROP CONSTRAINT "store_user_id_fkey";

-- DropIndex
DROP INDEX "seller_user_id_key";

-- AlterTable
ALTER TABLE "seller" DROP COLUMN "phone",
DROP COLUMN "user_id",
ADD COLUMN     "seller_address" TEXT,
ADD COLUMN     "seller_email" TEXT NOT NULL,
ADD COLUMN     "seller_image" TEXT,
ADD COLUMN     "seller_latitude" DOUBLE PRECISION,
ADD COLUMN     "seller_longitude" DOUBLE PRECISION,
ADD COLUMN     "seller_name" TEXT NOT NULL,
ADD COLUMN     "seller_password" TEXT NOT NULL,
ADD COLUMN     "seller_phone" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'seller';

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "seller_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'user';

-- DropTable
DROP TABLE "_sellerTostore";

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "admin" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'admin'
);

-- CreateTable
CREATE TABLE "session" (
    "id" SERIAL NOT NULL,
    "session_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "seller_seller_email_key" ON "seller"("seller_email");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
