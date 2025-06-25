-- AlterTable
ALTER TABLE "store_hours" ADD COLUMN     "is_closed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "close_time" DROP NOT NULL,
ALTER COLUMN "open_time" DROP NOT NULL;
