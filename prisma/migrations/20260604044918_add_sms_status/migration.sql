-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "smsSentAt" TIMESTAMP(3),
ADD COLUMN     "smsStatus" "MessageStatus" NOT NULL DEFAULT 'PENDING';
