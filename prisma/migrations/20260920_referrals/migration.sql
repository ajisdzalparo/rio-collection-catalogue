-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "discountAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralCodeId" TEXT,
ADD COLUMN     "referralCodeSnapshot" TEXT,
ADD COLUMN     "referralDiscountMode" TEXT,
ADD COLUMN     "referralDiscountValue" INTEGER,
ADD COLUMN     "referralGiftEveryUnits" INTEGER,
ADD COLUMN     "referralPartnerSnapshot" TEXT,
ADD COLUMN     "referralPayoutId" TEXT,
ADD COLUMN     "referralRewardAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referralRewardKind" TEXT,
ADD COLUMN     "referralRewardMode" TEXT,
ADD COLUMN     "referralRewardValue" INTEGER;

-- CreateTable
CREATE TABLE "ReferralPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discountMode" TEXT NOT NULL,
    "discountValue" INTEGER NOT NULL,
    "rewardKind" TEXT NOT NULL,
    "rewardMode" TEXT,
    "rewardValue" INTEGER,
    "giftEveryUnits" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralPayout" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralGiftDelivery" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralGiftDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_partnerId_idx" ON "ReferralCode"("partnerId");

-- CreateIndex
CREATE INDEX "ReferralPayout_partnerId_paidAt_idx" ON "ReferralPayout"("partnerId", "paidAt");

-- CreateIndex
CREATE INDEX "ReferralGiftDelivery_codeId_deliveredAt_idx" ON "ReferralGiftDelivery"("codeId", "deliveredAt");

-- CreateIndex
CREATE INDEX "ReferralGiftDelivery_partnerId_idx" ON "ReferralGiftDelivery"("partnerId");

-- CreateIndex
CREATE INDEX "Order_referralCodeId_status_idx" ON "Order"("referralCodeId", "status");

-- CreateIndex
CREATE INDEX "Order_referralPayoutId_idx" ON "Order"("referralPayoutId");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralPayout" ADD CONSTRAINT "ReferralPayout_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralGiftDelivery" ADD CONSTRAINT "ReferralGiftDelivery_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralGiftDelivery" ADD CONSTRAINT "ReferralGiftDelivery_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_referralPayoutId_fkey" FOREIGN KEY ("referralPayoutId") REFERENCES "ReferralPayout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
