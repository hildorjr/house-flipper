import { z } from "zod";

export const propertyStatuses = [
  "PROSPECT",
  "UNDER_CONTRACT",
  "OWNED_RENOVATING",
  "LISTED",
  "SOLD",
  "ARCHIVED",
] as const;

export const propertyTypes = [
  "HOUSE",
  "APARTMENT",
  "LAND",
  "COMMERCIAL",
  "OTHER",
] as const;

export const acquisitionChannels = [
  "JUDICIAL_AUCTION",
  "EXTRAJUDICIAL_AUCTION",
  "BANK_DIRECT_SALE",
  "PRIVATE_SALE",
  "INHERITANCE",
  "OTHER",
] as const;

const nullableString = z.string().trim().max(5_000).nullable().optional();
const nullableNumber = z.number().finite().nullable().optional();
const nullableInteger = z.number().int().nullable().optional();

export const propertyInputSchema = z.object({
  label: z.string().trim().min(1).max(200),
  type: z.enum(propertyTypes),
  status: z.enum(propertyStatuses),
  acquisitionChannel: z.enum(acquisitionChannels),
  currency: z.string().trim().length(3).default("BRL"),
  street: nullableString,
  number: nullableString,
  complement: nullableString,
  district: nullableString,
  city: nullableString,
  state: nullableString,
  postalCode: nullableString,
  country: z.string().trim().length(2).default("BR"),
  areaTotalM2: nullableNumber,
  areaBuiltM2: nullableNumber,
  bedrooms: nullableInteger,
  bathrooms: nullableInteger,
  parkingSpots: nullableInteger,
  yearBuilt: nullableInteger,
  purchasePriceCents: nullableInteger,
  purchaseDate: z.string().date().nullable().optional(),
  appraisedValueCents: nullableInteger,
  marketValueCents: nullableInteger,
  targetSalePriceCents: nullableInteger,
  itbiRateBps: nullableInteger,
  auctionCommissionBps: nullableInteger,
  soldPriceCents: nullableInteger,
  soldDate: z.string().date().nullable().optional(),
  brokerCommissionBps: nullableInteger,
  capitalGainsRateBps: nullableInteger,
  notes: nullableString,
});

export type PropertyInput = z.input<typeof propertyInputSchema>;
