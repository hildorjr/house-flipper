-- CreateSchema
-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('PROSPECT', 'UNDER_CONTRACT', 'OWNED_RENOVATING', 'LISTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('HOUSE', 'APARTMENT', 'LAND', 'COMMERCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AcquisitionChannel" AS ENUM ('JUDICIAL_AUCTION', 'EXTRAJUDICIAL_AUCTION', 'BANK_DIRECT_SALE', 'PRIVATE_SALE', 'INHERITANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "CostGroup" AS ENUM ('ACQUISITION', 'TAXES_AND_FEES', 'RENOVATION', 'HOLDING', 'FINANCING', 'SELLING', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PLANNED', 'PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CARD', 'BOLETO', 'CASH', 'TRANSFER', 'FINANCED', 'OTHER');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY');

-- CreateEnum
CREATE TYPE "AmortizationSystem" AS ENUM ('SAC', 'PRICE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('MASON', 'ELECTRICIAN', 'PLUMBER', 'PAINTER', 'CARPENTER', 'GLAZIER', 'ROOFER', 'ARCHITECT', 'ENGINEER', 'LAWYER', 'BROKER', 'CLEANER', 'MOVER', 'GENERAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('RECEIPT', 'INVOICE', 'CONTRACT', 'DEED', 'PHOTO_BEFORE', 'PHOTO_AFTER', 'REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "Profile" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "fullName" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pt-BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "country" TEXT NOT NULL DEFAULT 'BR',
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "type" "PropertyType" NOT NULL DEFAULT 'HOUSE',
    "status" "PropertyStatus" NOT NULL DEFAULT 'PROSPECT',
    "acquisitionChannel" "AcquisitionChannel" NOT NULL DEFAULT 'JUDICIAL_AUCTION',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "district" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "areaTotalM2" DECIMAL(10,2),
    "areaBuiltM2" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpots" INTEGER,
    "yearBuilt" INTEGER,
    "purchasePriceCents" INTEGER,
    "purchaseDate" DATE,
    "appraisedValueCents" INTEGER,
    "marketValueCents" INTEGER,
    "targetSalePriceCents" INTEGER,
    "itbiRateBps" INTEGER,
    "auctionCommissionBps" INTEGER,
    "soldPriceCents" INTEGER,
    "soldDate" DATE,
    "brokerCommissionBps" INTEGER,
    "capitalGainsRateBps" INTEGER,
    "coverImagePath" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseCategory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "group" "CostGroup" NOT NULL,
    "key" TEXT,
    "name" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isRecurringByDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerId" UUID,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "incurredOn" DATE NOT NULL,
    "paidOn" DATE,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PAID',
    "paymentMethod" "PaymentMethod",
    "contactId" UUID,
    "taskId" UUID,
    "recurringRuleId" UUID,
    "periodKey" TEXT,
    "loanInstallmentId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringExpenseRule" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedAmountCents" INTEGER NOT NULL,
    "frequency" "Frequency" NOT NULL DEFAULT 'MONTHLY',
    "dayOfMonth" INTEGER NOT NULL DEFAULT 10,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "generatedThrough" DATE,

    CONSTRAINT "RecurringExpenseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "lender" TEXT NOT NULL,
    "principalCents" INTEGER NOT NULL,
    "annualRateBps" INTEGER NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "system" "AmortizationSystem" NOT NULL DEFAULT 'SAC',
    "firstDueDate" DATE NOT NULL,
    "monthlyInsuranceCents" INTEGER NOT NULL DEFAULT 0,
    "monthlyAdminFeeCents" INTEGER NOT NULL DEFAULT 0,
    "originationFeeCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanInstallment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "loanId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" DATE NOT NULL,
    "principalCents" INTEGER NOT NULL,
    "interestCents" INTEGER NOT NULL,
    "feesCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "paidOn" DATE,

    CONSTRAINT "LoanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "propertyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "categoryId" UUID,
    "contactId" UUID,
    "plannedBudgetCents" INTEGER,
    "startDate" DATE,
    "dueDate" DATE,
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "trade" "TradeType" NOT NULL DEFAULT 'GENERAL',
    "companyName" TEXT,
    "taxId" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "rating" INTEGER,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "propertyId" UUID,
    "expenseId" UUID,
    "kind" "AttachmentKind" NOT NULL DEFAULT 'RECEIPT',
    "storagePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAnalysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "propertyType" "PropertyType" NOT NULL DEFAULT 'APARTMENT',
    "acquisitionChannel" "AcquisitionChannel" NOT NULL DEFAULT 'JUDICIAL_AUCTION',
    "areaBuiltM2" DECIMAL(10,2),
    "purchasePriceCents" INTEGER NOT NULL DEFAULT 0,
    "appraisedValueCents" INTEGER,
    "auctionCommissionBps" INTEGER NOT NULL DEFAULT 500,
    "itbiRateBps" INTEGER NOT NULL DEFAULT 300,
    "deedAndRegistryCents" INTEGER NOT NULL DEFAULT 0,
    "legalFeesCents" INTEGER NOT NULL DEFAULT 0,
    "arrearsIptuCents" INTEGER NOT NULL DEFAULT 0,
    "arrearsCondoCents" INTEGER NOT NULL DEFAULT 0,
    "evictionCostCents" INTEGER NOT NULL DEFAULT 0,
    "otherAcquisitionCents" INTEGER NOT NULL DEFAULT 0,
    "holdingMonths" INTEGER NOT NULL DEFAULT 6,
    "monthlyHoldingCents" INTEGER NOT NULL DEFAULT 0,
    "financedAmountCents" INTEGER NOT NULL DEFAULT 0,
    "annualRateBps" INTEGER NOT NULL DEFAULT 0,
    "brokerCommissionBps" INTEGER NOT NULL DEFAULT 600,
    "expectedSalePriceCents" INTEGER NOT NULL DEFAULT 0,
    "capitalGainsRateBps" INTEGER NOT NULL DEFAULT 1500,
    "convertedPropertyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealAnalysisItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "analysisId" UUID NOT NULL,
    "presetKey" TEXT,
    "label" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'un',
    "unitPriceCents" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DealAnalysisItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenovationPreset" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "defaultUnitPriceCents" INTEGER NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BR',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RenovationPreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_stripeCustomerId_key" ON "Profile"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_ownerId_key" ON "Subscription"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Property_ownerId_status_idx" ON "Property"("ownerId", "status");

-- CreateIndex
CREATE INDEX "ExpenseCategory_ownerId_idx" ON "ExpenseCategory"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_key_key" ON "ExpenseCategory"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_loanInstallmentId_key" ON "Expense"("loanInstallmentId");

-- CreateIndex
CREATE INDEX "Expense_propertyId_incurredOn_idx" ON "Expense"("propertyId", "incurredOn");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_recurringRuleId_periodKey_key" ON "Expense"("recurringRuleId", "periodKey");

-- CreateIndex
CREATE UNIQUE INDEX "LoanInstallment_loanId_number_key" ON "LoanInstallment"("loanId", "number");

-- CreateIndex
CREATE INDEX "Task_propertyId_status_idx" ON "Task"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Contact_ownerId_trade_idx" ON "Contact"("ownerId", "trade");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storagePath_key" ON "Attachment"("storagePath");

-- CreateIndex
CREATE UNIQUE INDEX "RenovationPreset_key_key" ON "RenovationPreset"("key");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recurringRuleId_fkey" FOREIGN KEY ("recurringRuleId") REFERENCES "RecurringExpenseRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpenseRule" ADD CONSTRAINT "RecurringExpenseRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringExpenseRule" ADD CONSTRAINT "RecurringExpenseRule_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanInstallment" ADD CONSTRAINT "LoanInstallment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAnalysis" ADD CONSTRAINT "DealAnalysis_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealAnalysisItem" ADD CONSTRAINT "DealAnalysisItem_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "DealAnalysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
