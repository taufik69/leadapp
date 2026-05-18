-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "emailMessage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappMessage" TEXT NOT NULL DEFAULT '';
