-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "ownerName" TEXT,
    "shopAddress" TEXT,
    "city" TEXT,
    "photoUrl" TEXT,
    "facebookPage" TEXT,
    "instagramPage" TEXT,
    "phoneNumber" TEXT,
    "whatsappNumber" TEXT,
    "email" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_phoneNumber_key" ON "leads"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "leads_whatsappNumber_key" ON "leads"("whatsappNumber");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "leads"("email");
