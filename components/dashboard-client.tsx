// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
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
  CalendarDays,
  Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { FeatureLock } from "@/components/feature-lock";
import { analyzeProfit } from "@/lib/profit";
import { getPlanConfig } from "@/lib/app-config";

const APP_VERSION = "1.2.1";
const STORAGE_KEY = "profitlens_real_world_mvp_v2";
const THEME_EVENT = "profitlens-dashboard-theme";

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

function trackEvent(event, properties = {}) {
  if (typeof window === "undefined") return;
  window.posthog?.capture?.(event, properties);
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

function mapWooCommerceOrdersCsv(rows: any[]) {
  return rows
    .map((row, index) => {
      const orderId =
        getValueFromPossibleColumns(row, [
          "Order ID",
          "Order Number",
          "ID",
          "Order",
          "Order Number",
        ]) || `WOO-${index + 1}`;

      const date =
        getValueFromPossibleColumns(row, [
          "Date",
          "Date Created",
          "Order Date",
          "Created Date",
        ]) || "";

      const product =
        getValueFromPossibleColumns(row, [
          "Product Name",
          "Product",
          "Item Name",
          "Name",
          "Line Item Name",
        ]) || "Unknown Product";

      const sku =
        getValueFromPossibleColumns(row, [
          "SKU",
          "Product SKU",
          "Item SKU",
          "Line Item SKU",
        ]) || "";

      const quantity =
        Number(
          getValueFromPossibleColumns(row, [
            "Quantity",
            "Qty",
            "Item Quantity",
            "Line Item Quantity",
          ]) || 1
        ) || 1;

      const sellingPrice =
        Number(
          getValueFromPossibleColumns(row, [
            "Item Cost",
            "Item Total",
            "Product Total",
            "Line Total",
            "Total",
            "Subtotal",
            "Price",
          ]) || 0
        ) || 0;

      const discount =
        Number(
          getValueFromPossibleColumns(row, [
            "Discount Amount",
            "Discount",
            "Cart Discount",
            "Order Discount",
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
function mapWooCommerceProductCsvToCosts(rows: any[]) {
  return rows
    .map((row) => {
      const sku =
        getValueFromPossibleColumns(row, [
          "SKU",
          "Product SKU",
          "Item SKU",
          "Line Item SKU",
        ]) || "";

      const product =
        getValueFromPossibleColumns(row, [
          "Product Name",
          "Product",
          "Item Name",
          "Name",
          "Title",
        ]) || sku;

      const productCost =
        Number(
          getValueFromPossibleColumns(row, [
            "Cost",
            "Cost per item",
            "Product Cost",
            "COGS",
            "Purchase Price",
            "Regular Price",
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
  const shopifyMapped = mapShopifyOrdersCsv(rows);

  if (shopifyMapped.length > 0) {
    return shopifyMapped;
  }

  const wooMapped = mapWooCommerceOrdersCsv(rows);

  if (wooMapped.length > 0) {
    return wooMapped;
  }
}

if (isCostUpload) {
  const shopifyMapped = mapShopifyProductCsvToCosts(rows);

  if (shopifyMapped.length > 0) {
    return shopifyMapped;
  }

  const wooMapped = mapWooCommerceProductCsvToCosts(rows);

  if (wooMapped.length > 0) {
    return wooMapped;
  }
}

  return rows;
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

function UpgradeOptions({ checkingOutPlan, onCheckout }) {
  const plans = [
    { key: "STARTER", name: "Starter", price: "Rs. 799/mo", detail: "10 reports, 5,000 rows, exports, advanced AI" },
    { key: "GROWTH", name: "Growth", price: "Rs. 1,999/mo", detail: "50 reports, 25,000 rows, exports, advanced AI" },
    { key: "PRO", name: "Pro", price: "Rs. 4,999/mo", detail: "Unlimited reports, 100,000 rows, exports, advanced AI" }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.key} className="rounded-[24px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{plan.price}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">Paid</span>
          </div>
          <p className="mt-3 min-h-[40px] text-sm text-slate-500">{plan.detail}</p>
          <button
            type="button"
            onClick={() => onCheckout(plan.key)}
            disabled={checkingOutPlan === plan.key}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {checkingOutPlan === plan.key ? "Opening checkout..." : `Upgrade to ${plan.name}`}
          </button>
        </div>
      ))}
    </div>
  );
}

function ActionPlanList({ title, items, empty, tone }) {
  const toneMap = {
    red: "bg-red-50 text-red-700 ring-red-100",
    amber: "bg-amber-50 text-amber-800 ring-amber-100",
    sky: "bg-sky-50 text-sky-700 ring-sky-100",
    orange: "bg-orange-50 text-orange-800 ring-orange-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100"
  };

  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${title}-${item.sku}`} className={`rounded-2xl p-3 text-xs ring-1 ${toneMap[tone]}`}>
              <p className="font-bold">{item.product}</p>
              <p className="mt-1 opacity-90">{item.detail}</p>
            </div>
          ))
        ) : (
          <p className="rounded-2xl bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-100">{empty}</p>
        )}
      </div>
    </div>
  );
}

function SimulatorInput({ label, value, min, max, onChange }) {
  return (
    <label className="block rounded-2xl bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-100">
          {value > 0 ? "+" : ""}{value}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-emerald-600"
      />
    </label>
  );
}

function ComparisonTile({ label, value, positive }) {
  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${positive ? "text-emerald-700" : "text-red-700"}`}>{value}</p>
    </div>
  );
}

function FileUploader({ title, helper, templateKey, requiredColumns, onUpload, onRemove, rowsCount, currentTotalRows, maxRows }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileName, setFileName] = useState("");
  const inputId = `upload-${templateKey}`;

  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600">{rowsCount} rows</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>
      {fileName && (
        <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
          <span className="font-semibold text-slate-800">File:</span> {fileName}
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 bg-white px-4 py-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <Upload className="h-5 w-5 text-emerald-600" />
          <span className="mt-2 text-sm font-semibold text-slate-900">
            {fileName ? "Replace CSV file" : "Add CSV file"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            Click to upload a .csv file
          </span>
        </label>
        <input
          id={inputId}
          key={fileName || "empty-file"}
          type="file"
          accept=".csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = parseCSV(String(reader.result));

if (!parsed.length) {
  throw new Error("CSV file is empty.");
}

const mappedRows = autoMapCsvRows(parsed, requiredColumns);
const nextTotalRows = Number(currentTotalRows || 0) - Number(rowsCount || 0) + mappedRows.length;

if (nextTotalRows > Number(maxRows || 0)) {
  throw new Error(`This upload would use ${nextTotalRows} CSV rows. Your plan allows up to ${maxRows} rows.`);
}

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
setSuccess("CSV uploaded successfully. ProfitLens auto-mapped columns when needed.");
trackEvent("csv_uploaded", {
  uploadType: templateKey,
  fileName: file.name,
  rows: mappedRows.length,
  totalRows: nextTotalRows
});
onUpload(mappedRows);
              } catch (err) {
                setFileName("");
                const message = err.message || "Could not read CSV file.";
                setError(message);
                trackEvent("csv_upload_failed", {
                  uploadType: templateKey,
                  fileName: file.name,
                  reason: message
                });
              }
            };
            reader.onerror = () => {
              setError("Could not read this file.");
              trackEvent("csv_upload_failed", {
                uploadType: templateKey,
                fileName: file.name,
                reason: "reader_error"
              });
            };
            reader.readAsText(file);
          }}
        />
        <button
          onClick={() => {
            trackEvent("csv_template_downloaded", { uploadType: templateKey });
            downloadTemplate(templateKey);
          }}
          className="text-xs text-left font-medium underline underline-offset-4 text-slate-600"
        >
          Download sample template
        </button>
        {fileName && (
          <button
            type="button"
            onClick={() => {
              setFileName("");
              setError("");
              setSuccess("");
              trackEvent("csv_removed", { uploadType: templateKey });
              onRemove();
            }}
            className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Remove file
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      {success && <p className="mt-2 text-xs text-emerald-600">{success}</p>}
    </div>
  );
}

export function DashboardClient({
  initialReports = [],
  userPlan = "FREE",
  reportsUsedThisMonth = 0,
  userId = "",
  userEmail = "",
  userName = ""
} = {}) {
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
  const [workspaceMode, setWorkspaceMode] = useState("demo");
  const [uploadPreset, setUploadPreset] = useState("custom");
  const [dashboardTheme, setDashboardTheme] = useState("light");
  const [simulator, setSimulator] = useState({
    priceChange: 0,
    adSpendChange: 0,
    shippingChange: 0,
    discountChange: 0,
    returnRateChange: 0
  });
  const [reports, setReports] = useState(initialReports || []);
  const [saving, setSaving] = useState(false);
  const [openingReportId, setOpeningReportId] = useState("");
  const [deletingReportId, setDeletingReportId] = useState("");
  const [currentReportId, setCurrentReportId] = useState("");
  const [exporting, setExporting] = useState("");
  const [advancedSuggestions, setAdvancedSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [checkingOutPlan, setCheckingOutPlan] = useState("");

  const planConfig = useMemo(() => getPlanConfig(userPlan), [userPlan]);
  const planIsPaid = userPlan !== "FREE";

  useEffect(() => {
    if (userId) {
      window.posthog?.identify?.(userId, {
        email: userEmail,
        name: userName,
        plan: userPlan
      });
    }

    if (userEmail) {
      window.$crisp?.push?.(["set", "user:email", [userEmail]]);
    }

    if (userName) {
      window.$crisp?.push?.(["set", "user:nickname", [userName]]);
    }
  }, [userId, userEmail, userName, userPlan]);

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
      setWorkspaceMode(parsed.workspaceMode || "demo");
      setUploadPreset(parsed.uploadPreset || "custom");
      setDashboardTheme(parsed.dashboardTheme === "dark" ? "dark" : "light");
    } catch {
      // Ignore invalid local data.
    }
  }, []);

  useEffect(() => {
    const payload = { orders, costs, ads, shipping, returns, settings, storeName, clientName, consultantNotes, workspaceMode, uploadPreset, dashboardTheme, version: APP_VERSION };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [orders, costs, ads, shipping, returns, settings, storeName, clientName, consultantNotes, workspaceMode, uploadPreset, dashboardTheme]);

  useEffect(() => {
    document.body.classList.toggle("dashboard-page-dark", dashboardTheme === "dark");
    document.body.classList.toggle("dashboard-page-light", dashboardTheme !== "dark");

    return () => {
      document.body.classList.remove("dashboard-page-dark", "dashboard-page-light");
    };
  }, [dashboardTheme]);

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent).detail?.theme;
      if (nextTheme === "light" || nextTheme === "dark") {
        setDashboardTheme(nextTheme);
      }
    };

    window.addEventListener(THEME_EVENT, handleThemeChange);
    return () => window.removeEventListener(THEME_EVENT, handleThemeChange);
  }, []);

  const analysis = useMemo(() => {
    const profitAnalysis = analyzeProfit({
      orders,
      costs,
      ads,
      shipping,
      returns,
      settings
    });

    const lowMargin = [...profitAnalysis.lowMargin].sort((a, b) => a.margin - b.margin);
    const lossMaking = [...profitAnalysis.lossMaking].sort((a, b) => a.realProfit - b.realProfit);
    const highReturn = [...profitAnalysis.highReturn].sort((a, b) => b.returnRate - a.returnRate);
    const promote = [...profitAnalysis.promote].sort((a, b) => b.realProfit - a.realProfit);

    const dailyMap: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.date || "Unknown";
      dailyMap[date] = (dailyMap[date] || 0) + Number(order.sellingPrice || 0) * Number(order.quantity || 1);
    });
    const daily = Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));

    return {
      ...profitAnalysis,
      lowMargin,
      lossMaking,
      highReturn,
      promote,
      daily,
      warnings: profitAnalysis.warnings.slice(0, 8)
    };
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

  const actionPlan = useMemo(() => {
    const stopAds = analysis.lossMaking
      .filter((product) => Number(product.adSpend || 0) > 0)
      .slice(0, 4)
      .map((product) => ({
        sku: product.sku,
        product: product.product,
        detail: `Ad spend ${formatMoney(product.adSpend, settings)} while profit is ${formatMoney(product.realProfit, settings)}.`
      }));

    const increasePrice = analysis.lowMargin
      .slice(0, 4)
      .map((product) => ({
        sku: product.sku,
        product: product.product,
        detail: `Target selling price near ${formatMoney(product.suggestedPrice, settings)} for ${settings.targetMargin}% margin.`
      }));

    const reduceDiscount = analysis.products
      .filter((product) => Number(product.discount || 0) > 0 && product.margin < settings.targetMargin)
      .sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0))
      .slice(0, 4)
      .map((product) => ({
        sku: product.sku,
        product: product.product,
        detail: `Discount impact ${formatMoney(product.discount, settings)} with margin ${formatPercent(product.margin)}.`
      }));

    const fixReturns = analysis.highReturn.slice(0, 4).map((product) => ({
      sku: product.sku,
      product: product.product,
      detail: `Return rate ${formatPercent(product.returnRate)}. Check quality, size details, photos, and packaging.`
    }));

    const promoteWinners = analysis.promote.slice(0, 4).map((product) => ({
      sku: product.sku,
      product: product.product,
      detail: `Profit ${formatMoney(product.realProfit, settings)} with ${formatPercent(product.margin)} margin.`
    }));

    return { stopAds, increasePrice, reduceDiscount, fixReturns, promoteWinners };
  }, [analysis, settings]);

  const simulatorResult = useMemo(() => {
    const priceMultiplier = 1 + Number(simulator.priceChange || 0) / 100;
    const adMultiplier = 1 + Number(simulator.adSpendChange || 0) / 100;
    const shippingMultiplier = 1 + Number(simulator.shippingChange || 0) / 100;
    const discountMultiplier = 1 + Number(simulator.discountChange || 0) / 100;
    const returnDrag = analysis.totals.revenue * (Number(simulator.returnRateChange || 0) / 100);

    const projectedRevenue = analysis.totals.revenue * priceMultiplier;
    const projectedCosts = analysis.products.reduce((total, product) => {
      return (
        total +
        Number(product.productCost || 0) +
        Number(product.packagingCost || 0) +
        Number(product.paymentFee || 0) +
        Number(product.shippingCost || 0) * shippingMultiplier +
        Number(product.discount || 0) * discountMultiplier +
        Number(product.adSpend || 0) * adMultiplier
      );
    }, 0);

    const projectedProfit = projectedRevenue - projectedCosts - returnDrag;
    const projectedMargin = projectedRevenue ? (projectedProfit / projectedRevenue) * 100 : 0;

    return {
      revenue: projectedRevenue,
      profit: projectedProfit,
      margin: projectedMargin,
      profitDelta: projectedProfit - analysis.totals.realProfit
    };
  }, [analysis, simulator]);

  const missingCostRows = useMemo(() => {
    const costSkus = new Set(costs.map((item) => normalizeSku(item.sku)));
    return analysis.products
      .filter((product) => !costSkus.has(normalizeSku(product.sku)))
      .map((product) => ({ sku: product.sku, product: product.product, productCost: "", packagingCost: "" }));
  }, [analysis.products, costs]);

  const missingShippingRows = useMemo(() => {
    const shippingSkus = new Set(shipping.map((item) => normalizeSku(item.sku)));
    return analysis.products
      .filter((product) => !shippingSkus.has(normalizeSku(product.sku)))
      .map((product) => ({ sku: product.sku, shippingCost: "" }));
  }, [analysis.products, shipping]);

  const onboardingItems = useMemo(() => [
    { label: "Choose demo or live workspace", done: workspaceMode === "live" },
    { label: "Upload orders", done: orders.length > 0 },
    { label: "Upload product costs", done: costs.length > 0 },
    { label: "Upload shipping costs", done: shipping.length > 0 },
    { label: "Upload ad spend", done: ads.length > 0 },
    { label: "Save first report", done: reports.length > 0 }
  ], [workspaceMode, orders.length, costs.length, shipping.length, ads.length, reports.length]);

  const reportComparison = useMemo(() => {
    const comparisonReport = reports.find(
      (report) => report?.analysis?.totals && (report.id || report.title) !== currentReportId
    );
    const previous = comparisonReport?.analysis?.totals;
    if (!previous) return null;

    return {
      reportTitle: comparisonReport?.title || "Last saved report",
      revenueDelta: Number(analysis.totals.revenue || 0) - Number(previous.revenue || 0),
      profitDelta: Number(analysis.totals.realProfit || 0) - Number(previous.realProfit || 0),
      marginDelta: Number(analysis.totals.margin || 0) - Number(previous.margin || 0),
      newLossMakers: analysis.lossMaking.filter(
        (product) => !(comparisonReport?.analysis?.lossMaking || []).some((oldProduct) => oldProduct.sku === product.sku)
      ).length
    };
  }, [analysis, currentReportId, reports]);

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

  const totalUploadedRows = orders.length + costs.length + ads.length + shipping.length + returns.length;
  const maxCsvRows = Number(planConfig.maxCsvRows);
  const reportLimitLabel = planConfig.reportsPerMonth === "unlimited" ? "Unlimited" : `${reportsUsedThisMonth}/${planConfig.reportsPerMonth}`;
  const csvLimitLabel = `${totalUploadedRows}/${planConfig.maxCsvRows}`;
  const presetHelper = {
    shopify: "Auto-map Shopify exports with SKU, product, quantity, price, discount, and fees where available.",
    woocommerce: "Auto-map WooCommerce orders and product fields into the ProfitLens format.",
    marketplace: "Use this for Amazon or marketplace style SKU, sales, ads, returns, and shipping exports.",
    custom: "Use the sample templates when your CSV columns are custom."
  }[uploadPreset];

  const exportRows = () =>
    analysis.products.map((p) => ({
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
    setWorkspaceMode("demo");
    setUploadPreset("custom");
    setCurrentReportId("");
    setSimulator({
      priceChange: 0,
      adSpendChange: 0,
      shippingChange: 0,
      discountChange: 0,
      returnRateChange: 0
    });
  };

  const startLiveWorkspace = () => {
    setOrders([]);
    setCosts([]);
    setAds([]);
    setShipping([]);
    setReturns([]);
    setSearchTerm("");
    setSortBy("realProfit");
    setStoreName("");
    setClientName("");
    setConsultantNotes("");
    setWorkspaceMode("live");
    setCurrentReportId("");
  };

  const applyPreset = (preset) => {
    setUploadPreset(preset);
    if (preset === "shopify") setStoreName(storeName || "Shopify Store");
    if (preset === "woocommerce") setStoreName(storeName || "WooCommerce Store");
    if (preset === "marketplace") setStoreName(storeName || "Marketplace Store");
  };

  const downloadMissingCosts = () => {
    if (!missingCostRows.length) {
      alert("No missing product costs found.");
      return;
    }
    downloadFile("missing_product_costs.csv", toCSV(missingCostRows));
  };

  const downloadMissingShipping = () => {
    if (!missingShippingRows.length) {
      alert("No missing shipping costs found.");
      return;
    }
    downloadFile("missing_shipping_costs.csv", toCSV(missingShippingRows));
  };

  const exportAnalysis = async () => {
    setExporting("csv");
    trackEvent("report_csv_clicked", {
      rowCount: analysis.products.length,
      plan: userPlan
    });
    try {
      const rows = exportRows();
      const response = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "CSV export is available on paid plans.");
      }

      downloadFile("profitlens_analysis_report.csv", toCSV(rows));
      trackEvent("report_csv_exported", { rowCount: rows.length, plan: userPlan });
    } catch (error) {
      trackEvent("report_csv_failed", {
        reason: error?.message || "Could not export CSV.",
        plan: userPlan
      });
      alert(error?.message || "Could not export CSV.");
    } finally {
      setExporting("");
    }
  };

  const exportPdf = async () => {
    setExporting("pdf");
    trackEvent("report_pdf_clicked", {
      rowCount: analysis.products.length,
      plan: userPlan
    });
    try {
      const rows = exportRows();
      const response = await fetch("/api/reports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          summary: {
            storeName,
            clientName,
            generatedAt: new Date().toLocaleString(),
            revenue: formatMoney(analysis.totals.revenue, settings),
            profit: formatMoney(analysis.totals.realProfit, settings),
            margin: formatPercent(analysis.totals.margin)
          },
          topFixes,
          actionPlan,
          consultantNotes
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "PDF export is available on paid plans.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "profitlens-report.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      trackEvent("report_pdf_exported", { rowCount: rows.length, plan: userPlan });
    } catch (error) {
      trackEvent("report_pdf_failed", {
        reason: error?.message || "Could not export PDF.",
        plan: userPlan
      });
      alert(error?.message || "Could not export PDF.");
    } finally {
      setExporting("");
    }
  };

  const generateAdvancedAI = async () => {
    if (!planIsPaid) {
      trackEvent("advanced_ai_blocked", { plan: userPlan });
      alert("Advanced AI suggestions are available on paid plans. Free plan includes simple rule-based suggestions.");
      return;
    }

    setAiLoading(true);
    trackEvent("advanced_ai_requested", { plan: userPlan });
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate AI suggestions.");
      }

      setAdvancedSuggestions(
        (data.suggestions || []).map((item) => ({
          ...item,
          text: item.text || item.problem || "",
          action: item.action || "Review this recommendation."
        }))
      );
      trackEvent("advanced_ai_generated", { plan: userPlan });
    } catch (error) {
      trackEvent("advanced_ai_failed", {
        reason: error?.message || "Could not generate AI suggestions.",
        plan: userPlan
      });
      alert(error?.message || "Could not generate AI suggestions.");
    } finally {
      setAiLoading(false);
    }
  };

  const startStripeCheckout = async (plan) => {
    const priceIds = {
      STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER_INR,
      GROWTH: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_GROWTH_INR,
      PRO: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_INR
    };
    const priceId = priceIds[plan];

    if (!priceId) {
      trackEvent("checkout_blocked_missing_price", { plan });
      alert("Stripe price ID is not configured for this plan yet. Use admin grant access or add Stripe price IDs in environment variables.");
      return;
    }

    setCheckingOutPlan(plan);
    trackEvent("checkout_started", { plan });
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed.");
      }

      window.location.href = data.url;
    } catch (error) {
      trackEvent("checkout_failed", {
        plan,
        reason: error?.message || "Could not start checkout."
      });
      alert(error?.message || "Could not start checkout.");
    } finally {
      setCheckingOutPlan("");
    }
  };

  const saveReport = async () => {
    setSaving(true);
    trackEvent("report_save_started", {
      plan: userPlan,
      totalRows: orders.length + costs.length + ads.length + shipping.length + returns.length
    });
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
      setCurrentReportId(data.report.id || data.report.title || "");
      trackEvent("report_saved", {
        plan: userPlan,
        reportId: data.report.id,
        totalRows: orders.length + costs.length + ads.length + shipping.length + returns.length
      });
      alert("Report saved successfully.");
    } catch (error) {
      trackEvent("report_save_failed", {
        plan: userPlan,
        reason: error?.message || "Could not save report."
      });
      alert(error?.message || "Could not save report.");
    } finally {
      setSaving(false);
    }
  };

  const openSavedReport = async (report) => {
    setOpeningReportId(report.id || report.title || "");

    try {
      let fullReport = report;

      if (!fullReport?.orders?.length && report?.id) {
        const response = await fetch(`/api/reports/${report.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not open report.");
        }

        fullReport = data.report;
      }

      if (!fullReport?.orders?.length) {
        throw new Error("This saved report does not include source CSV data. Save it again to reopen it here.");
      }

      setOrders(fullReport.orders);
      setCosts(fullReport.costs || []);
      setAds(fullReport.ads || []);
      setShipping(fullReport.shipping || []);
      setReturns(fullReport.returns || []);
      setSettings({ ...defaultSettings, ...(fullReport.settings || {}) });
      setStoreName(fullReport.settings?.storeName || fullReport.title || "");
      setClientName(fullReport.settings?.clientName || "");
      setConsultantNotes(fullReport.settings?.consultantNotes || "");
      setWorkspaceMode("live");
      setCurrentReportId(fullReport.id || fullReport.title || "");
      setSearchTerm("");
      setSortBy("realProfit");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      alert(error?.message || "Could not open report.");
    } finally {
      setOpeningReportId("");
    }
  };

  const deleteSavedReport = async (report) => {
    const reportKey = report.id || report.title || "";
    if (!report?.id) {
      setReports((current) => current.filter((item) => (item.id || item.title) !== reportKey));
      if (currentReportId === reportKey) setCurrentReportId("");
      return;
    }

    const confirmed = window.confirm(`Delete "${report.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingReportId(reportKey);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE"
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete report.");
      }

      setReports((current) => current.filter((item) => item.id !== report.id));
      if (currentReportId === reportKey) setCurrentReportId("");
    } catch (error) {
      alert(error?.message || "Could not delete report.");
    } finally {
      setDeletingReportId("");
    }
  };

  return (
    <div className={`dashboard-shell min-h-screen bg-[#eef1f5] text-slate-950 p-0 sm:p-5 md:p-8 ${dashboardTheme === "dark" ? "dashboard-dark" : "dashboard-light"}`}>
      <div className="mx-auto max-w-[1500px] min-w-0 space-y-6">
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
                <Button variant="outline" className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" onClick={exportAnalysis} disabled={exporting === "csv"}>
                  <Download className="w-4 h-4 mr-2" /> {exporting === "csv" ? "Exporting..." : "Export CSV"}
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
  onClick={exportPdf}
  disabled={exporting === "pdf"}
>
  <FileText className="mr-2 h-4 w-4" />
  {exporting === "pdf" ? "Exporting..." : "Export PDF"}
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

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Workspace Mode</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {workspaceMode === "demo" ? "Demo workspace" : "Live store data"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {workspaceMode === "demo"
                      ? "Explore ProfitLens with sample data, then switch to live uploads."
                      : "Upload your own CSV files and build a real report."}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {workspaceMode === "demo" ? "Demo" : "Live"}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={startLiveWorkspace} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Start with your store data
                </button>
                <button onClick={resetDemoData} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                  Load sample data
                </button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Onboarding Checklist</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {onboardingItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-slate-300" />}
                    {item.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Current Plan</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">{planConfig.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {planIsPaid ? "Exports and advanced AI are unlocked." : "Free plan includes one saved report and simple suggestions."}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${planIsPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                  {userPlan}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Monthly Reports</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">{reportLimitLabel}</h2>
              <p className="mt-2 text-sm text-slate-500">Limits are enforced when saving a report.</p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">CSV Row Limit</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">{csvLimitLabel}</h2>
              <p className="mt-2 text-sm text-slate-500">Uploads are blocked before they exceed your plan.</p>
            </CardContent>
          </Card>
        </section>

        {!planIsPaid && (
          <div className="space-y-4">
            <FeatureLock
              title="Upgrade to unlock exports and advanced AI"
              description="Paid plans unlock CSV export, PDF export, higher row limits, more saved reports, and advanced AI suggestions."
              requiredPlan="Starter"
            />
            <UpgradeOptions checkingOutPlan={checkingOutPlan} onCheckout={startStripeCheckout} />
          </div>
        )}

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
                <p>{missingCostRows.length} SKUs missing product cost</p>
                <p>{missingShippingRows.length} SKUs missing shipping</p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={downloadMissingCosts}
                  disabled={!missingCostRows.length}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download missing-cost template
                </button>
                <button
                  type="button"
                  onClick={downloadMissingShipping}
                  disabled={!missingShippingRows.length}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download missing-shipping template
                </button>
              </div>
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

        <section>
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">What Changed?</p>
                  <h2 className="text-2xl font-bold text-slate-900">Tomorrow Action Plan</h2>
                </div>
                {!planIsPaid && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    Upgrade for advanced AI action plan
                  </span>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-5">
                <ActionPlanList title="Stop Ads" items={actionPlan.stopAds} empty="No losing ad spend found." tone="red" />
                <ActionPlanList title="Increase Price" items={actionPlan.increasePrice} empty="No urgent price increase found." tone="amber" />
                <ActionPlanList title="Reduce Discount" items={actionPlan.reduceDiscount} empty="Discounts look under control." tone="sky" />
                <ActionPlanList title="Fix Returns" items={actionPlan.fixReturns} empty="No high-return product found." tone="orange" />
                <ActionPlanList title="Promote Winners" items={actionPlan.promoteWinners} empty="Upload more data to find winners." tone="emerald" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)]">
          <div className="min-w-0 space-y-6">
            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Upload Store Data</h2>
                    <p className="text-sm text-slate-500">Upload all 5 CSV files for a complete profit audit.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">CSV only</div>
                </div>
                <div className="mb-5 min-w-0 rounded-[24px] bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Platform preset</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["shopify", "Shopify"],
                      ["woocommerce", "WooCommerce"],
                      ["marketplace", "Amazon/Marketplace"],
                      ["custom", "Custom CSV"]
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyPreset(key)}
                        className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                          uploadPreset === key
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-500">{presetHelper}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <FileUploader title="Orders CSV" helper="orderId,date,product,sku,quantity,sellingPrice,discount,paymentFee" templateKey="orders" requiredColumns={["sku", "quantity", "sellingPrice"]} rowsCount={orders.length} currentTotalRows={totalUploadedRows} maxRows={maxCsvRows} onUpload={setOrders} onRemove={() => setOrders([])} />
                  <FileUploader title="Product Cost CSV" helper="sku,product,productCost,packagingCost" templateKey="costs" requiredColumns={["sku", "productCost"]} rowsCount={costs.length} currentTotalRows={totalUploadedRows} maxRows={maxCsvRows} onUpload={setCosts} onRemove={() => setCosts([])} />
                  <FileUploader title="Ad Spend CSV" helper="sku,adSpend" templateKey="ads" requiredColumns={["sku", "adSpend"]} rowsCount={ads.length} currentTotalRows={totalUploadedRows} maxRows={maxCsvRows} onUpload={setAds} onRemove={() => setAds([])} />
                  <FileUploader title="Shipping CSV" helper="sku,shippingCost" templateKey="shipping" requiredColumns={["sku", "shippingCost"]} rowsCount={shipping.length} currentTotalRows={totalUploadedRows} maxRows={maxCsvRows} onUpload={setShipping} onRemove={() => setShipping([])} />
                  <FileUploader title="Returns CSV" helper="sku,returnedUnits" templateKey="returns" requiredColumns={["sku", "returnedUnits"]} rowsCount={returns.length} currentTotalRows={totalUploadedRows} maxRows={maxCsvRows} onUpload={setReturns} onRemove={() => setReturns([])} />
                </div>
              </CardContent>
            </Card>

            {analysis.warnings.length > 0 && (
              <Card className="rounded-[28px] border-0 bg-yellow-50 shadow-sm ring-1 ring-yellow-100">
                <CardContent className="p-6">
                  <h2 className="font-bold flex items-center gap-2 text-yellow-900"><AlertTriangle className="w-5 h-5" /> Data Warnings</h2>
                  <div className="grid md:grid-cols-2 gap-2 mt-3">
                    {analysis.warnings.map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-900">â€¢ {warning}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Revenue Trend</h2>
                    <p className="text-sm text-slate-500">Revenue timeline from uploaded orders.</p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Live</div>
                </div>
                <div className="h-72 min-w-0 overflow-hidden">
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

          <div className="min-w-0 space-y-6">
            <InsightCard
              title={planIsPaid ? "Advanced AI Suggestions" : "Simple Business Suggestions"}
              suggestions={advancedSuggestions || suggestions}
              planIsPaid={planIsPaid}
              aiLoading={aiLoading}
              onGenerateAdvanced={generateAdvancedAI}
            />

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
                  <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Before/After Profit Simulator</h2>
                    <p className="text-sm text-slate-500">Preview profit impact before changing the business.</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <SimulatorInput label="Selling price change" value={simulator.priceChange} min={-30} max={50} onChange={(value) => setSimulator((current) => ({ ...current, priceChange: value }))} />
                  <SimulatorInput label="Ad spend change" value={simulator.adSpendChange} min={-100} max={100} onChange={(value) => setSimulator((current) => ({ ...current, adSpendChange: value }))} />
                  <SimulatorInput label="Shipping cost change" value={simulator.shippingChange} min={-50} max={80} onChange={(value) => setSimulator((current) => ({ ...current, shippingChange: value }))} />
                  <SimulatorInput label="Discount change" value={simulator.discountChange} min={-100} max={100} onChange={(value) => setSimulator((current) => ({ ...current, discountChange: value }))} />
                  <SimulatorInput label="Return rate change" value={simulator.returnRateChange} min={-20} max={30} onChange={(value) => setSimulator((current) => ({ ...current, returnRateChange: value }))} />
                </div>
                <div className="mt-5 grid gap-3 rounded-[24px] bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Projected profit</span>
                    <span className="font-bold text-slate-900">{formatMoney(simulatorResult.profit, settings)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Projected margin</span>
                    <span className="font-bold text-slate-900">{formatPercent(simulatorResult.margin)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-500">Profit change</span>
                    <span className={`font-bold ${simulatorResult.profitDelta >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {simulatorResult.profitDelta >= 0 ? "+" : ""}{formatMoney(simulatorResult.profitDelta, settings)}
                    </span>
                  </div>
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
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-2xl bg-violet-100 p-2 text-violet-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Report Comparison</p>
                  <h2 className="text-xl font-bold text-slate-900">Current vs Last Saved Report</h2>
                  {reportComparison?.reportTitle && (
                    <p className="mt-1 text-sm text-slate-500">Comparing against: {reportComparison.reportTitle}</p>
                  )}
                </div>
              </div>
              {reportComparison ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <ComparisonTile label="Revenue change" value={formatMoney(reportComparison.revenueDelta, settings)} positive={reportComparison.revenueDelta >= 0} />
                  <ComparisonTile label="Profit change" value={formatMoney(reportComparison.profitDelta, settings)} positive={reportComparison.profitDelta >= 0} />
                  <ComparisonTile label="Margin change" value={`${reportComparison.marginDelta >= 0 ? "+" : ""}${formatPercent(reportComparison.marginDelta)}`} positive={reportComparison.marginDelta >= 0} />
                  <ComparisonTile label="New loss-making products" value={reportComparison.newLossMakers} positive={reportComparison.newLossMakers === 0} />
                </div>
              ) : (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                  Save a report first, then compare future uploads against it.
                </div>
              )}
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
                <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {reports.map((report) => (
                    <div
                      key={report.id || report.title}
                      className={`rounded-3xl border p-4 transition ${
                        currentReportId === (report.id || report.title)
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">{report.title}</h3>
                          <p className="mt-1 text-sm text-slate-500">
                            {report.createdAt ? new Date(report.createdAt).toLocaleString() : "Saved locally"}
                          </p>
                          {currentReportId === (report.id || report.title) && (
                            <p className="mt-2 text-xs font-semibold text-emerald-700">Currently open</p>
                          )}
                        </div>
                        <div className="rounded-2xl bg-white p-2 text-slate-500">
                          <FileText className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openSavedReport(report)}
                          disabled={openingReportId === (report.id || report.title)}
                          className="flex-1 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {openingReportId === (report.id || report.title) ? "Opening..." : "Open"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedReport(report)}
                          disabled={deletingReportId === (report.id || report.title)}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          {deletingReportId === (report.id || report.title) ? "Deleting..." : "Delete"}
                        </button>
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

function InsightCard({ title, suggestions, planIsPaid, aiLoading, onGenerateAdvanced }) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex gap-2">
            <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-500">
                {planIsPaid ? "Advanced AI can generate deeper actions for this report." : "Free plan shows simple rule-based suggestions."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGenerateAdvanced}
            disabled={aiLoading}
            className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
              planIsPaid
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {aiLoading ? "Generating..." : planIsPaid ? "Generate AI" : "Upgrade for AI"}
          </button>
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
}
