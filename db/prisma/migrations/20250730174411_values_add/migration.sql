-- CreateTable
CREATE TABLE "add_on_value" (
    "id" SERIAL NOT NULL,
    "categries_type" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "add_on" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "add_on_value_pkey" PRIMARY KEY ("id")
);
