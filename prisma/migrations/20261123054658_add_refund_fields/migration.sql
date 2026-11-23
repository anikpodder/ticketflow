-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundReference" TEXT,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
