-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('TECHNICAL_ISSUE', 'BILLING', 'ACCOUNT', 'PRODUCT', 'ORDER', 'PAYMENT', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_RESPONSE', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateTable
CREATE TABLE "support_ticket" (
    "id" SERIAL NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "user_id" INTEGER,
    "seller_id" INTEGER,
    "store_id" INTEGER,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "contact_name" TEXT,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "browser_info" TEXT,
    "device_info" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "page_url" TEXT,
    "assigned_to" TEXT,
    "resolution" TEXT,
    "resolution_date" TIMESTAMP(3),
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_response_at" TIMESTAMP(3),

    CONSTRAINT "support_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_response" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "is_from_customer" BOOLEAN NOT NULL DEFAULT false,
    "author_type" TEXT NOT NULL,
    "author_name" TEXT,
    "author_email" TEXT,
    "author_id" TEXT,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_email_log" (
    "id" SERIAL NOT NULL,
    "ticket_id" INTEGER NOT NULL,
    "email_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" TIMESTAMP(3),
    "error_message" TEXT,
    "message_id" TEXT,
    "provider" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_email_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TicketCategory" NOT NULL,
    "subject_template" TEXT NOT NULL,
    "body_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "support_ticket_ticket_number_key" ON "support_ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "support_ticket_ticket_number_idx" ON "support_ticket"("ticket_number");

-- CreateIndex
CREATE INDEX "support_ticket_user_id_idx" ON "support_ticket"("user_id");

-- CreateIndex
CREATE INDEX "support_ticket_seller_id_idx" ON "support_ticket"("seller_id");

-- CreateIndex
CREATE INDEX "support_ticket_store_id_idx" ON "support_ticket"("store_id");

-- CreateIndex
CREATE INDEX "support_ticket_status_idx" ON "support_ticket"("status");

-- CreateIndex
CREATE INDEX "support_ticket_category_idx" ON "support_ticket"("category");

-- CreateIndex
CREATE INDEX "support_ticket_priority_idx" ON "support_ticket"("priority");

-- CreateIndex
CREATE INDEX "support_ticket_created_at_idx" ON "support_ticket"("created_at");

-- CreateIndex
CREATE INDEX "support_ticket_contact_email_idx" ON "support_ticket"("contact_email");

-- CreateIndex
CREATE INDEX "ticket_response_ticket_id_idx" ON "ticket_response"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_response_created_at_idx" ON "ticket_response"("created_at");

-- CreateIndex
CREATE INDEX "ticket_response_is_from_customer_idx" ON "ticket_response"("is_from_customer");

-- CreateIndex
CREATE INDEX "ticket_response_author_type_idx" ON "ticket_response"("author_type");

-- CreateIndex
CREATE INDEX "ticket_email_log_ticket_id_idx" ON "ticket_email_log"("ticket_id");

-- CreateIndex
CREATE INDEX "ticket_email_log_email_type_idx" ON "ticket_email_log"("email_type");

-- CreateIndex
CREATE INDEX "ticket_email_log_status_idx" ON "ticket_email_log"("status");

-- CreateIndex
CREATE INDEX "ticket_email_log_recipient_email_idx" ON "ticket_email_log"("recipient_email");

-- CreateIndex
CREATE INDEX "ticket_email_log_created_at_idx" ON "ticket_email_log"("created_at");

-- CreateIndex
CREATE INDEX "ticket_template_category_idx" ON "ticket_template"("category");

-- CreateIndex
CREATE INDEX "ticket_template_is_active_idx" ON "ticket_template"("is_active");

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_response" ADD CONSTRAINT "ticket_response_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_email_log" ADD CONSTRAINT "ticket_email_log_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
