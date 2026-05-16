-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "emailSentAt" TIMESTAMP(3),
ADD COLUMN     "emailStatus" "MessageStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "whatsappSentAt" TIMESTAMP(3),
ADD COLUMN     "whatsappStatus" "MessageStatus" NOT NULL DEFAULT 'PENDING';
