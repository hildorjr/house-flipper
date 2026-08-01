import { z } from "zod";

export const saleInputSchema = z.object({
  targetSalePriceCents: z.number().int().min(0).nullable(),
  soldPriceCents: z.number().int().min(0).nullable(),
  soldDate: z.string().date().nullable(),
  brokerCommissionBps: z.number().int().min(0).max(10_000),
  capitalGainsRateBps: z.number().int().min(0).max(10_000),
});

export type SaleInput = z.infer<typeof saleInputSchema>;
