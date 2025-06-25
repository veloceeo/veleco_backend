-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'WALLET', 'CARD', 'CHEQUE');

-- CreateTable
CREATE TABLE "seller_settlement" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "settlement_period_start" TIMESTAMP(3) NOT NULL,
    "settlement_period_end" TIMESTAMP(3) NOT NULL,
    "total_sales_amount" DOUBLE PRECISION NOT NULL,
    "platform_commission" DOUBLE PRECISION NOT NULL,
    "tax_deduction" DOUBLE PRECISION NOT NULL,
    "other_deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_settlement_amount" DOUBLE PRECISION NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod",
    "transaction_reference" TEXT,
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_detail" (
    "id" SERIAL NOT NULL,
    "settlement_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "order_amount" DOUBLE PRECISION NOT NULL,
    "commission_rate" DOUBLE PRECISION NOT NULL,
    "commission_amount" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_payment" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "settlement_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "transaction_reference" TEXT,
    "payment_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "failure_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_balance" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "pending_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "available_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_settlement_date" TIMESTAMP(3),
    "next_settlement_date" TIMESTAMP(3),
    "total_lifetime_earnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_withdrawals" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_rate" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_balance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_settlement_seller_id_idx" ON "seller_settlement"("seller_id");

-- CreateIndex
CREATE INDEX "seller_settlement_store_id_idx" ON "seller_settlement"("store_id");

-- CreateIndex
CREATE INDEX "seller_settlement_status_idx" ON "seller_settlement"("status");

-- CreateIndex
CREATE INDEX "seller_settlement_settlement_period_start_settlement_period_idx" ON "seller_settlement"("settlement_period_start", "settlement_period_end");

-- CreateIndex
CREATE INDEX "settlement_detail_settlement_id_idx" ON "settlement_detail"("settlement_id");

-- CreateIndex
CREATE INDEX "settlement_detail_order_id_idx" ON "settlement_detail"("order_id");

-- CreateIndex
CREATE INDEX "seller_payment_seller_id_idx" ON "seller_payment"("seller_id");

-- CreateIndex
CREATE INDEX "seller_payment_store_id_idx" ON "seller_payment"("store_id");

-- CreateIndex
CREATE INDEX "seller_payment_status_idx" ON "seller_payment"("status");

-- CreateIndex
CREATE INDEX "seller_payment_due_date_idx" ON "seller_payment"("due_date");

-- CreateIndex
CREATE INDEX "seller_payment_payment_date_idx" ON "seller_payment"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "seller_balance_seller_id_key" ON "seller_balance"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "seller_balance_store_id_key" ON "seller_balance"("store_id");

-- CreateIndex
CREATE INDEX "seller_balance_seller_id_idx" ON "seller_balance"("seller_id");

-- CreateIndex
CREATE INDEX "seller_balance_store_id_idx" ON "seller_balance"("store_id");

-- AddForeignKey
ALTER TABLE "seller_settlement" ADD CONSTRAINT "seller_settlement_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_settlement" ADD CONSTRAINT "seller_settlement_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_detail" ADD CONSTRAINT "settlement_detail_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "seller_settlement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_detail" ADD CONSTRAINT "settlement_detail_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_payment" ADD CONSTRAINT "seller_payment_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_payment" ADD CONSTRAINT "seller_payment_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_payment" ADD CONSTRAINT "seller_payment_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "seller_settlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_balance" ADD CONSTRAINT "seller_balance_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_balance" ADD CONSTRAINT "seller_balance_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
