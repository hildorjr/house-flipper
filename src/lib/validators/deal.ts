import { z } from "zod";

const dealItemSchema = z.object({
  presetKey: z.string().trim().min(1).nullable(),
  label: z.string().trim().min(1).max(200),
  categoryKey: z.string().trim().min(1).max(100),
  quantity: z.number().finite().min(0),
  unit: z.string().trim().min(1).max(30),
  unitPriceCents: z.number().int().min(0),
  sortOrder: z.number().int().min(0),
});

export const dealInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  city: z.string().trim().max(200).nullable(),
  state: z.string().trim().max(100).nullable(),
  country: z.string().trim().length(2),
  currency: z.string().trim().length(3),
  propertyType: z.enum(["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"]),
  acquisitionChannel: z.enum([
    "JUDICIAL_AUCTION",
    "EXTRAJUDICIAL_AUCTION",
    "BANK_DIRECT_SALE",
    "PRIVATE_SALE",
    "INHERITANCE",
    "OTHER",
  ]),
  areaBuiltM2: z.number().finite().min(0).nullable(),
  purchasePriceCents: z.number().int().min(0),
  appraisedValueCents: z.number().int().min(0).nullable(),
  auctionCommissionBps: z.number().int().min(0).max(10_000),
  itbiRateBps: z.number().int().min(0).max(10_000),
  deedAndRegistryCents: z.number().int().min(0),
  legalFeesCents: z.number().int().min(0),
  arrearsIptuCents: z.number().int().min(0),
  arrearsCondoCents: z.number().int().min(0),
  evictionCostCents: z.number().int().min(0),
  otherAcquisitionCents: z.number().int().min(0),
  holdingMonths: z.number().int().min(0).max(600),
  monthlyHoldingCents: z.number().int().min(0),
  financedAmountCents: z.number().int().min(0),
  annualRateBps: z.number().int().min(0).max(100_000),
  brokerCommissionBps: z.number().int().min(0).max(10_000),
  expectedSalePriceCents: z.number().int().min(0),
  capitalGainsRateBps: z.number().int().min(0).max(10_000),
  items: z.array(dealItemSchema),
});

export type DealInput = z.infer<typeof dealInputSchema>;
