-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('ORDER', 'INVENTORY', 'PAYMENT', 'PROMOTION', 'SYSTEM', 'REVIEW', 'SETTLEMENT');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "seller_notification" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "category" "NotificationCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "related_order_id" INTEGER,
    "related_product_id" INTEGER,
    "related_payment_id" INTEGER,
    "related_settlement_id" INTEGER,
    "action_url" TEXT,
    "action_data" JSONB,
    "metadata" JSONB,
    "expires_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_notification_preferences" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "notify_new_orders" BOOLEAN NOT NULL DEFAULT true,
    "notify_order_updates" BOOLEAN NOT NULL DEFAULT true,
    "notify_order_cancellations" BOOLEAN NOT NULL DEFAULT true,
    "notify_low_stock" BOOLEAN NOT NULL DEFAULT true,
    "notify_out_of_stock" BOOLEAN NOT NULL DEFAULT true,
    "notify_stock_alerts" BOOLEAN NOT NULL DEFAULT true,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "notify_payment_updates" BOOLEAN NOT NULL DEFAULT true,
    "notify_payment_failures" BOOLEAN NOT NULL DEFAULT true,
    "notify_settlements" BOOLEAN NOT NULL DEFAULT true,
    "notify_withdrawals" BOOLEAN NOT NULL DEFAULT true,
    "notify_offer_requests" BOOLEAN NOT NULL DEFAULT true,
    "notify_promotion_updates" BOOLEAN NOT NULL DEFAULT true,
    "notify_system_updates" BOOLEAN NOT NULL DEFAULT true,
    "notify_policy_changes" BOOLEAN NOT NULL DEFAULT false,
    "notify_new_reviews" BOOLEAN NOT NULL DEFAULT true,
    "notify_review_responses" BOOLEAN NOT NULL DEFAULT true,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "in_app_notifications" BOOLEAN NOT NULL DEFAULT true,
    "quiet_hours_enabled" BOOLEAN NOT NULL DEFAULT false,
    "quiet_hours_start" TEXT,
    "quiet_hours_end" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template" (
    "id" SERIAL NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "title_template" TEXT NOT NULL,
    "message_template" TEXT NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery" (
    "id" SERIAL NOT NULL,
    "notification_id" INTEGER NOT NULL,
    "delivery_method" TEXT NOT NULL,
    "delivery_status" TEXT NOT NULL,
    "delivery_provider" TEXT,
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_notification_seller_id_idx" ON "seller_notification"("seller_id");

-- CreateIndex
CREATE INDEX "seller_notification_store_id_idx" ON "seller_notification"("store_id");

-- CreateIndex
CREATE INDEX "seller_notification_category_idx" ON "seller_notification"("category");

-- CreateIndex
CREATE INDEX "seller_notification_status_idx" ON "seller_notification"("status");

-- CreateIndex
CREATE INDEX "seller_notification_priority_idx" ON "seller_notification"("priority");

-- CreateIndex
CREATE INDEX "seller_notification_created_at_idx" ON "seller_notification"("created_at");

-- CreateIndex
CREATE INDEX "seller_notification_expires_at_idx" ON "seller_notification"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "seller_notification_preferences_seller_id_key" ON "seller_notification_preferences"("seller_id");

-- CreateIndex
CREATE INDEX "seller_notification_preferences_seller_id_idx" ON "seller_notification_preferences"("seller_id");

-- CreateIndex
CREATE INDEX "seller_notification_preferences_store_id_idx" ON "seller_notification_preferences"("store_id");

-- CreateIndex
CREATE INDEX "notification_template_category_idx" ON "notification_template"("category");

-- CreateIndex
CREATE INDEX "notification_template_is_active_idx" ON "notification_template"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_category_type_key" ON "notification_template"("category", "type");

-- CreateIndex
CREATE INDEX "notification_delivery_notification_id_idx" ON "notification_delivery"("notification_id");

-- CreateIndex
CREATE INDEX "notification_delivery_delivery_status_idx" ON "notification_delivery"("delivery_status");

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_related_order_id_fkey" FOREIGN KEY ("related_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_related_payment_id_fkey" FOREIGN KEY ("related_payment_id") REFERENCES "seller_payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification" ADD CONSTRAINT "seller_notification_related_settlement_id_fkey" FOREIGN KEY ("related_settlement_id") REFERENCES "seller_settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification_preferences" ADD CONSTRAINT "seller_notification_preferences_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_notification_preferences" ADD CONSTRAINT "seller_notification_preferences_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_delivery" ADD CONSTRAINT "notification_delivery_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "seller_notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
