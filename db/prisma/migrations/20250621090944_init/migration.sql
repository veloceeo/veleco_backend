-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('open', 'close');

-- CreateEnum
CREATE TYPE "StoreType" AS ENUM ('retail', 'wholesale', 'online', 'other');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "created_At" TIMESTAMP(3),
    "role" "Role" NOT NULL DEFAULT 'customer',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_At" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "pan_number" TEXT NOT NULL,
    "adhar_number" TEXT NOT NULL,
    "gst_number" TEXT NOT NULL,
    "store_open" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "store_close" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "store_status" "StoreStatus" NOT NULL DEFAULT 'open',
    "store_type" "StoreType" NOT NULL DEFAULT 'retail',

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "created_At" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_At" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "store_email_key" ON "store"("email");

-- CreateIndex
CREATE UNIQUE INDEX "store_pan_number_key" ON "store"("pan_number");

-- CreateIndex
CREATE UNIQUE INDEX "store_adhar_number_key" ON "store"("adhar_number");

-- CreateIndex
CREATE UNIQUE INDEX "store_gst_number_key" ON "store"("gst_number");

-- AddForeignKey
ALTER TABLE "store" ADD CONSTRAINT "store_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
