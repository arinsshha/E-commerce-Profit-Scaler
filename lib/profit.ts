export type Settings = {
  currency: string;
  locale: string;
  targetMargin: number;
  highReturnThreshold: number;
  defaultShippingCost: number;
  defaultPackagingCost: number;
  defaultPaymentFeePercent: number;
  defaultAdSpendPerOrder: number;
};

export const defaultSettings: Settings = {
  currency: "INR",
  locale: "en-IN",
  targetMargin: 30,
  highReturnThreshold: 10,
  defaultShippingCost: 0,
  defaultPackagingCost: 0,
  defaultPaymentFeePercent: 2,
  defaultAdSpendPerOrder: 0
};

export function normalizeSku(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

export function analyzeProfit({
  orders,
  costs,
  ads,
  shipping,
  returns,
  settings = defaultSettings
}: {
  orders: any[];
  costs: any[];
  ads: any[];
  shipping: any[];
  returns: any[];
  settings?: Settings;
}) {
  const costMap = Object.fromEntries(costs.map((item) => [normalizeSku(item.sku), item]));
  const adMap = Object.fromEntries(ads.map((item) => [normalizeSku(item.sku), item]));
  const shippingMap = Object.fromEntries(shipping.map((item) => [normalizeSku(item.sku), item]));
  const returnMap = Object.fromEntries(returns.map((item) => [normalizeSku(item.sku), item]));
  const grouped: Record<string, any> = {};
  const warnings: string[] = [];

  orders.forEach((order, index) => {
    const sku = normalizeSku(order.sku);
    if (!sku) {
      warnings.push(`Order row ${index + 2} has missing SKU.`);
      return;
    }

    const cost = costMap[sku] || {};
    const ship = shippingMap[sku] || {};
    const ad = adMap[sku] || {};
    const returnInfo = returnMap[sku] || {};

    const quantity = Number(order.quantity || 1);
    const sellingPrice = Number(order.sellingPrice || 0);
    const productRevenue = sellingPrice * quantity;
    const productCost = Number(cost.productCost || 0) * quantity;
    const packagingCost = Number(cost.packagingCost ?? settings.defaultPackagingCost ?? 0) * quantity;
    const shippingCost = Number(ship.shippingCost ?? settings.defaultShippingCost ?? 0);
    const discount = Number(order.discount || 0);
    const paymentFee = Number(order.paymentFee || 0) || (productRevenue * Number(settings.defaultPaymentFeePercent || 0)) / 100;

    if (!costMap[sku]) warnings.push(`${order.product || sku}: missing product cost. Used 0 cost.`);
    if (!shippingMap[sku] && Number(settings.defaultShippingCost || 0) === 0) warnings.push(`${order.product || sku}: missing shipping cost. Used 0 shipping.`);

    if (!grouped[sku]) {
      grouped[sku] = {
        sku,
        product: order.product || cost.product || sku,
        revenue: 0,
        unitsSold: 0,
        orderCount: 0,
        productCost: 0,
        packagingCost: 0,
        shippingCost: 0,
        discount: 0,
        paymentFee: 0,
        adSpend: Number(ad.adSpend || 0),
        returnedUnits: Number(returnInfo.returnedUnits || 0)
      };
    }

    grouped[sku].revenue += productRevenue;
    grouped[sku].unitsSold += quantity;
    grouped[sku].orderCount += 1;
    grouped[sku].productCost += productCost;
    grouped[sku].packagingCost += packagingCost;
    grouped[sku].shippingCost += shippingCost;
    grouped[sku].discount += discount;
    grouped[sku].paymentFee += paymentFee;
  });

  const products = Object.values(grouped).map((item: any) => {
    const adSpend = item.adSpend || item.orderCount * Number(settings.defaultAdSpendPerOrder || 0);
    const totalCost = item.productCost + item.packagingCost + item.shippingCost + item.discount + item.paymentFee + adSpend;
    const realProfit = item.revenue - totalCost;
    const margin = item.revenue ? (realProfit / item.revenue) * 100 : 0;
    const returnRate = item.unitsSold ? (item.returnedUnits / item.unitsSold) * 100 : 0;
    const breakEvenPrice = item.unitsSold ? totalCost / item.unitsSold : 0;
    const suggestedPrice = item.unitsSold ? (totalCost / item.unitsSold) / (1 - settings.targetMargin / 100) : 0;
    return { ...item, adSpend, totalCost, realProfit, margin, returnRate, breakEvenPrice, suggestedPrice };
  });

  const totals = products.reduce(
    (acc: any, item: any) => {
      acc.revenue += item.revenue;
      acc.realProfit += item.realProfit;
      acc.unitsSold += item.unitsSold;
      acc.adSpend += item.adSpend;
      acc.returns += item.returnedUnits;
      acc.totalCost += item.totalCost;
      return acc;
    },
    { revenue: 0, realProfit: 0, unitsSold: 0, adSpend: 0, returns: 0, totalCost: 0 }
  );

  totals.margin = totals.revenue ? (totals.realProfit / totals.revenue) * 100 : 0;
  totals.returnRate = totals.unitsSold ? (totals.returns / totals.unitsSold) * 100 : 0;

  return {
    products,
    totals,
    lowMargin: products.filter((p: any) => p.margin < settings.targetMargin),
    lossMaking: products.filter((p: any) => p.realProfit < 0),
    highReturn: products.filter((p: any) => p.returnRate >= settings.highReturnThreshold),
    promote: products.filter((p: any) => p.margin >= settings.targetMargin && p.returnRate < settings.highReturnThreshold),
    warnings: [...new Set(warnings)].slice(0, 20)
  };
}
