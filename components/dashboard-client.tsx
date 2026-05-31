// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Package,
  IndianRupee,
  BarChart3,
  FileText,
  Download,
  RefreshCcw,
  Settings as SettingsIcon,
  Search,
  CheckCircle2,
  XCircle,
  Target,
  Percent,
  Truck,
  ReceiptIndianRupee,
  Brain,
  Store,
  UserRound,
  ClipboardList,
  Activity,
  CalendarDays
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { FeatureLock } from "@/components/feature-lock";

const APP_VERSION = "1.1.0";
const STORAGE_KEY = "profitlens_real_world_mvp_v2";

const sampleOrders = [
  { orderId: "ORD-001", date: "2026-05-01", product: "Gold Plated Bracelet", sku: "BR-001", quantity: 2, sellingPrice: 899, discount: 100, paymentFee: 32 },
  { orderId: "ORD-002", date: "2026-05-02", product: "Pearl Necklace", sku: "NK-002", quantity: 1, sellingPrice: 1499, discount: 200, paymentFee: 45 },
  { orderId: "ORD-003", date: "2026-05-03", product: "Silver Ring", sku: "RG-003", quantity: 3, sellingPrice: 599, discount: 0, paymentFee: 28 },
  { orderId: "ORD-004", date: "2026-05-04", product: "Crystal Earrings", sku: "ER-004", quantity: 2, sellingPrice: 499, discount: 120, paymentFee: 22 },
  { orderId: "ORD-005", date: "2026-05-05", product: "Pearl Necklace", sku: "NK-002", quantity: 1, sellingPrice: 1499, discount: 300, paymentFee: 45 },
  { orderId: "ORD-006", date: "2026-05-06", product: "Gold Plated Bracelet", sku: "BR-001", quantity: 1, sellingPrice: 899, discount: 50, paymentFee: 32 },
  { orderId: "ORD-007", date: "2026-05-07", product: "Silver Ring", sku: "RG-003", quantity: 2, sellingPrice: 599, discount: 0, paymentFee: 28 },
  { orderId: "ORD-008", date: "2026-05-08", product: "Crystal Earrings", sku: "ER-004", quantity: 1, sellingPrice: 499, discount: 80, paymentFee: 22 }
];

const sampleCosts = [
  { sku: "BR-001", product: "Gold Plated Bracelet", productCost: 390, packagingCost: 35 },
  { sku: "NK-002", product: "Pearl Necklace", productCost: 850, packagingCost: 55 },
  { sku: "RG-003", product: "Silver Ring", productCost: 180, packagingCost: 25 },
  { sku: "ER-004", product: "Crystal Earrings", productCost: 260, packagingCost: 25 }
];

const sampleAds = [
  { sku: "BR-001", adSpend: 900 },
  { sku: "NK-002", adSpend: 1250 },
  { sku: "RG-003", adSpend: 350 },
  { sku: "ER-004", adSpend: 700 }
];

const sampleShipping = [
  { sku: "BR-001", shippingCost: 90 },
  { sku: "NK-002", shippingCost: 120 },
  { sku: "RG-003", shippingCost: 70 },
  { sku: "ER-004", shippingCost: 75 }
];

const sampleReturns = [
  { sku: "BR-001", returnedUnits: 0 },
  { sku: "NK-002", returnedUnits: 1 },
  { sku: "RG-003", returnedUnits: 0 },
  { sku: "ER-004", returnedUnits: 1 }
];

const defaultSettings = {
  currency: "INR",
  locale: "en-IN",
  targetMargin: 30,
  highReturnThreshold: 10,
  defaultShippingCost: 0,
  defaultPackagingCost: 0,
  defaultPaymentFeePercent: 2,
  defaultAdSpendPerOrder: 0
};

const templates = {
  orders: { filename: "orders_template.csv", rows: sampleOrders },
  costs: { filename: "product_cost_template.csv", rows: sampleCosts },
  ads: { filename: "ad_spend_template.csv", rows: sampleAds },
  shipping: { filename: "shipping_template.csv", rows: sampleShipping },
  returns: { filename: "returns_template.csv", rows: sampleReturns }
};

function parseCSV(text) {
  const cleaned = text.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const rows = [];
  let current = "";
  let row = [];
  let insideQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some((cell) => cell !== "")) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((values) => {
    const obj = {};
    headers.forEach((header, index) => {
      const rawValue = values[index] ?? "";
      const value = String(rawValue).trim();
      const numeric = Number(value.replace(/,/g, ""));
      obj[header] = value !== "" && !Number.isNaN(numeric) ? numeric : value;
    });
    return obj;
  });
}

