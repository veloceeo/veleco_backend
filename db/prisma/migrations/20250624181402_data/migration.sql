/*
  Warnings:

  - A unique constraint covering the columns `[seller_id,store_id]` on the table `seller_balance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "seller_balance_seller_id_store_id_key" ON "seller_balance"("seller_id", "store_id");
