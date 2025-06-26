/*
  Warnings:

  - The values [OPEN,CLOSED] on the enum `StoreStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StoreStatus_new" AS ENUM ('open', 'closed');
ALTER TABLE "store" ALTER COLUMN "store_status" DROP DEFAULT;
ALTER TABLE "store" ALTER COLUMN "store_status" TYPE "StoreStatus_new" USING ("store_status"::text::"StoreStatus_new");
ALTER TYPE "StoreStatus" RENAME TO "StoreStatus_old";
ALTER TYPE "StoreStatus_new" RENAME TO "StoreStatus";
DROP TYPE "StoreStatus_old";
ALTER TABLE "store" ALTER COLUMN "store_status" SET DEFAULT 'open';
COMMIT;

-- AlterTable
ALTER TABLE "store" ALTER COLUMN "store_status" SET DEFAULT 'open';
