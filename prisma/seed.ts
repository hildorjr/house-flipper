import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

type CostGroup =
  | "ACQUISITION"
  | "TAXES_AND_FEES"
  | "RENOVATION"
  | "HOLDING"
  | "FINANCING"
  | "SELLING"
  | "OTHER";

const categories: Array<{
  key: string;
  group: CostGroup;
  isRecurringByDefault?: boolean;
  sortOrder: number;
}> = [
  { key: "purchase_price", group: "ACQUISITION", sortOrder: 1 },
  { key: "auction_commission", group: "ACQUISITION", sortOrder: 2 },
  { key: "earnest_deposit", group: "ACQUISITION", sortOrder: 3 },
  { key: "bid_difference", group: "ACQUISITION", sortOrder: 4 },
  { key: "acquisition_other", group: "ACQUISITION", sortOrder: 5 },
  { key: "itbi", group: "TAXES_AND_FEES", sortOrder: 10 },
  { key: "deed_notary", group: "TAXES_AND_FEES", sortOrder: 11 },
  { key: "property_registry", group: "TAXES_AND_FEES", sortOrder: 12 },
  { key: "laudemio", group: "TAXES_AND_FEES", sortOrder: 13 },
  { key: "court_costs", group: "TAXES_AND_FEES", sortOrder: 14 },
  { key: "lawyer_fees", group: "TAXES_AND_FEES", sortOrder: 15 },
  { key: "document_agent", group: "TAXES_AND_FEES", sortOrder: 16 },
  { key: "certificates", group: "TAXES_AND_FEES", sortOrder: 17 },
  { key: "iptu_arrears", group: "TAXES_AND_FEES", sortOrder: 18 },
  { key: "condo_arrears", group: "TAXES_AND_FEES", sortOrder: 19 },
  { key: "utility_arrears", group: "TAXES_AND_FEES", sortOrder: 20 },
  { key: "eviction_costs", group: "TAXES_AND_FEES", sortOrder: 21 },
  { key: "possession_action", group: "TAXES_AND_FEES", sortOrder: 22 },
  { key: "materials", group: "RENOVATION", sortOrder: 30 },
  { key: "labor", group: "RENOVATION", sortOrder: 31 },
  { key: "demolition", group: "RENOVATION", sortOrder: 32 },
  { key: "structural", group: "RENOVATION", sortOrder: 33 },
  { key: "roofing", group: "RENOVATION", sortOrder: 34 },
  { key: "electrical", group: "RENOVATION", sortOrder: 35 },
  { key: "plumbing", group: "RENOVATION", sortOrder: 36 },
  { key: "masonry", group: "RENOVATION", sortOrder: 37 },
  { key: "plastering", group: "RENOVATION", sortOrder: 38 },
  { key: "flooring", group: "RENOVATION", sortOrder: 39 },
  { key: "painting", group: "RENOVATION", sortOrder: 40 },
  { key: "doors_windows", group: "RENOVATION", sortOrder: 41 },
  { key: "kitchen", group: "RENOVATION", sortOrder: 42 },
  { key: "bathroom", group: "RENOVATION", sortOrder: 43 },
  { key: "carpentry", group: "RENOVATION", sortOrder: 44 },
  { key: "glass", group: "RENOVATION", sortOrder: 45 },
  { key: "appliances", group: "RENOVATION", sortOrder: 46 },
  { key: "landscaping", group: "RENOVATION", sortOrder: 47 },
  { key: "waste_removal", group: "RENOVATION", sortOrder: 48 },
  { key: "cleaning", group: "RENOVATION", sortOrder: 49 },
  { key: "staging_furniture", group: "RENOVATION", sortOrder: 50 },
  { key: "architect_engineer", group: "RENOVATION", sortOrder: 51 },
  { key: "permits_art_rrt", group: "RENOVATION", sortOrder: 52 },
  { key: "iptu", group: "HOLDING", isRecurringByDefault: true, sortOrder: 60 },
  { key: "condo_fee", group: "HOLDING", isRecurringByDefault: true, sortOrder: 61 },
  { key: "water", group: "HOLDING", isRecurringByDefault: true, sortOrder: 62 },
  { key: "electricity", group: "HOLDING", isRecurringByDefault: true, sortOrder: 63 },
  { key: "gas", group: "HOLDING", isRecurringByDefault: true, sortOrder: 64 },
  { key: "internet", group: "HOLDING", isRecurringByDefault: true, sortOrder: 65 },
  { key: "insurance", group: "HOLDING", isRecurringByDefault: true, sortOrder: 66 },
  { key: "security", group: "HOLDING", isRecurringByDefault: true, sortOrder: 67 },
  { key: "property_management", group: "HOLDING", isRecurringByDefault: true, sortOrder: 68 },
  { key: "hoa_fee", group: "HOLDING", isRecurringByDefault: true, sortOrder: 69 },
  { key: "down_payment", group: "FINANCING", sortOrder: 70 },
  { key: "loan_interest", group: "FINANCING", sortOrder: 71 },
  { key: "loan_fees", group: "FINANCING", sortOrder: 72 },
  { key: "iof", group: "FINANCING", sortOrder: 73 },
  { key: "loan_insurance", group: "FINANCING", sortOrder: 74 },
  { key: "appraisal_fee", group: "FINANCING", sortOrder: 75 },
  { key: "broker_commission", group: "SELLING", sortOrder: 80 },
  { key: "marketing_photos", group: "SELLING", sortOrder: 81 },
  { key: "capital_gains_tax", group: "SELLING", sortOrder: 82 },
  { key: "seller_certificates", group: "SELLING", sortOrder: 83 },
  { key: "seller_deed_costs", group: "SELLING", sortOrder: 84 },
  { key: "misc", group: "OTHER", sortOrder: 90 },
];

