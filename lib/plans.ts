export type PlanName = "FREE" | "STARTER" | "GROWTH" | "PRO";

export const PLAN_LIMITS = {
  FREE: {
    name: "Free",
    priceInr: 0,
    reportsPerMonth: 1,
    maxCsvRows: 500,
    aiLevel: "simple",
    csvExport: false,
    pdfExport: false,
    clientReport: false,
    shopifyMapping: false,
    simulator: false,
    shareLinks: false,
  },
  STARTER: {
    name: "Starter",
    priceInr: 799,
    reportsPerMonth: 10,
    maxCsvRows: 5000,
    aiLevel: "advanced",
    csvExport: true,
    pdfExport: true,
    clientReport: true,
    shopifyMapping: true,
    simulator: false,
    shareLinks: false,
  },
  GROWTH: {
    name: "Growth",
    priceInr: 1999,
    reportsPerMonth: 50,
    maxCsvRows: 25000,
    aiLevel: "advanced",
    csvExport: true,
    pdfExport: true,
    clientReport: true,
    shopifyMapping: true,
    simulator: true,
    shareLinks: true,
  },
  PRO: {
    name: "Pro",
    priceInr: 4999,
    reportsPerMonth: "unlimited",
    maxCsvRows: 100000,
    aiLevel: "advanced",
    csvExport: true,
    pdfExport: true,
    clientReport: true,
    shopifyMapping: true,
    simulator: true,
    shareLinks: true,
  },
} as const;

export function getPlan(plan?: string) {
  if (plan === "STARTER" || plan === "GROWTH" || plan === "PRO") {
    return PLAN_LIMITS[plan];
  }

  return PLAN_LIMITS.FREE;
}

export function canUseFeature(plan: string | undefined, feature: keyof typeof PLAN_LIMITS.FREE) {
  const planConfig = getPlan(plan);
  return Boolean(planConfig[feature]);
}