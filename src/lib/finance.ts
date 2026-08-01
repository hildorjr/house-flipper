export type AmortizationSystem = "SAC" | "PRICE";

export type InstallmentRow = {
  number: number;
  dueDate: Date;
  principalCents: number;
  interestCents: number;
  feesCents: number;
  totalCents: number;
};

export type CostGroup =
  | "ACQUISITION"
  | "TAXES_AND_FEES"
  | "RENOVATION"
  | "HOLDING"
  | "FINANCING"
  | "SELLING"
  | "OTHER";

export type ExpenseStatus = "PLANNED" | "PENDING" | "PAID";

export type SummaryExpense = {
  amountCents: number;
  status: ExpenseStatus;
  group: CostGroup;
  categoryKey: string | null;
  categoryName: string | null;
  incurredOn: Date;
  isLoanInterestOrFee?: boolean;
};

export type SummaryLoan = {
  principalCents: number;
  installments: Array<{
    principalCents: number;
    interestCents: number;
    feesCents: number;
    paidOn: Date | null;
  }>;
};

export type PropertySummaryInput = {
  purchasePriceCents: number;
  purchaseDate: Date | null;
  targetSalePriceCents: number | null;
  soldPriceCents: number | null;
  soldDate: Date | null;
  brokerCommissionBps: number;
  capitalGainsRateBps: number;
  itbiRateBps?: number;
  auctionCommissionBps?: number;
  expenses: SummaryExpense[];
  loans: SummaryLoan[];
};

export type GroupTotals = Record<
  CostGroup,
  { planned: number; pending: number; paid: number; actual: number }
>;

export type CategoryTotal = {
  key: string;
  planned: number;
  pending: number;
  paid: number;
  actual: number;
  projected: number;
};

export type PropertySummary = {
  byGroup: GroupTotals;
  byCategory: CategoryTotal[];
  totalCostActual: number;
  totalCostProjected: number;
  financedPrincipalOutstanding: number;
  cashInvestedActual: number;
  cashInvestedProjected: number;
  salePrice: number | null;
  sellingCostsActual: number;
  brokerCommissionCents: number;
  capitalGainsEstimateCents: number;
  netProfitActual: number | null;
  netProfitProjected: number | null;
  roiOnCashActual: number | null;
  roiOnTotalActual: number | null;
  annualizedRoiActual: number | null;
  monthsHeld: number | null;
};

export type DealAnalysisInput = {
  purchasePriceCents: number;
  auctionCommissionBps: number;
  itbiRateBps: number;
  deedAndRegistryCents: number;
  legalFeesCents: number;
  arrearsIptuCents: number;
  arrearsCondoCents: number;
  evictionCostCents: number;
  otherAcquisitionCents: number;
  holdingMonths: number;
  monthlyHoldingCents: number;
  financedAmountCents: number;
  annualRateBps: number;
  brokerCommissionBps: number;
  expectedSalePriceCents: number;
  capitalGainsRateBps: number;
  renovationItems: Array<{ quantity: number; unitPriceCents: number }>;
};

export type DealAnalysisResult = {
  auctionCommissionCents: number;
  itbiCents: number;
  acquisitionTotalCents: number;
  renovationTotalCents: number;
  holdingTotalCents: number;
  financingInterestEstimateCents: number;
  brokerCommissionCents: number;
  capitalGainsEstimateCents: number;
  sellingTotalCents: number;
  totalCostCents: number;
  cashInvestedCents: number;
  netProfitCents: number;
  roiOnCash: number | null;
  roiOnTotal: number | null;
  annualizedRoi: number | null;
};

export const ITBI_CATEGORY_KEY = "itbi";
export const AUCTION_COMMISSION_CATEGORY_KEY = "auction_commission";
export const BROKER_COMMISSION_CATEGORY_KEY = "broker_commission";

const EMPTY_GROUP = (): GroupTotals[CostGroup] => ({
  planned: 0,
  pending: 0,
  paid: 0,
  actual: 0,
});

