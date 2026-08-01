import { describe, expect, it } from "vitest";
import {
  analyzeDeal,
  buildAmortizationSchedule,
  maxBidForTargetRoi,
  summarizeProperty,
  type CostGroup,
  type ExpenseStatus,
  type PropertySummaryInput,
  type SummaryExpense,
} from "./finance";

const FIRST_DUE = new Date("2026-03-10T00:00:00.000Z");

const sumPrincipal = (rows: Array<{ principalCents: number }>) =>
  rows.reduce((acc, row) => acc + row.principalCents, 0);

function expense(
  amountCents: number,
  group: CostGroup,
  categoryKey: string,
  status: ExpenseStatus = "PAID",
  isLoanInterestOrFee = false,
): SummaryExpense {
  return {
    amountCents,
    status,
    group,
    categoryKey,
    categoryName: null,
    incurredOn: new Date("2026-04-05T00:00:00.000Z"),
    isLoanInterestOrFee,
  };
}

function summaryInput(
  overrides: Partial<PropertySummaryInput> = {},
): PropertySummaryInput {
  return {
    purchasePriceCents: 42_000_000,
    purchaseDate: new Date("2026-01-15T00:00:00.000Z"),
    targetSalePriceCents: null,
    soldPriceCents: null,
    soldDate: null,
    brokerCommissionBps: 0,
    capitalGainsRateBps: 0,
    itbiRateBps: 0,
    auctionCommissionBps: 0,
    expenses: [],
    loans: [],
    ...overrides,
  };
}

describe("buildAmortizationSchedule", () => {
  it.each(["SAC", "PRICE"] as const)(
    "allocates the exact principal across %s rows",
    (system) => {
      const rows = buildAmortizationSchedule({
        principalCents: 42_000_000,
        annualRateBps: 1180,
        termMonths: 13,
        system,
        firstDueDate: FIRST_DUE,
      });
      expect(rows).toHaveLength(13);
      expect(sumPrincipal(rows)).toBe(42_000_000);
    },
  );

  it("charges no interest at a 0% rate on SAC", () => {
    const rows = buildAmortizationSchedule({
      principalCents: 12_000_000,
      annualRateBps: 0,
      termMonths: 5,
      system: "SAC",
      firstDueDate: FIRST_DUE,
    });
    expect(rows.every((row) => row.interestCents === 0)).toBe(true);
    expect(rows.every((row) => row.totalCents === 2_400_000)).toBe(true);
    expect(sumPrincipal(rows)).toBe(12_000_000);
  });

  it("charges no interest at a 0% rate on PRICE", () => {
    const rows = buildAmortizationSchedule({
      principalCents: 12_000_001,
      annualRateBps: 0,
      termMonths: 5,
      system: "PRICE",
      firstDueDate: FIRST_DUE,
    });
    expect(rows.every((row) => row.interestCents === 0)).toBe(true);
    expect(sumPrincipal(rows)).toBe(12_000_001);
  });

  it("adds insurance and admin fees to every installment", () => {
    const rows = buildAmortizationSchedule({
      principalCents: 30_000_000,
      annualRateBps: 1200,
      termMonths: 6,
      system: "SAC",
      firstDueDate: FIRST_DUE,
      monthlyInsuranceCents: 12_000,
      monthlyAdminFeeCents: 3_500,
    });
    expect(rows.every((row) => row.feesCents === 15_500)).toBe(true);
    expect(
      rows.every(
        (row) =>
          row.totalCents ===
          row.principalCents + row.interestCents + row.feesCents,
      ),
    ).toBe(true);
  });

  it("returns no rows for a zero term or zero principal", () => {
    const noTerm = buildAmortizationSchedule({
      principalCents: 42_000_000,
      annualRateBps: 1200,
      termMonths: 0,
      system: "SAC",
      firstDueDate: FIRST_DUE,
    });
    const noPrincipal = buildAmortizationSchedule({
      principalCents: 0,
      annualRateBps: 1200,
      termMonths: 24,
      system: "PRICE",
      firstDueDate: FIRST_DUE,
    });
    expect(noTerm).toEqual([]);
    expect(noPrincipal).toEqual([]);
  });
});