function toCSV(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const stringValue = String(value ?? "");
    return /[",\n\r]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function downloadFile(filename, content, type = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadTemplate(templateKey) {
  const template = templates[templateKey];
  downloadFile(template.filename, toCSV(template.rows));
}

function normalizeSku(value) {
  return String(value || "").trim().toUpperCase();
}

function formatMoney(value, settings = defaultSettings) {
  return new Intl.NumberFormat(settings.locale || "en-IN", {
    style: "currency",
    currency: settings.currency || "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getHealthStatus(product, settings) {
  if (product.realProfit < 0) return { label: "Losing Money", tone: "bg-red-100 text-red-700" };
  if (product.margin < settings.targetMargin) return { label: "Low Margin", tone: "bg-yellow-100 text-yellow-800" };
  if (product.returnRate >= settings.highReturnThreshold) return { label: "Return Risk", tone: "bg-orange-100 text-orange-800" };
  return { label: "Healthy", tone: "bg-emerald-100 text-emerald-700" };
}
function normalizeColumnName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

function getValueFromPossibleColumns(row: any, possibleColumns: string[]) {
  const normalizedRow: Record<string, any> = {};

  Object.keys(row || {}).forEach((key) => {
    normalizedRow[normalizeColumnName(key)] = row[key];
  });

  for (const column of possibleColumns) {
    const normalizedColumn = normalizeColumnName(column);

    if (normalizedColumn in normalizedRow) {
      return normalizedRow[normalizedColumn];
    }
  }

  return "";
}

function mapShopifyOrdersCsv(rows: any[]) {
  return rows
    .map((row, index) => {
      const orderId =
        getValueFromPossibleColumns(row, ["Name", "Order Name", "Order ID", "Order Number"]) ||
        `SHOPIFY-${index + 1}`;

      const date =
        getValueFromPossibleColumns(row, ["Created at", "Created At", "Date", "Paid at"]) ||
        "";

      const product =
        getValueFromPossibleColumns(row, [
          "Lineitem name",
          "Line Item Name",
          "Product",
          "Product Name",
          "Title",
        ]) || "Unknown Product";

      const sku =
        getValueFromPossibleColumns(row, [
          "Lineitem sku",
          "Line Item SKU",
          "Variant SKU",
          "SKU",
        ]) || "";

      const quantity =
        Number(
          getValueFromPossibleColumns(row, [
            "Lineitem quantity",
            "Line Item Quantity",
            "Quantity",
            "Qty",
          ]) || 1
        ) || 1;

      const sellingPrice =
        Number(
          getValueFromPossibleColumns(row, [
            "Lineitem price",
            "Line Item Price",
            "Price",
            "Variant Price",
            "Subtotal",
            "Total",
          ]) || 0
        ) || 0;

      const discount =
        Number(
          getValueFromPossibleColumns(row, [
            "Discount Amount",
            "Discount",
            "Total Discounts",
            "Lineitem discount",
          ]) || 0
        ) || 0;

      const paymentFee =
        Number(
          getValueFromPossibleColumns(row, [
            "Payment Fee",
            "Transaction Fee",
            "Gateway Fee",
          ]) || 0
        ) || 0;

      return {
        orderId,
        date,
        product,
        sku,
        quantity,
        sellingPrice,
        discount,
        paymentFee,
      };
    })
    .filter((row) => row.sku && row.sellingPrice > 0);
}

function mapShopifyProductCsvToCosts(rows: any[]) {
  return rows
    .map((row) => {
      const sku =
        getValueFromPossibleColumns(row, [
          "Variant SKU",
          "SKU",
          "Lineitem sku",
          "Line Item SKU",
        ]) || "";

      const product =
        getValueFromPossibleColumns(row, [
          "Title",
          "Product",
          "Product Name",
          "Lineitem name",
          "Line Item Name",
        ]) || sku;

      const productCost =
        Number(
          getValueFromPossibleColumns(row, [
            "Cost per item",
            "Cost",
            "Product Cost",
            "COGS",
          ]) || 0
        ) || 0;

      const packagingCost =
        Number(
          getValueFromPossibleColumns(row, [
            "Packaging Cost",
            "Packaging",
          ]) || 0
        ) || 0;

      return {
        sku,
        product,
        productCost,
        packagingCost,
      };
    })
    .filter((row) => row.sku);
}

function autoMapCsvRows(rows: any[], requiredColumns: string[]) {
  const availableColumns = Object.keys(rows[0] || {});
  const hasRequiredColumns = requiredColumns.every((column) =>
    availableColumns.includes(column)
  );

  if (hasRequiredColumns) {
    return rows;
  }

  const isOrdersUpload =
    requiredColumns.includes("sellingPrice") &&
    requiredColumns.includes("quantity");

  const isCostUpload =
    requiredColumns.includes("productCost");

  if (isOrdersUpload) {
    const mapped = mapShopifyOrdersCsv(rows);

    if (mapped.length > 0) {
      return mapped;
    }
  }

  if (isCostUpload) {
    const mapped = mapShopifyProductCsvToCosts(rows);

    if (mapped.length > 0) {
      return mapped;
    }
  }

  return rows;
}

export function DashboardClient({ initialReports = [], userPlan = "FREE" } = {}) {
  const [orders, setOrders] = useState(sampleOrders);
  const [costs, setCosts] = useState(sampleCosts);
  const [ads, setAds] = useState(sampleAds);
  const [shipping, setShipping] = useState(sampleShipping);
  const [returns, setReturns] = useState(sampleReturns);
  const [settings, setSettings] = useState(defaultSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("realProfit");
  const [storeName, setStoreName] = useState("Demo E-commerce Store");
  const [clientName, setClientName] = useState("");
  const [consultantNotes, setConsultantNotes] = useState("");
  const [reports, setReports] = useState(initialReports || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setOrders(parsed.orders?.length ? parsed.orders : sampleOrders);
      setCosts(parsed.costs?.length ? parsed.costs : sampleCosts);
      setAds(parsed.ads?.length ? parsed.ads : sampleAds);
      setShipping(parsed.shipping?.length ? parsed.shipping : sampleShipping);
      setReturns(parsed.returns?.length ? parsed.returns : sampleReturns);
      setSettings({ ...defaultSettings, ...(parsed.settings || {}) });
      setStoreName(parsed.storeName || "Demo E-commerce Store");
      setClientName(parsed.clientName || "");
      setConsultantNotes(parsed.consultantNotes || "");
    } catch {
      // Ignore invalid local data.
    }
  }, []);

  useEffect(() => {
    const payload = { orders, costs, ads, shipping, returns, settings, storeName, clientName, consultantNotes, version: APP_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [orders, costs, ads, shipping, returns, settings, storeName, clientName, consultantNotes]);

  const analysis = useMemo(() => {
    const costMap = Object.fromEntries(costs.map((item) => [normalizeSku(item.sku), item]));
    const adMap = Object.fromEntries(ads.map((item) => [normalizeSku(item.sku), item]));
    const shippingMap = Object.fromEntries(shipping.map((item) => [normalizeSku(item.sku), item]));
    const returnMap = Object.fromEntries(returns.map((item) => [normalizeSku(item.sku), item]));
    const grouped = {};
    const warnings = [];

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
      const unitProductCost = Number(cost.productCost || 0);
      const unitPackagingCost = Number(cost.packagingCost ?? settings.defaultPackagingCost ?? 0);
      const productCost = unitProductCost * quantity;
      const packagingCost = unitPackagingCost * quantity;
      const shippingCost = Number(ship.shippingCost ?? settings.defaultShippingCost ?? 0);
      const discount = Number(order.discount || 0);
      const paymentFee = Number(order.paymentFee || 0) || (productRevenue * Number(settings.defaultPaymentFeePercent || 0)) / 100;

      if (!costMap[sku]) warnings.push(`${order.product || sku}: missing product cost. Used ₹0 cost.`);
      if (!shippingMap[sku] && Number(settings.defaultShippingCost || 0) === 0) warnings.push(`${order.product || sku}: missing shipping cost. Used ₹0 shipping.`);

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

    const products = Object.values(grouped).map((item) => {
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
      (acc, item) => {
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

    const lowMargin = products.filter((p) => p.margin < settings.targetMargin).sort((a, b) => a.margin - b.margin);
    const lossMaking = products.filter((p) => p.realProfit < 0).sort((a, b) => a.realProfit - b.realProfit);
    const highReturn = products.filter((p) => p.returnRate >= settings.highReturnThreshold).sort((a, b) => b.returnRate - a.returnRate);
    const promote = products.filter((p) => p.margin >= settings.targetMargin && p.returnRate < settings.highReturnThreshold).sort((a, b) => b.realProfit - a.realProfit);

    const dailyMap = {};
    orders.forEach((order) => {
      const date = order.date || "Unknown";
      dailyMap[date] = (dailyMap[date] || 0) + Number(order.sellingPrice || 0) * Number(order.quantity || 1);
    });
    const daily = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    return { products, totals, lowMargin, lossMaking, highReturn, promote, daily, warnings: [...new Set(warnings)].slice(0, 8) };
  }, [orders, costs, ads, shipping, returns, settings]);

  const dataQuality = useMemo(() => {
  const totalProducts = analysis.products.length || 1;

  const missingCost = analysis.warnings.filter((warning: string) =>
    warning.toLowerCase().includes("missing product cost")
  ).length;

  const missingShipping = analysis.warnings.filter((warning: string) =>
    warning.toLowerCase().includes("missing shipping")
  ).length;

  const score = Math.max(
    0,
    Math.round(100 - ((missingCost + missingShipping) / totalProducts) * 40)
  );

  return {
    score,
    missingCost,
    missingShipping,
    status:
      score >= 85
        ? "Strong"
        : score >= 60
        ? "Needs cleanup"
        : "Weak data",
  };
}, [analysis]);

  const profitHealthScore = useMemo(() => {
    let score = 100;
    if (analysis.totals.margin < settings.targetMargin) score -= 20;
    if (analysis.totals.realProfit < 0) score -= 25;
    if (analysis.totals.returnRate >= settings.highReturnThreshold) score -= 15;
    score -= Math.min(20, analysis.lossMaking.length * 5);
    score -= Math.min(15, analysis.lowMargin.length * 3);
    score -= Math.min(10, analysis.highReturn.length * 3);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [analysis, settings]);

  const healthLabel = useMemo(() => {
    if (profitHealthScore >= 80) return "Healthy";
    if (profitHealthScore >= 60) return "Needs Attention";
    if (profitHealthScore >= 40) return "Risky";
    return "Critical";
  }, [profitHealthScore]);

  const executiveSummary = useMemo(() => {
    const revenue = formatMoney(analysis.totals.revenue, settings);
    const profit = formatMoney(analysis.totals.realProfit, settings);
    const margin = formatPercent(analysis.totals.margin);

    const mainIssue =
      analysis.lossMaking.length > 0
        ? `${analysis.lossMaking.length} product(s) are losing money.`
        : analysis.lowMargin.length > 0
        ? `${analysis.lowMargin.length} product(s) have weak margins.`
        : analysis.highReturn.length > 0
        ? `${analysis.highReturn.length} product(s) have high return risk.`
        : "No major profit leak was detected.";

    const opportunity =
      analysis.promote.length > 0
        ? `${analysis.promote[0].product} looks like a strong product to promote.`
        : "Upload more data to identify stronger promotion opportunities.";

    return `${storeName || "This store"} generated ${revenue} revenue with ${profit} real profit and ${margin} net margin. ${mainIssue} ${opportunity}`;
  }, [analysis, settings, storeName]);

  const topFixes = useMemo(() => {
    const fixes = [];

    analysis.lossMaking.slice(0, 2).forEach((product) => {
      fixes.push(`Pause or review ${product.product} because it is losing ${formatMoney(Math.abs(product.realProfit), settings)}.`);
    });

    analysis.lowMargin.slice(0, 2).forEach((product) => {
      fixes.push(`Improve margin on ${product.product}; suggested price is around ${formatMoney(product.suggestedPrice, settings)}.`);
    });

    analysis.highReturn.slice(0, 2).forEach((product) => {
      fixes.push(`Investigate returns for ${product.product}; return rate is ${formatPercent(product.returnRate)}.`);
    });

    analysis.promote.slice(0, 1).forEach((product) => {
      fixes.push(`Promote ${product.product} because it has ${formatPercent(product.margin)} margin and low return risk.`);
    });

    if (!fixes.length) {
      fixes.push("Keep monitoring margin, ad spend, shipping cost, and return rate weekly.");
      fixes.push("Promote products with strong margin and low return risk.");
      fixes.push("Avoid heavy discounts unless they improve real profit.");
    }

    return fixes.slice(0, 3);
  }, [analysis, settings]);

  const suggestions = useMemo(() => {
    const result = [];

    analysis.lossMaking.forEach((p) => {
      result.push({
        type: "Loss Alert",
        priority: "High",
        title: `${p.product} is losing money`,
        text: `Revenue is ${formatMoney(p.revenue, settings)} but real profit is ${formatMoney(p.realProfit, settings)}. Break-even price is around ${formatMoney(p.breakEvenPrice, settings)} per unit. Reduce ad spend, raise price, reduce discount, or lower delivery cost.`,
        action: `Aim for ${formatMoney(p.suggestedPrice, settings)} selling price per unit to target ${settings.targetMargin}% margin.`
      });
    });

    analysis.lowMargin.slice(0, 5).forEach((p) => {
      if (p.realProfit >= 0) {
        result.push({
          type: "Margin Fix",
          priority: "Medium",
          title: `${p.product} has weak margin`,
          text: `Current margin is ${formatPercent(p.margin)}. This is below your target of ${settings.targetMargin}%.`,
          action: `Try selling near ${formatMoney(p.suggestedPrice, settings)}, reduce discount, or bundle it with a high-margin product.`
        });
      }
    });

    analysis.highReturn.forEach((p) => {
      result.push({
        type: "Return Risk",
        priority: "Medium",
        title: `${p.product} has high returns`,
        text: `Return rate is ${formatPercent(p.returnRate)}, above your ${settings.highReturnThreshold}% alert level.`,
        action: "Check product photos, size/variant details, customer expectations, quality, and packaging."
      });
    });

    analysis.promote.slice(0, 3).forEach((p) => {
      result.push({
        type: "Growth Opportunity",
        priority: "Low",
        title: `Promote ${p.product}`,
        text: `This product has ${formatPercent(p.margin)} margin and low return risk. It is a strong candidate for ads or homepage placement.`,
        action: "Increase visibility slowly and monitor profit, not only revenue."
      });
    });

    if (!result.length) {
      result.push({
        type: "Healthy Store",
        priority: "Low",
        title: "Your store looks healthy",
        text: "No major loss-making, low-margin, or high-return issue was found.",
        action: "Keep monitoring margin, ad spend, delivery cost, and return rate every week."
      });
    }

    return result;
  }, [analysis, settings]);

  const visibleProducts = useMemo(() => {
    return [...analysis.products]
      .filter((p) => `${p.product} ${p.sku}`.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0));
  }, [analysis.products, searchTerm, sortBy]);

  const chartProducts = useMemo(() => {
    return [...analysis.products].sort((a, b) => b.realProfit - a.realProfit).slice(0, 6);
  }, [analysis.products]);

  const resetDemoData = () => {
    setOrders(sampleOrders);
    setCosts(sampleCosts);
    setAds(sampleAds);
    setShipping(sampleShipping);
    setReturns(sampleReturns);
    setSettings(defaultSettings);
    setSearchTerm("");
    setSortBy("realProfit");
    setStoreName("Demo E-commerce Store");
    setClientName("");
    setConsultantNotes("");
  };

  const exportAnalysis = () => {
    const rows = analysis.products.map((p) => ({
      sku: p.sku,
      product: p.product,
      revenue: Math.round(p.revenue),
      totalCost: Math.round(p.totalCost),
      realProfit: Math.round(p.realProfit),
      marginPercent: p.margin.toFixed(2),
      unitsSold: p.unitsSold,
      returnedUnits: p.returnedUnits,
      returnRatePercent: p.returnRate.toFixed(2),
      breakEvenPrice: Math.round(p.breakEvenPrice),
      suggestedPrice: Math.round(p.suggestedPrice),
      status: getHealthStatus(p, settings).label
    }));
    downloadFile("profitlens_analysis_report.csv", toCSV(rows));
  };

  const saveReport = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${storeName || "Store"} Profit Report ${new Date().toLocaleDateString()}`,
          orders,
          costs,
          ads,
          shipping,
          returns,
          settings: {
            ...settings,
            storeName,
            clientName,
            consultantNotes,
            profitHealthScore,
            executiveSummary,
            topFixes
          },
          analysis
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save report");

      setReports((current) => [data.report, ...current]);
      alert("Report saved successfully.");
    } catch (error) {
      alert(error?.message || "Could not save report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f5] text-slate-950 p-5 md:p-8">
      <div className="max-w-[1500px] mx-auto space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-between">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <BarChart3 className="h-8 w-8" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">ProfitLens Dashboard</h1>
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Live profit audit workspace for e-commerce data</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Pill text={`MVP v${APP_VERSION}`} />
                    <Pill text={`${analysis.products.length} products`} />
                    <Pill text={`${orders.length} order rows`} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" onClick={resetDemoData}>
                  <RefreshCcw className="w-4 h-4 mr-2" /> Reset Demo
                </Button>
                <Button variant="outline" className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" onClick={exportAnalysis}>
                  <Download className="w-4 h-4 mr-2" /> Export CSV
                </Button>
                <Button className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600" onClick={() => window.print()}>
                  <FileText className="w-4 h-4 mr-2" /> Print Report
                </Button>
                <Button className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={saveReport} disabled={saving}>
                  <FileText className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Report"}
                </Button>
                <Button
  variant="outline"
  className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
  onClick={() => window.print()}
>
  <FileText className="mr-2 h-4 w-4" />
  Export PDF
</Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoMiniCard title="Workspace Status" value="Active" subValue="Analysis ready" icon={<Activity className="h-5 w-5" />} accent="emerald" />
              <InfoMiniCard title="Period" value="Live Data" subValue="CSV based" icon={<CalendarDays className="h-5 w-5" />} accent="sky" />
              <InfoMiniCard title="Store" value={storeName || "Not set"} subValue="Audit target" icon={<Store className="h-5 w-5" />} accent="violet" />
              <InfoMiniCard title="Client" value={clientName || "Optional"} subValue="Report owner" icon={<UserRound className="h-5 w-5" />} accent="amber" />
            </div>
          </div>
        </motion.section>

       <section className="grid gap-6 xl:grid-cols-4">
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Profit Health Score</p>
                  <h2 className="mt-2 text-5xl font-bold text-slate-900">
                    {profitHealthScore}<span className="text-xl text-slate-400">/100</span>
                  </h2>
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 text-sm font-bold ${
                    profitHealthScore >= 80
                      ? "bg-emerald-100 text-emerald-700"
                      : profitHealthScore >= 60
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {healthLabel}
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${profitHealthScore >= 80 ? "bg-emerald-500" : profitHealthScore >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                  style={{ width: `${profitHealthScore}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-slate-500">Based on margin, real profit, return rate, loss-making products, and low-margin products.</p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-500">Executive Summary</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{storeName || "Store"} Profit Audit</h2>
              </div>
              <p className="text-sm leading-7 text-slate-600">{executiveSummary}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Store / Brand Name</span>
                  <input
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    placeholder="Example: ABC Fashion Store"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500">Client Name</span>
                  <input
                    value={clientName}
                    onChange={(event) => setClientName(event.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Top 3 Fixes This Week</p>
              <div className="mt-4 space-y-3">
                {topFixes.map((fix, index) => (
                  <div key={index} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {index + 1}
                    </span>
                    {fix}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
  <CardContent className="p-6">
    <p className="text-sm font-medium text-slate-500">Data Quality</p>

    <h2 className="mt-2 text-4xl font-bold text-slate-900">
      {dataQuality.score}/100
    </h2>

    <p
      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
        dataQuality.score >= 85
          ? "bg-emerald-100 text-emerald-700"
          : dataQuality.score >= 60
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-700"
      }`}
    >
      {dataQuality.status}
    </p>

    <div className="mt-4 space-y-2 text-sm text-slate-600">
      <p>Missing product cost: {dataQuality.missingCost}</p>
      <p>Missing shipping cost: {dataQuality.missingShipping}</p>
    </div>

    <p className="mt-4 text-xs text-slate-500">
      Better data gives a more accurate profit report.
    </p>
  </CardContent>
</Card>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <MetricCard icon={<IndianRupee className="h-5 w-5" />} label="Total Revenue" value={formatMoney(analysis.totals.revenue, settings)} />
          <MetricCard icon={<TrendingUp className="h-5 w-5" />} label="Real Profit" value={formatMoney(analysis.totals.realProfit, settings)} positive={analysis.totals.realProfit >= 0} />
          <MetricCard icon={<Percent className="h-5 w-5" />} label="Net Margin" value={formatPercent(analysis.totals.margin)} positive={analysis.totals.margin >= settings.targetMargin} />
          <MetricCard icon={<Package className="h-5 w-5" />} label="Units Sold" value={analysis.totals.unitsSold} />
          <MetricCard icon={<AlertTriangle className="h-5 w-5" />} label="Return Rate" value={formatPercent(analysis.totals.returnRate)} warning={analysis.totals.returnRate >= settings.highReturnThreshold} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Upload Store Data</h2>
                    <p className="text-sm text-slate-500">Upload all 5 CSV files for a complete profit audit.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">CSV only</div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FileUploader title="Orders CSV" helper="orderId,date,product,sku,quantity,sellingPrice,discount,paymentFee" templateKey="orders" requiredColumns={["sku", "quantity", "sellingPrice"]} rowsCount={orders.length} onUpload={setOrders} />
                  <FileUploader title="Product Cost CSV" helper="sku,product,productCost,packagingCost" templateKey="costs" requiredColumns={["sku", "productCost"]} rowsCount={costs.length} onUpload={setCosts} />
                  <FileUploader title="Ad Spend CSV" helper="sku,adSpend" templateKey="ads" requiredColumns={["sku", "adSpend"]} rowsCount={ads.length} onUpload={setAds} />
                  <FileUploader title="Shipping CSV" helper="sku,shippingCost" templateKey="shipping" requiredColumns={["sku", "shippingCost"]} rowsCount={shipping.length} onUpload={setShipping} />
                  <FileUploader title="Returns CSV" helper="sku,returnedUnits" templateKey="returns" requiredColumns={["sku", "returnedUnits"]} rowsCount={returns.length} onUpload={setReturns} />
                </div>
              </CardContent>
            </Card>

            {analysis.warnings.length > 0 && (
              <Card className="rounded-[28px] border-0 bg-yellow-50 shadow-sm ring-1 ring-yellow-100">
                <CardContent className="p-6">
                  <h2 className="font-bold flex items-center gap-2 text-yellow-900"><AlertTriangle className="w-5 h-5" /> Data Warnings</h2>
                  <div className="grid md:grid-cols-2 gap-2 mt-3">
                    {analysis.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-900">• {warning}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Revenue Trend</h2>
                    <p className="text-sm text-slate-500">Revenue timeline from uploaded orders.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Live</div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.daily}>
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatMoney(value, settings)} />
                      <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Product Profitability</h2>
                    <p className="text-sm text-slate-500">Revenue, profit, margin, returns, and suggested pricing.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search product"
                        className="w-48 rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none"
                    >
                      <option value="realProfit">Sort: Profit</option>
                      <option value="revenue">Sort: Revenue</option>
                      <option value="margin">Sort: Margin</option>
                      <option value="returnRate">Sort: Return Rate</option>
                    </select>
                  </div>
                </div>
                <TableCard products={visibleProducts} settings={settings} />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <InsightCard title="AI Business Suggestions" suggestions={suggestions} />

            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                    <SettingsIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Business Settings</h2>
                    <p className="text-sm text-slate-500">Adjust your audit assumptions.</p>
                  </div>
                </div>
                <div className="grid gap-4">
                  <NumberInput label="Target Margin %" value={settings.targetMargin} onChange={(value) => setSettings((s) => ({ ...s, targetMargin: value }))} icon={<Target className="h-4 w-4" />} />
                  <NumberInput label="High Return Alert %" value={settings.highReturnThreshold} onChange={(value) => setSettings((s) => ({ ...s, highReturnThreshold: value }))} icon={<Percent className="h-4 w-4" />} />
                  <NumberInput label="Default Shipping Cost" value={settings.defaultShippingCost} onChange={(value) => setSettings((s) => ({ ...s, defaultShippingCost: value }))} icon={<Truck className="h-4 w-4" />} />
                  <NumberInput label="Default Payment Fee %" value={settings.defaultPaymentFeePercent} onChange={(value) => setSettings((s) => ({ ...s, defaultPaymentFeePercent: value }))} icon={<ReceiptIndianRupee className="h-4 w-4" />} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Top Product Profit</h2>
                    <p className="text-sm text-slate-500">Best performing products.</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartProducts}>
                      <XAxis dataKey="product" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={65} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => formatMoney(value, settings)} />
                      <Bar dataKey="realProfit" fill="#6366f1" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <SmallList title="Loss-making Products" items={analysis.lossMaking} empty="No loss-making products found." kind="loss" settings={settings} />
          <SmallList title="High-return Products" items={analysis.highReturn} empty="No high-return products found." kind="return" settings={settings} />
          <SmallList title="Best Products to Promote" items={analysis.promote} empty="No strong promotion candidate yet." kind="promote" settings={settings} />
        </section>

        <section>
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Manual Consultant Notes</p>
                  <h2 className="text-xl font-bold text-slate-900">Your Expert Recommendation</h2>
                </div>
              </div>
              <textarea
                value={consultantNotes}
                onChange={(event) => setConsultantNotes(event.target.value)}
                placeholder="Example: I recommend reducing discounts on low-margin products and shifting ad budget toward products with strong margins and low return rates."
                className="min-h-[140px] w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none"
              />
              <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-800">
                These notes are saved locally in this MVP and can be used later in PDF/client report export.
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900">Saved Report History</h2>
                <p className="text-sm text-slate-500">Your saved ProfitLens analysis reports.</p>
              </div>

              {reports.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                  No saved reports yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {reports.map((report) => (
                    <div key={report.id || report.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{report.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Saved locally"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-2 text-slate-500">
                          <FileText className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function Pill({ text }) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">{text}</span>;
}

function InfoMiniCard({ title, value, subValue, icon, accent }) {
  const accentMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700"
  };

  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className={`rounded-2xl p-2 ${accentMap[accent]}`}>{icon}</div>
      </div>
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900 truncate">{value}</h3>
      <p className="text-sm text-slate-500">{subValue}</p>
    </div>
  );
}

function FileUploader({ title, helper, templateKey, requiredColumns, onUpload, rowsCount }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
          <Upload className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600">{rowsCount} rows</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      <div className="mt-3 flex flex-col gap-2">
        <input
          type="file"
          accept=".csv"
          className="block w-full text-xs text-slate-600"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = parseCSV(String(reader.result));

if (!parsed.length) {
  throw new Error("CSV file is empty.");
}

const mappedRows = autoMapCsvRows(parsed, requiredColumns);

const availableColumns = Object.keys(mappedRows[0] || {});
const missing = requiredColumns.filter(
  (column) => !availableColumns.includes(column)
);

if (missing.length) {
  throw new Error(
    `Missing columns: ${missing.join(", ")}. If this is a Shopify file, make sure it contains SKU, quantity, and price columns.`
  );
}

setError("");
setSuccess("CSV uploaded and mapped successfully.");
onUpload(mappedRows);
              } catch (err) {
                setError(err.message || "Could not read CSV file.");
              }
            };
            reader.onerror = () => setError("Could not read this file.");
            reader.readAsText(file);
          }}
        />
        <button onClick={() => downloadTemplate(templateKey)} className="text-xs text-left font-medium underline underline-offset-4 text-slate-600">
          Download sample template
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-600">{success}</p>}
    </div>
  );
}

function NumberInput({ label, value, onChange, icon }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className="rounded-lg bg-slate-100 p-1 text-slate-600">{icon}</span>
        {label}
      </span>
      <input
        type="number"
        value={value}
        min="0"
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
        onChange={(e) => onChange(Number(e.target.value || 0))}
      />
    </label>
  );
}

function MetricCard({ icon, label, value, positive, warning }) {
  const status = warning ? "Alert" : positive === false ? "Check" : positive === true ? "Good" : "Live";
  const tone = warning ? "bg-yellow-100 text-yellow-800" : positive === false ? "bg-red-100 text-red-700" : positive === true ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700";

  return (
    <Card className="rounded-[24px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
      </CardContent>
    </Card>
  );
}

function TableCard({ products, settings }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-slate-500">
            <th className="py-3 font-medium">Product</th>
            <th className="font-medium">Revenue</th>
            <th className="font-medium">Profit</th>
            <th className="font-medium">Margin</th>
            <th className="font-medium">Return</th>
            <th className="font-medium">Status</th>
            <th className="font-medium">Suggested Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const status = getHealthStatus(p, settings);
            return (
              <tr key={p.sku} className="border-b border-slate-100 last:border-none">
                <td className="py-4">
                  <div className="font-semibold text-slate-900">{p.product}</div>
                  <div className="text-xs text-slate-500">{p.sku}</div>
                </td>
                <td className="text-slate-700">{formatMoney(p.revenue, settings)}</td>
                <td className={p.realProfit < 0 ? "font-semibold text-red-700" : "font-semibold text-slate-900"}>{formatMoney(p.realProfit, settings)}</td>
                <td className="text-slate-700">{formatPercent(p.margin)}</td>
                <td className="text-slate-700">{formatPercent(p.returnRate)}</td>
                <td><span className={`rounded-full px-2 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span></td>
                <td className="font-medium text-slate-900">{formatMoney(p.suggestedPrice, settings)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InsightCard({ title, suggestions }) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Rule-based MVP suggestions</p>
          </div>
        </div>
        <div className="space-y-3 max-h-[32rem] overflow-auto pr-1">
          {suggestions.map((item, index) => (
            <div key={index} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.type}</p>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.priority === "High" ? "bg-red-100 text-red-700" : item.priority === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-700"}`}>{item.priority}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
              <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700">
                <CheckCircle2 className="inline h-4 w-4 mr-1" /> {item.action}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SmallList({ title, items, empty, kind, settings }) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
            {kind === "loss" ? <TrendingDown className="h-5 w-5" /> : kind === "return" ? <AlertTriangle className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Quick product watchlist</p>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {empty}</div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((p) => (
              <div key={p.sku} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{p.product}</h3>
                    <p className="text-xs text-slate-500">{p.sku}</p>
                  </div>
                  {kind === "loss" ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                </div>
                {kind === "loss" && <p className="mt-2 text-sm text-slate-600">Profit: {formatMoney(p.realProfit, settings)}</p>}
                {kind === "return" && <p className="mt-2 text-sm text-slate-600">Return rate: {formatPercent(p.returnRate)}</p>}
                {kind === "promote" && <p className="mt-2 text-sm text-slate-600">Margin: {formatPercent(p.margin)}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    
  );
  function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function ReportList({
  title,
  items,
  empty,
  valueLabel,
  valueGetter,
}: {
  title: string;
  items: any[];
  empty: string;
  valueLabel: string;
  valueGetter: (item: any) => string;
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.slice(0, 5).map((item: any) => (
            <div key={item.sku} className="rounded-2xl bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{item.product}</p>
              <p className="mt-1 text-xs text-slate-500">{item.sku}</p>
              <p className="mt-2 text-slate-700">
                {valueLabel}:{" "}
                <span className="font-semibold">{valueGetter(item)}</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
}