function emptyGroups(): GroupTotals {
  return {
    ACQUISITION: EMPTY_GROUP(),
    TAXES_AND_FEES: EMPTY_GROUP(),
    RENOVATION: EMPTY_GROUP(),
    HOLDING: EMPTY_GROUP(),
    FINANCING: EMPTY_GROUP(),
    SELLING: EMPTY_GROUP(),
    OTHER: EMPTY_GROUP(),
  };
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

function monthsBetween(start: Date, end: Date): number {
  const years = end.getUTCFullYear() - start.getUTCFullYear();
  const months = end.getUTCMonth() - start.getUTCMonth();
  const days = end.getUTCDate() - start.getUTCDate();
  let total = years * 12 + months;
  if (days < 0) total -= 1;
  return Math.max(0, total);
}

export function buildAmortizationSchedule(input: {
  principalCents: number;
  annualRateBps: number;
  termMonths: number;
  system: AmortizationSystem;
  firstDueDate: Date;
  monthlyInsuranceCents?: number;
  monthlyAdminFeeCents?: number;
}): InstallmentRow[] {
  const {
    principalCents,
    annualRateBps,
    termMonths,
    system,
    firstDueDate,
    monthlyInsuranceCents = 0,
    monthlyAdminFeeCents = 0,
  } = input;

  if (termMonths <= 0 || principalCents <= 0) return [];

  const monthlyRate = annualRateBps / 10_000 / 12;
  const feesCents = monthlyInsuranceCents + monthlyAdminFeeCents;
  const rows: InstallmentRow[] = [];
  let balance = principalCents;

  if (system === "SAC") {
    const principalPart = Math.floor(principalCents / termMonths);
    let allocated = 0;

    for (let i = 1; i <= termMonths; i++) {
      const interestCents = Math.round(balance * monthlyRate);
      const principalCentsRow =
        i === termMonths ? principalCents - allocated : principalPart;
      allocated += principalCentsRow;
      const totalCents = principalCentsRow + interestCents + feesCents;
      rows.push({
        number: i,
        dueDate: addMonths(firstDueDate, i - 1),
        principalCents: principalCentsRow,
        interestCents,
        feesCents,
        totalCents,
      });
      balance -= principalCentsRow;
    }
    return rows;
  }

  const factor =
    monthlyRate === 0
      ? 1 / termMonths
      : (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
  const payment = Math.round(principalCents * factor);
  let allocatedPrincipal = 0;

  for (let i = 1; i <= termMonths; i++) {
    const interestCents = Math.round(balance * monthlyRate);
    let principalCentsRow = payment - interestCents;
    if (i === termMonths) {
      principalCentsRow = principalCents - allocatedPrincipal;
    }
    allocatedPrincipal += principalCentsRow;
    const totalCents = principalCentsRow + interestCents + feesCents;
    rows.push({
      number: i,
      dueDate: addMonths(firstDueDate, i - 1),
      principalCents: principalCentsRow,
      interestCents,
      feesCents,
      totalCents,
    });
    balance -= principalCentsRow;
  }

  return rows;
}

export function summarizeProperty(input: PropertySummaryInput): PropertySummary {
  const byGroup = emptyGroups();
  const categoryMap = new Map<string, CategoryTotal>();

  const bumpCategory = (
    key: string,
    status: ExpenseStatus,
    amount: number,
  ) => {
    const existing = categoryMap.get(key) ?? {
      key,
      planned: 0,
      pending: 0,
      paid: 0,
      actual: 0,
      projected: 0,
    };
    if (status === "PLANNED") existing.planned += amount;
    if (status === "PENDING") existing.pending += amount;
    if (status === "PAID") existing.paid += amount;
    existing.actual = existing.paid;
    existing.projected = existing.planned + existing.pending + existing.paid;
    categoryMap.set(key, existing);
  };

  if (input.purchasePriceCents > 0) {
    byGroup.ACQUISITION.paid += input.purchasePriceCents;
    byGroup.ACQUISITION.actual += input.purchasePriceCents;
    bumpCategory("purchase_price", "PAID", input.purchasePriceCents);
  }

  for (const expense of input.expenses) {
    if (expense.isLoanInterestOrFee) continue;
    const bucket = byGroup[expense.group];
    if (expense.status === "PLANNED") bucket.planned += expense.amountCents;
    if (expense.status === "PENDING") bucket.pending += expense.amountCents;
    if (expense.status === "PAID") {
      bucket.paid += expense.amountCents;
      bucket.actual += expense.amountCents;
    }
    const key = expense.categoryKey ?? expense.categoryName ?? "misc";
    bumpCategory(key, expense.status, expense.amountCents);
  }

  const applyRateDerivedCost = (
    key: string,
    group: CostGroup,
    bps: number,
  ) => {
    if (categoryMap.has(key)) return;
    const amount = Math.round((input.purchasePriceCents * bps) / 10_000);
    if (amount <= 0) return;
    byGroup[group].paid += amount;
    byGroup[group].actual += amount;
    bumpCategory(key, "PAID", amount);
  };

  applyRateDerivedCost(
    ITBI_CATEGORY_KEY,
    "TAXES_AND_FEES",
    input.itbiRateBps ?? 0,
  );
  applyRateDerivedCost(
    AUCTION_COMMISSION_CATEGORY_KEY,
    "ACQUISITION",
    input.auctionCommissionBps ?? 0,
  );

  let financedPrincipalOutstanding = 0;
  for (const loan of input.loans) {
    let unpaidPrincipal = 0;
    for (const installment of loan.installments) {
      if (!installment.paidOn) {
        unpaidPrincipal += installment.principalCents;
      } else {
        const interestAndFees =
          installment.interestCents + installment.feesCents;
        byGroup.FINANCING.paid += interestAndFees;
        byGroup.FINANCING.actual += interestAndFees;
        bumpCategory("loan_interest", "PAID", installment.interestCents);
        if (installment.feesCents > 0) {
          bumpCategory("loan_fees", "PAID", installment.feesCents);
        }
      }
    }
    financedPrincipalOutstanding += unpaidPrincipal;
  }

  const sumGroup = (g: GroupTotals[CostGroup]) =>
    g.planned + g.pending + g.paid;
  const totalCostActual = Object.values(byGroup).reduce(
    (acc, g) => acc + g.actual,
    0,
  );
  const totalCostProjected = Object.values(byGroup).reduce(
    (acc, g) => acc + sumGroup(g),
    0,
  );

  const cashInvestedActual = Math.max(
    0,
    totalCostActual - financedPrincipalOutstanding,
  );
  const cashInvestedProjected = Math.max(
    0,
    totalCostProjected - financedPrincipalOutstanding,
  );

  const salePrice = input.soldPriceCents ?? input.targetSalePriceCents;
  const brokerBase = salePrice ?? 0;
  const loggedBrokerCommission = categoryMap.get(BROKER_COMMISSION_CATEGORY_KEY);
  const brokerCommissionCents = loggedBrokerCommission
    ? loggedBrokerCommission.projected
    : Math.round((brokerBase * input.brokerCommissionBps) / 10_000);
  const brokerCommissionNotInCosts = (alreadyCounted: number) =>
    Math.max(0, brokerCommissionCents - alreadyCounted);
  const brokerDeductionActual = brokerCommissionNotInCosts(
    loggedBrokerCommission?.actual ?? 0,
  );
  const brokerDeductionProjected = brokerCommissionNotInCosts(
    loggedBrokerCommission?.projected ?? 0,
  );

  const sellingCostsActual = byGroup.SELLING.actual;
  const gainBase =
    salePrice != null
      ? Math.max(0, salePrice - totalCostActual - brokerDeductionActual)
      : 0;
  const capitalGainsEstimateCents = Math.round(
    (gainBase * input.capitalGainsRateBps) / 10_000,
  );

  const endDate = input.soldDate ?? new Date();
  const monthsHeld =
    input.purchaseDate != null
      ? monthsBetween(input.purchaseDate, endDate)
      : null;

  const netProfitActual =
    salePrice != null
      ? salePrice -
        brokerDeductionActual -
        capitalGainsEstimateCents -
        totalCostActual
      : null;

  const netProfitProjected =
    salePrice != null
      ? salePrice -
        brokerDeductionProjected -
        capitalGainsEstimateCents -
        totalCostProjected
      : null;

  const roiOnCashActual =
    netProfitActual != null && cashInvestedActual > 0
      ? netProfitActual / cashInvestedActual
      : null;
  const roiOnTotalActual =
    netProfitActual != null && totalCostActual > 0
      ? netProfitActual / totalCostActual
      : null;

  let annualizedRoiActual: number | null = null;
  if (
    roiOnCashActual != null &&
    monthsHeld != null &&
    monthsHeld >= 1 &&
    1 + roiOnCashActual > 0
  ) {
    annualizedRoiActual =
      Math.pow(1 + roiOnCashActual, 12 / monthsHeld) - 1;
  }

  return {
    byGroup,
    byCategory: Array.from(categoryMap.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    ),
    totalCostActual,
    totalCostProjected,
    financedPrincipalOutstanding,
    cashInvestedActual,
    cashInvestedProjected,
    salePrice: salePrice ?? null,
    sellingCostsActual,
    brokerCommissionCents,
    capitalGainsEstimateCents,
    netProfitActual,
    netProfitProjected,
    roiOnCashActual,
    roiOnTotalActual,
    annualizedRoiActual,
    monthsHeld,
  };
}

export function analyzeDeal(input: DealAnalysisInput): DealAnalysisResult {
  const auctionCommissionCents = Math.round(
    (input.purchasePriceCents * input.auctionCommissionBps) / 10_000,
  );
  const itbiCents = Math.round(
    (input.purchasePriceCents * input.itbiRateBps) / 10_000,
  );
  const acquisitionTotalCents =
    input.purchasePriceCents +
    auctionCommissionCents +
    itbiCents +
    input.deedAndRegistryCents +
    input.legalFeesCents +
    input.arrearsIptuCents +
    input.arrearsCondoCents +
    input.evictionCostCents +
    input.otherAcquisitionCents;

  const renovationTotalCents = input.renovationItems.reduce(
    (acc, item) => acc + Math.round(item.quantity * item.unitPriceCents),
    0,
  );

  const holdingTotalCents =
    input.holdingMonths * input.monthlyHoldingCents;

  const monthlyRate = input.annualRateBps / 10_000 / 12;
  const financingInterestEstimateCents =
    input.financedAmountCents > 0 && input.holdingMonths > 0
      ? Math.round(
          input.financedAmountCents * monthlyRate * input.holdingMonths,
        )
      : 0;

  const brokerCommissionCents = Math.round(
    (input.expectedSalePriceCents * input.brokerCommissionBps) / 10_000,
  );

  const totalCostBeforeTax =
    acquisitionTotalCents +
    renovationTotalCents +
    holdingTotalCents +
    financingInterestEstimateCents +
    brokerCommissionCents;

  const gain = Math.max(
    0,
    input.expectedSalePriceCents - totalCostBeforeTax,
  );
  const capitalGainsEstimateCents = Math.round(
    (gain * input.capitalGainsRateBps) / 10_000,
  );

  const sellingTotalCents = brokerCommissionCents + capitalGainsEstimateCents;
  const totalCostCents = totalCostBeforeTax + capitalGainsEstimateCents;
  const cashInvestedCents = Math.max(
    0,
    totalCostCents - input.financedAmountCents,
  );
  const netProfitCents = input.expectedSalePriceCents - totalCostCents;
  const roiOnCash =
    cashInvestedCents > 0 ? netProfitCents / cashInvestedCents : null;
  const roiOnTotal =
    totalCostCents > 0 ? netProfitCents / totalCostCents : null;

  let annualizedRoi: number | null = null;
  if (
    roiOnCash != null &&
    input.holdingMonths >= 1 &&
    1 + roiOnCash > 0
  ) {
    annualizedRoi =
      Math.pow(1 + roiOnCash, 12 / input.holdingMonths) - 1;
  }

  return {
    auctionCommissionCents,
    itbiCents,
    acquisitionTotalCents,
    renovationTotalCents,
    holdingTotalCents,
    financingInterestEstimateCents,
    brokerCommissionCents,
    capitalGainsEstimateCents,
    sellingTotalCents,
    totalCostCents,
    cashInvestedCents,
    netProfitCents,
    roiOnCash,
    roiOnTotal,
    annualizedRoi,
  };
}

export function maxBidForTargetRoi(input: {
  targetRoi: number;
  auctionCommissionBps: number;
  itbiRateBps: number;
  deedAndRegistryCents: number;
  legalFeesCents: number;
  arrearsIptuCents: number;
  arrearsCondoCents: number;
  evictionCostCents: number;
  otherAcquisitionCents: number;
  holdingMonths: number;
  monthlyHoldingCents: number;
  financedAmountCents: number;
  annualRateBps: number;
  brokerCommissionBps: number;
  expectedSalePriceCents: number;
  capitalGainsRateBps: number;
  renovationItems: Array<{ quantity: number; unitPriceCents: number }>;
}): number {
  let low = 0;
  let high = input.expectedSalePriceCents;
  let best = 0;

  for (let i = 0; i < 40; i++) {
    const mid = Math.floor((low + high) / 2);
    const result = analyzeDeal({
      ...input,
      purchasePriceCents: mid,
    });
    const roi = result.roiOnCash ?? -Infinity;
    if (roi >= input.targetRoi) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}
