/*
  Warnings:

  - You are about to drop the column `is_closed` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the `seller_balance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seller_payment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seller_settlement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `settlement_detail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_performance` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `close_time` on table `store_hours` required. This step will fail if there are existing NULL values in that column.
  - Made the column `open_time` on table `store_hours` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "seller_balance" DROP CONSTRAINT "seller_balance_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_balance" DROP CONSTRAINT "seller_balance_store_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_payment" DROP CONSTRAINT "seller_payment_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_payment" DROP CONSTRAINT "seller_payment_settlement_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_payment" DROP CONSTRAINT "seller_payment_store_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_settlement" DROP CONSTRAINT "seller_settlement_seller_id_fkey";

-- DropForeignKey
ALTER TABLE "seller_settlement" DROP CONSTRAINT "seller_settlement_store_id_fkey";

-- DropForeignKey
ALTER TABLE "settlement_detail" DROP CONSTRAINT "settlement_detail_order_id_fkey";

-- DropForeignKey
ALTER TABLE "settlement_detail" DROP CONSTRAINT "settlement_detail_settlement_id_fkey";

-- DropForeignKey
ALTER TABLE "store_performance" DROP CONSTRAINT "store_performance_store_id_fkey";

-- AlterTable
ALTER TABLE "store_hours" DROP COLUMN "is_closed",
ALTER COLUMN "close_time" SET NOT NULL,
ALTER COLUMN "open_time" SET NOT NULL;

-- DropTable
DROP TABLE "seller_balance";

-- DropTable
DROP TABLE "seller_payment";

-- DropTable
DROP TABLE "seller_settlement";

-- DropTable
DROP TABLE "settlement_detail";

-- DropTable
DROP TABLE "store_performance";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "SettlementStatus";
