export const appConfig = {
  name: "ProfitLens",
  tagline: "Find profit leaks in your e-commerce store",
  targetUsers: "All e-commerce businesses",
  countryFocus: "India and global",
  launchUrlName: "profitlens-ai",
  temporarySupportEmail: "arinsha666@gmail.com",
  temporaryBusinessEmail: "arinsha666@gmail.com",
  futureSupportEmail: "support@profitlens.com",
  futureBusinessEmail: "business@profitlens.com",
  ownerName: "Arin Kumar",
  companyName: "ProfitLens",
  city: "Hyderabad",
  country: "India",
  refundPolicy: "7-day refund",
  databaseProvider: "Neon",
  authProvider: "Clerk",
  ai: {
    defaultProvider: "gemini",
    enabledProviders: ["gemini", "openai"],
    freeLanguage: "English",
    paidLanguage: "English and Hinglish",
    freeStyle: "simple",
    paidStyle: "advanced"
  },
  currency: {
    supported: ["INR", "USD"],
    default: "INR"
  },
  pricing: {
    trialDays: 7,
    paymentGateways: ["razorpay", "stripe"],
    plans: {
      FREE: {
        name: "Free",
        inr: 0,
        usd: 0,
        reportsPerMonth: 1,
        maxCsvRows: 500,
        aiLevel: "simple",
        exportEnabled: false
      },
      STARTER: {
        name: "Starter",
        inr: 799,
        usd: 19,
        reportsPerMonth: 10,
        maxCsvRows: 5000,
        aiLevel: "advanced",
        exportEnabled: true
      },
      GROWTH: {
        name: "Growth",
        inr: 1999,
        usd: 49,
        reportsPerMonth: 50,
        maxCsvRows: 25000,
        aiLevel: "advanced",
        exportEnabled: true
      },
      PRO: {
        name: "Pro",
        inr: 4999,
        usd: 99,
        reportsPerMonth: "unlimited",
        maxCsvRows: 100000,
        aiLevel: "advanced",
        exportEnabled: true
      }
    }
  },
  features: {
    realProfit: true,
    lossMakingProducts: true,
    lowMarginProducts: true,
    highReturnProducts: true,
    bestProductsToPromote: true,
    aiSuggestions: true,
    pdfExport: true,
    csvExport: true,
    reportHistory: true,
    adminDashboard: true
  },
  csvColumns: {
    orders: ["orderId", "date", "product", "sku", "quantity", "sellingPrice", "discount", "paymentFee"],
    productCosts: ["sku", "product", "productCost", "packagingCost"],
    adSpend: ["sku", "adSpend"],
    shipping: ["sku", "shippingCost"],
    returns: ["sku", "returnedUnits"]
  }
} as const;

export type PlanName = keyof typeof appConfig.pricing.plans;

export function getPlanConfig(plan: PlanName) {
  return appConfig.pricing.plans[plan] || appConfig.pricing.plans.FREE;
}