const presets: Array<{
  key: string;
  categoryKey: string;
  unit: string;
  defaultUnitPriceCents: number;
  sortOrder: number;
}> = [
  { key: "paint_interior_m2", categoryKey: "painting", unit: "m2", defaultUnitPriceCents: 4500, sortOrder: 1 },
  { key: "paint_exterior_m2", categoryKey: "painting", unit: "m2", defaultUnitPriceCents: 6500, sortOrder: 2 },
  { key: "ceramic_floor_m2", categoryKey: "flooring", unit: "m2", defaultUnitPriceCents: 12000, sortOrder: 3 },
  { key: "laminate_floor_m2", categoryKey: "flooring", unit: "m2", defaultUnitPriceCents: 9500, sortOrder: 4 },
  { key: "porcelain_floor_m2", categoryKey: "flooring", unit: "m2", defaultUnitPriceCents: 18000, sortOrder: 5 },
  { key: "bathroom_full", categoryKey: "bathroom", unit: "un", defaultUnitPriceCents: 1500000, sortOrder: 6 },
  { key: "kitchen_full", categoryKey: "kitchen", unit: "un", defaultUnitPriceCents: 2500000, sortOrder: 7 },
  { key: "rewiring_m2", categoryKey: "electrical", unit: "m2", defaultUnitPriceCents: 8500, sortOrder: 8 },
  { key: "plumbing_rewire_m2", categoryKey: "plumbing", unit: "m2", defaultUnitPriceCents: 7500, sortOrder: 9 },
  { key: "plaster_m2", categoryKey: "plastering", unit: "m2", defaultUnitPriceCents: 5500, sortOrder: 10 },
  { key: "demolition_m2", categoryKey: "demolition", unit: "m2", defaultUnitPriceCents: 4000, sortOrder: 11 },
  { key: "roof_tile_m2", categoryKey: "roofing", unit: "m2", defaultUnitPriceCents: 22000, sortOrder: 12 },
  { key: "window_unit", categoryKey: "doors_windows", unit: "un", defaultUnitPriceCents: 180000, sortOrder: 13 },
  { key: "door_unit", categoryKey: "doors_windows", unit: "un", defaultUnitPriceCents: 90000, sortOrder: 14 },
  { key: "cabinetry_ml", categoryKey: "carpentry", unit: "m", defaultUnitPriceCents: 250000, sortOrder: 15 },
  { key: "glass_m2", categoryKey: "glass", unit: "m2", defaultUnitPriceCents: 35000, sortOrder: 16 },
  { key: "cleaning_full", categoryKey: "cleaning", unit: "verba", defaultUnitPriceCents: 150000, sortOrder: 17 },
  { key: "waste_removal", categoryKey: "waste_removal", unit: "verba", defaultUnitPriceCents: 200000, sortOrder: 18 },
  { key: "architect_project", categoryKey: "architect_engineer", unit: "verba", defaultUnitPriceCents: 800000, sortOrder: 19 },
  { key: "masonry_m2", categoryKey: "masonry", unit: "m2", defaultUnitPriceCents: 15000, sortOrder: 20 },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  for (const cat of categories) {
    await prisma.expenseCategory.upsert({
      where: { key: cat.key },
      create: {
        key: cat.key,
        group: cat.group,
        isSystem: true,
        isRecurringByDefault: cat.isRecurringByDefault ?? false,
        sortOrder: cat.sortOrder,
      },
      update: {
        group: cat.group,
        isSystem: true,
        isRecurringByDefault: cat.isRecurringByDefault ?? false,
        sortOrder: cat.sortOrder,
      },
    });
  }

  for (const preset of presets) {
    await prisma.renovationPreset.upsert({
      where: { key: preset.key },
      create: {
        key: preset.key,
        categoryKey: preset.categoryKey,
        unit: preset.unit,
        defaultUnitPriceCents: preset.defaultUnitPriceCents,
        country: "BR",
        sortOrder: preset.sortOrder,
      },
      update: {
        categoryKey: preset.categoryKey,
        unit: preset.unit,
        defaultUnitPriceCents: preset.defaultUnitPriceCents,
        sortOrder: preset.sortOrder,
      },
    });
  }

  console.log(`Seeded ${categories.length} categories and ${presets.length} presets`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
