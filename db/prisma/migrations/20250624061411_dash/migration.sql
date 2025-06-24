-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('PRODUCT_ADDED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'STORE_OPENED', 'STORE_CLOSED', 'STORE_SETTINGS_UPDATED', 'SALES_REPORT_GENERATED', 'INVENTORY_UPDATED', 'ORDER_STATUS_CHANGED', 'DISCOUNT_CREATED', 'PROMOTION_LAUNCHED', 'DASHBOARD_VIEWED', 'NOTIFICATION_READ');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'HIGH_DEMAND', 'PRICE_CHANGE', 'EXPIRY_WARNING', 'QUALITY_ISSUE', 'REORDER_POINT');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'PROMOTION', 'ORDER_UPDATE', 'INVENTORY_ALERT', 'SYSTEM_UPDATE');

-- CreateTable
CREATE TABLE "seller" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "business_license" TEXT,
    "tax_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(3),

    CONSTRAINT "seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_analytics" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daily_sales_amount" INTEGER NOT NULL DEFAULT 0,
    "daily_orders_count" INTEGER NOT NULL DEFAULT 0,
    "daily_revenue" INTEGER NOT NULL DEFAULT 0,
    "total_products_sold" INTEGER NOT NULL DEFAULT 0,
    "total_customers_served" INTEGER NOT NULL DEFAULT 0,
    "average_order_value" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "inventory_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_report" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "report_type" "ReportType" NOT NULL DEFAULT 'DAILY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_sales_amount" INTEGER NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "total_products_sold" INTEGER NOT NULL,
    "total_customers" INTEGER NOT NULL,
    "best_selling_product_id" INTEGER,
    "worst_selling_product_id" INTEGER,
    "profit_margin" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "return_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customer_satisfaction_score" DOUBLE PRECISION,
    "peak_sales_hour" TEXT,
    "slowest_sales_hour" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "report_data" JSONB,

    CONSTRAINT "sales_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_performance" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "total_lifetime_sales" INTEGER NOT NULL DEFAULT 0,
    "total_lifetime_orders" INTEGER NOT NULL DEFAULT 0,
    "total_customers" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "inventory_turnover_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_sale_date" TIMESTAMP(3),
    "peak_hours" JSONB,
    "monthly_growth_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "customer_retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hours" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "opening_time" TEXT,
    "closing_time" TEXT,
    "break_start_time" TEXT,
    "break_end_time" TEXT,
    "is_24_hours" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_action_log" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "action_type" "ActionType" NOT NULL,
    "action_description" TEXT NOT NULL,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_action_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_alert" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "alert_type" "AlertType" NOT NULL DEFAULT 'LOW_STOCK',
    "threshold_value" INTEGER NOT NULL,
    "current_value" INTEGER NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "message" TEXT,
    "priority" "AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_review" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_notification" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "action_url" TEXT,
    "action_text" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_sellerTostore" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_sellerTostore_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_user_id_key" ON "seller"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_analytics_seller_id_store_id_date_key" ON "seller_analytics"("seller_id", "store_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "store_performance_store_id_key" ON "store_performance"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_hours_store_id_day_of_week_key" ON "store_hours"("store_id", "day_of_week");

-- CreateIndex
CREATE INDEX "dashboard_action_log_seller_id_created_at_idx" ON "dashboard_action_log"("seller_id", "created_at");

-- CreateIndex
CREATE INDEX "dashboard_action_log_store_id_created_at_idx" ON "dashboard_action_log"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_alert_store_id_is_resolved_idx" ON "inventory_alert"("store_id", "is_resolved");

-- CreateIndex
CREATE INDEX "inventory_alert_store_id_priority_idx" ON "inventory_alert"("store_id", "priority");

-- CreateIndex
CREATE INDEX "store_review_store_id_rating_idx" ON "store_review"("store_id", "rating");

-- CreateIndex
CREATE UNIQUE INDEX "store_review_store_id_user_id_order_id_key" ON "store_review"("store_id", "user_id", "order_id");

-- CreateIndex
CREATE INDEX "dashboard_notification_seller_id_is_read_idx" ON "dashboard_notification"("seller_id", "is_read");

-- CreateIndex
CREATE INDEX "dashboard_notification_store_id_is_urgent_idx" ON "dashboard_notification"("store_id", "is_urgent");

-- CreateIndex
CREATE INDEX "_sellerTostore_B_index" ON "_sellerTostore"("B");

-- AddForeignKey
ALTER TABLE "seller" ADD CONSTRAINT "seller_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_analytics" ADD CONSTRAINT "seller_analytics_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_analytics" ADD CONSTRAINT "seller_analytics_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_report" ADD CONSTRAINT "sales_report_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_report" ADD CONSTRAINT "sales_report_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_report" ADD CONSTRAINT "sales_report_best_selling_product_id_fkey" FOREIGN KEY ("best_selling_product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_report" ADD CONSTRAINT "sales_report_worst_selling_product_id_fkey" FOREIGN KEY ("worst_selling_product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_performance" ADD CONSTRAINT "store_performance_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alert" ADD CONSTRAINT "inventory_alert_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_alert" ADD CONSTRAINT "inventory_alert_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_review" ADD CONSTRAINT "store_review_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_review" ADD CONSTRAINT "store_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_review" ADD CONSTRAINT "store_review_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sellerTostore" ADD CONSTRAINT "_sellerTostore_A_fkey" FOREIGN KEY ("A") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_sellerTostore" ADD CONSTRAINT "_sellerTostore_B_fkey" FOREIGN KEY ("B") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
