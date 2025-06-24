/*
  Warnings:

  - You are about to drop the column `current_value` on the `inventory_alert` table. All the data in the column will be lost.
  - You are about to drop the column `is_resolved` on the `inventory_alert` table. All the data in the column will be lost.
  - You are about to drop the column `threshold_value` on the `inventory_alert` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `inventory_alert` table. All the data in the column will be lost.
  - You are about to drop the column `break_end_time` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `break_start_time` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `closing_time` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `day_of_week` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `is_24_hours` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `is_open` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `opening_time` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `store_hours` table. All the data in the column will be lost.
  - You are about to drop the column `helpful_count` on the `store_review` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `store_review` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `store_review` table. All the data in the column will be lost.
  - You are about to drop the column `review_text` on the `store_review` table. All the data in the column will be lost.
  - You are about to drop the `dashboard_action_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `dashboard_notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `store_performance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `close_time` to the `store_hours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day` to the `store_hours` table without a default value. This is not possible if the table is not empty.
  - Added the required column `open_time` to the `store_hours` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "inventory_alert" DROP CONSTRAINT "inventory_alert_product_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_alert" DROP CONSTRAINT "inventory_alert_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_hours" DROP CONSTRAINT "store_hours_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_performance" DROP CONSTRAINT "store_performance_store_id_fkey";

-- DropForeignKey
ALTER TABLE "store_review" DROP CONSTRAINT "store_review_store_id_fkey";

-- DropIndex
DROP INDEX "inventory_alert_store_id_is_resolved_idx";

-- DropIndex
DROP INDEX "inventory_alert_store_id_priority_idx";

-- DropIndex
DROP INDEX "store_hours_store_id_day_of_week_key";

-- DropIndex
DROP INDEX "store_review_store_id_rating_idx";

-- DropIndex
DROP INDEX "store_review_store_id_user_id_order_id_key";

-- AlterTable
ALTER TABLE "inventory_alert" DROP COLUMN "current_value",
DROP COLUMN "is_resolved",
DROP COLUMN "threshold_value",
DROP COLUMN "updated_at",
ADD COLUMN     "resolved" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "alert_type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "store_hours" DROP COLUMN "break_end_time",
DROP COLUMN "break_start_time",
DROP COLUMN "closing_time",
DROP COLUMN "created_at",
DROP COLUMN "day_of_week",
DROP COLUMN "is_24_hours",
DROP COLUMN "is_open",
DROP COLUMN "opening_time",
DROP COLUMN "updated_at",
ADD COLUMN     "close_time" TEXT NOT NULL,
ADD COLUMN     "day" TEXT NOT NULL,
ADD COLUMN     "open_time" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "store_review" DROP COLUMN "helpful_count",
DROP COLUMN "is_featured",
DROP COLUMN "is_verified",
DROP COLUMN "review_text",
ADD COLUMN     "comment" TEXT;

-- DropTable
DROP TABLE "dashboard_action_log";

-- DropTable
DROP TABLE "dashboard_notification";

-- DropTable
DROP TABLE "store_performance";

-- CreateTable
CREATE TABLE "earnings_report" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "report_period" "ReportPeriod" NOT NULL DEFAULT 'DAILY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_earnings" INTEGER NOT NULL DEFAULT 0,
    "gross_sales" INTEGER NOT NULL DEFAULT 0,
    "total_deductions" INTEGER NOT NULL DEFAULT 0,
    "net_earnings" INTEGER NOT NULL DEFAULT 0,
    "average_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_orders" INTEGER NOT NULL DEFAULT 0,
    "completed_orders" INTEGER NOT NULL DEFAULT 0,
    "cancelled_orders" INTEGER NOT NULL DEFAULT 0,
    "returned_orders" INTEGER NOT NULL DEFAULT 0,
    "refunded_orders" INTEGER NOT NULL DEFAULT 0,
    "pending_orders" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "cancellation_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "return_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customer_acquisition_cost" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customer_lifetime_value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_products_sold" INTEGER NOT NULL DEFAULT 0,
    "unique_products_sold" INTEGER NOT NULL DEFAULT 0,
    "best_performing_category" TEXT,
    "worst_performing_category" TEXT,
    "report_data" JSONB,
    "export_urls" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "earnings_report_seller_id_start_date_idx" ON "earnings_report"("seller_id", "start_date");

-- CreateIndex
CREATE INDEX "earnings_report_store_id_start_date_idx" ON "earnings_report"("store_id", "start_date");

-- AddForeignKey
ALTER TABLE "earnings_report" ADD CONSTRAINT "earnings_report_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings_report" ADD CONSTRAINT "earnings_report_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alert" ADD CONSTRAINT "inventory_alert_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alert" ADD CONSTRAINT "inventory_alert_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_review" ADD CONSTRAINT "store_review_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
