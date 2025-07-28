-- CreateTable
CREATE TABLE "seller_caps" (
    "id" SERIAL NOT NULL,
    "daily_order" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "subscription_type" INTEGER NOT NULL,
    "seller_id" INTEGER NOT NULL,

    CONSTRAINT "seller_caps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "seller_caps_tier_key" ON "seller_caps"("tier");

-- AddForeignKey
ALTER TABLE "seller_caps" ADD CONSTRAINT "seller_caps_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
