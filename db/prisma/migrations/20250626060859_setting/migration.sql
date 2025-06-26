-- CreateEnum
CREATE TYPE "StoreOpenStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('MANAGER', 'STAFF', 'CASHIER', 'INVENTORY_MANAGER');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('SAVINGS', 'CURRENT', 'BUSINESS');

-- AlterTable
ALTER TABLE "store" ADD COLUMN     "open" "StoreOpenStatus" NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "store_staff" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "staff_name" TEXT NOT NULL,
    "staff_email" TEXT NOT NULL,
    "staff_phone" TEXT,
    "role" "StaffRole" NOT NULL DEFAULT 'STAFF',
    "permissions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hired_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_bank_account" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "account_holder_name" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" TEXT NOT NULL,
    "branch_name" TEXT,
    "account_type" "BankAccountType" NOT NULL DEFAULT 'SAVINGS',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profile_update" (
    "id" SERIAL NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "update_reason" TEXT,
    "requires_verification" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_profile_update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_session" (
    "id" TEXT NOT NULL,
    "seller_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_info" TEXT,
    "ip_address" TEXT,
    "login_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "logout_time" TIMESTAMP(3),
    "logout_reason" TEXT,

    CONSTRAINT "seller_session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_staff_staff_email_key" ON "store_staff"("staff_email");

-- CreateIndex
CREATE INDEX "store_staff_store_id_idx" ON "store_staff"("store_id");

-- CreateIndex
CREATE INDEX "store_staff_seller_id_idx" ON "store_staff"("seller_id");

-- CreateIndex
CREATE INDEX "store_staff_staff_email_idx" ON "store_staff"("staff_email");

-- CreateIndex
CREATE INDEX "seller_bank_account_seller_id_idx" ON "seller_bank_account"("seller_id");

-- CreateIndex
CREATE INDEX "seller_bank_account_store_id_idx" ON "seller_bank_account"("store_id");

-- CreateIndex
CREATE INDEX "seller_bank_account_is_primary_idx" ON "seller_bank_account"("is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "seller_bank_account_seller_id_account_number_key" ON "seller_bank_account"("seller_id", "account_number");

-- CreateIndex
CREATE INDEX "seller_profile_update_seller_id_idx" ON "seller_profile_update"("seller_id");

-- CreateIndex
CREATE INDEX "seller_profile_update_field_name_idx" ON "seller_profile_update"("field_name");

-- CreateIndex
CREATE INDEX "seller_profile_update_created_at_idx" ON "seller_profile_update"("created_at");

-- CreateIndex
CREATE INDEX "seller_session_seller_id_idx" ON "seller_session"("seller_id");

-- CreateIndex
CREATE INDEX "seller_session_user_id_idx" ON "seller_session"("user_id");

-- CreateIndex
CREATE INDEX "seller_session_expires_at_idx" ON "seller_session"("expires_at");

-- CreateIndex
CREATE INDEX "seller_session_is_active_idx" ON "seller_session"("is_active");

-- AddForeignKey
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_bank_account" ADD CONSTRAINT "seller_bank_account_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_bank_account" ADD CONSTRAINT "seller_bank_account_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profile_update" ADD CONSTRAINT "seller_profile_update_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_session" ADD CONSTRAINT "seller_session_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_session" ADD CONSTRAINT "seller_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
