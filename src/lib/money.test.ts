import { describe, expect, it } from "vitest";
import { formatMoney, parseMoneyInput, centsFromBps } from "./money";
import {
  buildAmortizationSchedule,
  summarizeProperty,
  analyzeDeal,
  maxBidForTargetRoi,
} from "./finance";

describe("money", () => {
  it("formats BRL in pt-BR", () => {
    expect(formatMoney(123456, "BRL", "pt-BR")).toMatch(/1\.234,56/);
  });

  it("parses pt-BR input", () => {
    expect(parseMoneyInput("1.234,56", "pt-BR")).toBe(123456);
    expect(parseMoneyInput("R$ 10,00", "pt-BR")).toBe(1000);
  });

  it("parses en-US input", () => {
    expect(parseMoneyInput("1,234.56", "en")).toBe(123456);
  });

  it("computes bps", () => {
    expect(centsFromBps(100_000_00, 500)).toBe(5_000_00);
  });
});

describe("buildAmortizationSchedule SAC", () => {
  it("splits principal evenly and declines interest", () => {
    const rows = buildAmortizationSchedule({
      principalCents: 120_000_00,
      annualRateBps: 1200,
      termMonths: 12,
      system: "SAC",
      firstDueDate: new Date("2026-01-10T00:00:00.000Z"),
    });
    expect(rows).toHaveLength(12);
    expect(rows[0].principalCents).toBe(10_000_00);
    expect(rows[0].interestCents).toBe(120_000);
    expect(rows[11].principalCents).toBe(10_000_00);
    expect(rows[11].interestCents).toBe(10_000);
    const totalPrincipal = rows.reduce((a, r) => a + r.principalCents, 0);
    expect(totalPrincipal).toBe(120_000_00);
  });
});

describe("buildAmortizationSchedule PRICE", () => {
  it("keeps total payment roughly constant", () => {
    const rows = buildAmortizationSchedule({
      principalCents: 100_000_00,
      annualRateBps: 1200,
      termMonths: 12,
      system: "PRICE",
      firstDueDate: new Date("2026-01-10T00:00:00.000Z"),
    });
    expect(rows).toHaveLength(12);
    const first = rows[0].principalCents + rows[0].interestCents;
    const mid = rows[5].principalCents + rows[5].interestCents;
    expect(Math.abs(first - mid)).toBeLessThan(2);
    const totalPrincipal = rows.reduce((a, r) => a + r.principalCents, 0);
    expect(totalPrincipal).toBe(100_000_00);
  });
});

describe("summarizeProperty", () => {
  it("excludes loan principal from cost and counts interest", () => {
    const summary = summarizeProperty({
      purchasePriceCents: 200_000_00,
      purchaseDate: new Date("2026-01-01T00:00:00.000Z"),
      targetSalePriceCents: 350_000_00,
      soldPriceCents: null,
      soldDate: null,
      brokerCommissionBps: 600,
      capitalGainsRateBps: 1500,
      expenses: [
        {
          amountCents: 50_000_00,
          status: "PAID",
          group: "RENOVATION",
          categoryKey: "painting",
          categoryName: null,
          incurredOn: new Date("2026-02-01T00:00:00.000Z"),
        },
      ],
      loans: [
        {
          principalCents: 100_000_00,
          installments: [
            {
              principalCents: 10_000_00,
              interestCents: 1_000_00,
              feesCents: 50_00,
              paidOn: new Date("2026-02-10T00:00:00.000Z"),
            },
            {
              principalCents: 90_000_00,
              interestCents: 9_000_00,
              feesCents: 50_00,
              paidOn: null,
            },
          ],
        },
      ],
    });

    expect(summary.totalCostActual).toBe(200_000_00 + 50_000_00 + 1_050_00);
    expect(summary.financedPrincipalOutstanding).toBe(90_000_00);
    expect(summary.byGroup.FINANCING.actual).toBe(1_050_00);
  });
});

describe("analyzeDeal and maxBid", () => {
  it("computes deal totals", () => {
    const result = analyzeDeal({
      purchasePriceCents: 100_000_00,
      auctionCommissionBps: 500,
      itbiRateBps: 300,
      deedAndRegistryCents: 2_000_00,
      legalFeesCents: 1_000_00,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 6,
      monthlyHoldingCents: 1_000_00,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 600,
      expectedSalePriceCents: 200_000_00,
      capitalGainsRateBps: 1500,
      renovationItems: [{ quantity: 50, unitPriceCents: 4500 }],
    });
    expect(result.auctionCommissionCents).toBe(5_000_00);
    expect(result.itbiCents).toBe(3_000_00);
    expect(result.renovationTotalCents).toBe(225_000);
    expect(result.holdingTotalCents).toBe(6_000_00);
    expect(result.netProfitCents).toBeGreaterThan(0);
  });

  it("finds max bid for target ROI", () => {
    const bid = maxBidForTargetRoi({
      targetRoi: 0.3,
      auctionCommissionBps: 500,
      itbiRateBps: 300,
      deedAndRegistryCents: 0,
      legalFeesCents: 0,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 6,
      monthlyHoldingCents: 0,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 0,
      expectedSalePriceCents: 200_000_00,
      capitalGainsRateBps: 0,
      renovationItems: [],
    });
    expect(bid).toBeGreaterThan(0);
    expect(bid).toBeLessThan(200_000_00);
    const atBid = analyzeDeal({
      purchasePriceCents: bid,
      auctionCommissionBps: 500,
      itbiRateBps: 300,
      deedAndRegistryCents: 0,
      legalFeesCents: 0,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 6,
      monthlyHoldingCents: 0,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 0,
      expectedSalePriceCents: 200_000_00,
      capitalGainsRateBps: 0,
      renovationItems: [],
    });
    expect(atBid.roiOnCash ?? 0).toBeGreaterThanOrEqual(0.3 - 0.01);
  });
});
