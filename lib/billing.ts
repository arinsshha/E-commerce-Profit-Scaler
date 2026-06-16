import { appConfig, type PlanName } from "@/lib/app-config";

type PaidPlanName = Exclude<PlanName, "FREE">;

const paidPlans: PaidPlanName[] = ["STARTER", "GROWTH", "PRO"];

const stripePriceEnvNames: Record<PaidPlanName, string[]> = {
  STARTER: ["NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_INR", "NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_USD"],
  GROWTH: ["NEXT_PUBLIC_STRIPE_PRICE_ID_GROWTH_INR", "NEXT_PUBLIC_STRIPE_PRICE_ID_GROWTH_USD"],
  PRO: ["NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_INR", "NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_USD"]
};

export function isPaidPlan(plan: string): plan is PaidPlanName {
  return paidPlans.includes(plan as PaidPlanName);
}

export function getPlanFromStripePrice(priceId: string): PaidPlanName | null {
  for (const plan of paidPlans) {
    const matches = stripePriceEnvNames[plan].some((envName) => process.env[envName] === priceId);
    if (matches) return plan;
  }

  return null;
}

export function getRazorpayAmountForPlan(plan: PaidPlanName) {
  return appConfig.pricing.plans[plan].inr * 100;
}

export function assertRazorpayPlan(plan: unknown): PaidPlanName {
  if (typeof plan === "string" && isPaidPlan(plan)) {
    return plan;
  }

  throw new Error("Invalid plan selected.");
}