describe("summarizeProperty buckets", () => {
  it("splits expenses by group, category and status", () => {
    const summary = summarizeProperty(
      summaryInput({
        expenses: [
          expense(1_000_000, "RENOVATION", "painting", "PLANNED"),
          expense(500_000, "RENOVATION", "painting", "PENDING"),
          expense(2_000_000, "RENOVATION", "painting", "PAID"),
          expense(300_000, "HOLDING", "iptu", "PAID"),
        ],
      }),
    );

    expect(summary.byGroup.RENOVATION).toEqual({
      planned: 1_000_000,
      pending: 500_000,
      paid: 2_000_000,
      actual: 2_000_000,
    });
    expect(
      summary.byCategory.find((category) => category.key === "painting"),
    ).toEqual({
      key: "painting",
      planned: 1_000_000,
      pending: 500_000,
      paid: 2_000_000,
      actual: 2_000_000,
      projected: 3_500_000,
    });
    expect(summary.totalCostActual).toBe(44_300_000);
    expect(summary.totalCostProjected).toBe(45_800_000);
  });

  it("ignores expenses mirrored from loan installments", () => {
    const summary = summarizeProperty(
      summaryInput({
        expenses: [
          expense(150_000, "FINANCING", "loan_interest", "PAID", true),
        ],
      }),
    );

    expect(summary.byGroup.FINANCING.actual).toBe(0);
    expect(summary.totalCostActual).toBe(42_000_000);
    expect(summary.byCategory.some((c) => c.key === "loan_interest")).toBe(
      false,
    );
  });

  it("counts paid installment interest and fees, not outstanding principal", () => {
    const summary = summarizeProperty(
      summaryInput({
        loans: [
          {
            principalCents: 20_000_000,
            installments: [
              {
                principalCents: 5_000_000,
                interestCents: 300_000,
                feesCents: 20_000,
                paidOn: new Date("2026-04-10T00:00:00.000Z"),
              },
              {
                principalCents: 15_000_000,
                interestCents: 250_000,
                feesCents: 20_000,
                paidOn: null,
              },
            ],
          },
        ],
      }),
    );

    expect(summary.byGroup.FINANCING.actual).toBe(320_000);
    expect(summary.financedPrincipalOutstanding).toBe(15_000_000);
    expect(summary.totalCostActual).toBe(42_320_000);
    expect(summary.cashInvestedActual).toBe(27_320_000);
  });

  it("returns null ROI when there is nothing invested", () => {
    const summary = summarizeProperty(
      summaryInput({
        purchasePriceCents: 0,
        targetSalePriceCents: 10_000_000,
      }),
    );

    expect(summary.cashInvestedActual).toBe(0);
    expect(summary.roiOnCashActual).toBeNull();
    expect(summary.roiOnTotalActual).toBeNull();
  });
});

describe("summarizeProperty acquisition rates", () => {
  it("derives ITBI and auction commission from the purchase price", () => {
    const summary = summarizeProperty(
      summaryInput({ itbiRateBps: 200, auctionCommissionBps: 500 }),
    );

    expect(summary.byGroup.TAXES_AND_FEES.actual).toBe(840_000);
    expect(summary.byGroup.ACQUISITION.actual).toBe(44_100_000);
    expect(summary.totalCostActual).toBe(44_940_000);
    expect(summary.totalCostProjected).toBe(44_940_000);
    expect(summary.byCategory.map((category) => category.key)).toEqual([
      "auction_commission",
      "itbi",
      "purchase_price",
    ]);
  });

  it("matches the deal calculator for the same acquisition", () => {
    const deal = analyzeDeal({
      purchasePriceCents: 42_000_000,
      auctionCommissionBps: 500,
      itbiRateBps: 200,
      deedAndRegistryCents: 0,
      legalFeesCents: 0,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 0,
      monthlyHoldingCents: 0,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 0,
      expectedSalePriceCents: 0,
      capitalGainsRateBps: 0,
      renovationItems: [],
    });
    const summary = summarizeProperty(
      summaryInput({ itbiRateBps: 200, auctionCommissionBps: 500 }),
    );

    expect(summary.totalCostActual).toBe(deal.acquisitionTotalCents);
  });

  it("prefers a logged ITBI expense over the rate estimate", () => {
    const summary = summarizeProperty(
      summaryInput({
        itbiRateBps: 200,
        expenses: [expense(900_000, "TAXES_AND_FEES", "itbi", "PAID")],
      }),
    );

    expect(summary.byGroup.TAXES_AND_FEES.actual).toBe(900_000);
    expect(summary.totalCostActual).toBe(42_900_000);
  });

  it("prefers a logged auction commission even when it is still pending", () => {
    const summary = summarizeProperty(
      summaryInput({
        auctionCommissionBps: 500,
        expenses: [
          expense(1_800_000, "ACQUISITION", "auction_commission", "PENDING"),
        ],
      }),
    );

    expect(summary.byGroup.ACQUISITION.pending).toBe(1_800_000);
    expect(summary.byGroup.ACQUISITION.actual).toBe(42_000_000);
    expect(summary.totalCostProjected).toBe(43_800_000);
  });
});

