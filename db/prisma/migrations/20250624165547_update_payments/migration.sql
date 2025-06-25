-- AlterTable
ALTER TABLE "store_hours" ADD COLUMN     "is_closed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "close_time" DROP NOT NULL,
ALTER COLUMN "open_time" DROP NOT NULL;

-- CreateTable
CREATE TABLE "store_performance" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "total_lifetime_sales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_lifetime_orders" INTEGER NOT NULL DEFAULT 0,
    "total_customers" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "last_sale_date" TIMESTAMP(3),
    "inventory_turnover_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_growth_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "customer_retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_performance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_performance_store_id_key" ON "store_performance"("store_id");

-- CreateIndex
CREATE INDEX "store_performance_store_id_idx" ON "store_performance"("store_id");

-- AddForeignKey
ALTER TABLE "store_performance" ADD CONSTRAINT "store_performance_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