describe("summarizeProperty broker commission", () => {
  it("estimates the commission from the rate when none is logged", () => {
    const summary = summarizeProperty(
      summaryInput({
        brokerCommissionBps: 600,
        soldPriceCents: 50_000_000,
        soldDate: new Date("2026-07-15T00:00:00.000Z"),
      }),
    );

    expect(summary.brokerCommissionCents).toBe(3_000_000);
    expect(summary.netProfitActual).toBe(5_000_000);
  });

  it("deducts a logged commission only once", () => {
    const summary = summarizeProperty(
      summaryInput({
        brokerCommissionBps: 600,
        soldPriceCents: 50_000_000,
        soldDate: new Date("2026-07-15T00:00:00.000Z"),
        expenses: [
          expense(2_500_000, "SELLING", "broker_commission", "PAID"),
        ],
      }),
    );

    expect(summary.brokerCommissionCents).toBe(2_500_000);
    expect(summary.totalCostActual).toBe(44_500_000);
    expect(summary.netProfitActual).toBe(5_500_000);
  });

  it("still deducts a logged commission that has not been paid yet", () => {
    const summary = summarizeProperty(
      summaryInput({
        brokerCommissionBps: 600,
        soldPriceCents: 50_000_000,
        soldDate: new Date("2026-07-15T00:00:00.000Z"),
        expenses: [
          expense(2_500_000, "SELLING", "broker_commission", "PENDING"),
        ],
      }),
    );

    expect(summary.brokerCommissionCents).toBe(2_500_000);
    expect(summary.totalCostActual).toBe(42_000_000);
    expect(summary.netProfitActual).toBe(5_500_000);
    expect(summary.netProfitProjected).toBe(5_500_000);
  });
});

describe("analyzeDeal", () => {
  it("derives auction commission, ITBI and renovation totals", () => {
    const result = analyzeDeal({
      purchasePriceCents: 42_000_000,
      auctionCommissionBps: 500,
      itbiRateBps: 200,
      deedAndRegistryCents: 250_000,
      legalFeesCents: 500_000,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 6,
      monthlyHoldingCents: 90_000,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 600,
      expectedSalePriceCents: 62_000_000,
      capitalGainsRateBps: 1500,
      renovationItems: [
        { quantity: 60, unitPriceCents: 45_000 },
        { quantity: 1, unitPriceCents: 350_000 },
      ],
    });

    expect(result.auctionCommissionCents).toBe(2_100_000);
    expect(result.itbiCents).toBe(840_000);
    expect(result.acquisitionTotalCents).toBe(45_690_000);
    expect(result.renovationTotalCents).toBe(3_050_000);
    expect(result.holdingTotalCents).toBe(540_000);
    expect(result.netProfitCents).toBeGreaterThan(0);
  });

  it("clamps capital gains to zero when the sale is below cost", () => {
    const result = analyzeDeal({
      purchasePriceCents: 42_000_000,
      auctionCommissionBps: 500,
      itbiRateBps: 200,
      deedAndRegistryCents: 0,
      legalFeesCents: 0,
      arrearsIptuCents: 0,
      arrearsCondoCents: 0,
      evictionCostCents: 0,
      otherAcquisitionCents: 0,
      holdingMonths: 6,
      monthlyHoldingCents: 100_000,
      financedAmountCents: 0,
      annualRateBps: 0,
      brokerCommissionBps: 600,
      expectedSalePriceCents: 40_000_000,
      capitalGainsRateBps: 1500,
      renovationItems: [],
    });

    expect(result.capitalGainsEstimateCents).toBe(0);
    expect(result.netProfitCents).toBeLessThan(0);
  });
});

describe("maxBidForTargetRoi", () => {
  const scenario = {
    auctionCommissionBps: 500,
    itbiRateBps: 200,
    deedAndRegistryCents: 250_000,
    legalFeesCents: 0,
    arrearsIptuCents: 0,
    arrearsCondoCents: 0,
    evictionCostCents: 0,
    otherAcquisitionCents: 0,
    holdingMonths: 6,
    monthlyHoldingCents: 90_000,
    financedAmountCents: 0,
    annualRateBps: 0,
    brokerCommissionBps: 600,
    expectedSalePriceCents: 62_000_000,
    capitalGainsRateBps: 1500,
    renovationItems: [{ quantity: 60, unitPriceCents: 45_000 }],
  };

  it("returns a bid that reaches the target ROI", () => {
    const bid = maxBidForTargetRoi({ ...scenario, targetRoi: 0.25 });
    const atBid = analyzeDeal({ ...scenario, purchasePriceCents: bid });

    expect(bid).toBeGreaterThan(0);
    expect(bid).toBeLessThan(scenario.expectedSalePriceCents);
    expect(atBid.roiOnCash ?? 0).toBeGreaterThanOrEqual(0.25);
  });

  it("returns zero when the target ROI is unreachable", () => {
    expect(maxBidForTargetRoi({ ...scenario, targetRoi: 50 })).toBe(0);
  });
});
