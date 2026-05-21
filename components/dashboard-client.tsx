"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Download,
  IndianRupee,
  Package,
  Percent,
  ReceiptIndianRupee,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  analyzeProfit,
  defaultSettings,
  type Settings as ProfitSettings,
} from "@/lib/profit";
import { parseCSV } from "@/lib/csv";

const sampleOrders = [
  {
    orderId: "ORD-001",
    date: "2026-05-01",
    product: "Gold Plated Bracelet",
    sku: "BR-001",
    quantity: 2,
    sellingPrice: 899,
    discount: 100,
    paymentFee: 32,
  },
  {
    orderId: "ORD-002",
    date: "2026-05-02",
    product: "Pearl Necklace",
    sku: "NK-002",
    quantity: 1,
    sellingPrice: 1499,
    discount: 200,
    paymentFee: 45,
  },
  {
    orderId: "ORD-003",
    date: "2026-05-03",
    product: "Silver Ring",
    sku: "RG-003",
    quantity: 3,
    sellingPrice: 599,
    discount: 0,
    paymentFee: 28,
  },
];

const sampleCosts = [
  {
    sku: "BR-001",
    product: "Gold Plated Bracelet",
    productCost: 390,
    packagingCost: 35,
  },
  {
    sku: "NK-002",
    product: "Pearl Necklace",
    productCost: 850,
    packagingCost: 55,
  },
  {
    sku: "RG-003",
    product: "Silver Ring",
    productCost: 180,
    packagingCost: 25,
  },
];

const sampleAds = [
  { sku: "BR-001", adSpend: 900 },
  { sku: "NK-002", adSpend: 1250 },
  { sku: "RG-003", adSpend: 350 },
];

const sampleShipping = [
  { sku: "BR-001", shippingCost: 90 },
  { sku: "NK-002", shippingCost: 120 },
  { sku: "RG-003", shippingCost: 70 },
];

const sampleReturns = [
  { sku: "BR-001", returnedUnits: 0 },
  { sku: "NK-002", returnedUnits: 1 },
  { sku: "RG-003", returnedUnits: 0 },
];

type DashboardClientProps = {
  initialReports: any[];
  userPlan: string;
};

function formatMoney(value: number, settings: ProfitSettings = defaultSettings) {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getHealthStatus(product: any, settings: ProfitSettings) {
  if (product.realProfit < 0) {
    return {
      label: "Losing Money",
      tone: "bg-red-100 text-red-700",
    };
  }

  if (product.margin < settings.targetMargin) {
    return {
      label: "Low Margin",
      tone: "bg-yellow-100 text-yellow-800",
    };
  }

  if (product.returnRate >= settings.highReturnThreshold) {
    return {
      label: "Return Risk",
      tone: "bg-orange-100 text-orange-800",
    };
  }

  return {
    label: "Healthy",
    tone: "bg-emerald-100 text-emerald-700",
  };
}

function toCSV(rows: any[]) {
  if (!rows.length) return "";

  const headers = Object.keys(rows[0]);

  const escape = (value: unknown) => {
    const stringValue = String(value ?? "");
    return /[",\n\r]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  };

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(",")),
  ].join("\n");
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}

export function DashboardClient({
  initialReports,
  userPlan,
}: DashboardClientProps) {
  const [orders, setOrders] = useState<any[]>(sampleOrders);
  const [costs, setCosts] = useState<any[]>(sampleCosts);
  const [ads, setAds] = useState<any[]>(sampleAds);
  const [shipping, setShipping] = useState<any[]>(sampleShipping);
  const [returns, setReturns] = useState<any[]>(sampleReturns);

  const [settings, setSettings] = useState<ProfitSettings>(defaultSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("realProfit");

  const [reports, setReports] = useState<any[]>(initialReports || []);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const isFreePlan = userPlan === "FREE";

  const analysis = useMemo(() => {
    return analyzeProfit({
      orders,
      costs,
      ads,
      shipping,
      returns,
      settings,
    });
  }, [orders, costs, ads, shipping, returns, settings]);

  const visibleProducts = useMemo(() => {
    return [...analysis.products]
      .filter((product: any) =>
        `${product.product} ${product.sku}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0));
  }, [analysis.products, searchTerm, sortBy]);

  const daily = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    orders.forEach((order: any) => {
      const date = order.date || "Unknown";
      dailyMap[date] =
        (dailyMap[date] || 0) +
        Number(order.sellingPrice || 0) * Number(order.quantity || 1);
    });

    return Object.entries(dailyMap).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }, [orders]);

  async function saveReport() {
    setSaving(true);

    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Profit Report ${new Date().toLocaleDateString()}`,
          orders,
          costs,
          ads,
          shipping,
          returns,
          settings,
          analysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save report");
      }

      setReports((current) => [data.report, ...current]);
      alert("Report saved successfully.");
    } catch (error: any) {
      alert(error.message || "Could not save report.");
    } finally {
      setSaving(false);
    }
  }

  async function generateAI() {
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI generation failed");
      }

      setAiSuggestions(data.suggestions || data.result?.suggestions || []);
    } catch (error: any) {
      alert(error.message || "Could not generate AI suggestions.");
    } finally {
      setAiLoading(false);
    }
  }

  async function exportCsvReport() {
    if (isFreePlan) {
      alert("Export is available only on paid plans.");
      return;
    }

    const rows = analysis.products.map((product: any) => ({
      sku: product.sku,
      product: product.product,
      revenue: Math.round(product.revenue),
      totalCost: Math.round(product.totalCost),
      realProfit: Math.round(product.realProfit),
      marginPercent: product.margin.toFixed(2),
      unitsSold: product.unitsSold,
      returnedUnits: product.returnedUnits,
      returnRatePercent: product.returnRate.toFixed(2),
      breakEvenPrice: Math.round(product.breakEvenPrice),
      suggestedPrice: Math.round(product.suggestedPrice),
      status: getHealthStatus(product, settings).label,
    }));

    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Export failed");
      return;
    }

    downloadFile("profitlens_analysis_report.csv", toCSV(rows));
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-[#070A12] p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <Sparkles className="h-4 w-4" />
              ProfitLens Audit Dashboard
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
              Store Profit Analysis
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300 md:text-base">
              Upload your store data to find real profit, weak products,
              high-return products, and AI-powered actions to improve margins.
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-300">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Plan: {userPlan}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Products: {analysis.products.length}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Reports saved: {reports.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={exportCsvReport}
              disabled={isFreePlan}
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              title={isFreePlan ? "Export is available on paid plans" : "Export CSV"}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>

            <Button
              variant="outline"
              onClick={generateAI}
              disabled={aiLoading}
              className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Brain className="mr-2 h-4 w-4" />
              {aiLoading ? "Generating..." : "Generate AI"}
            </Button>

            <Button
              onClick={saveReport}
              disabled={saving}
              className="rounded-full bg-emerald-400 text-black hover:bg-emerald-300"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Report"}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard
          icon={<IndianRupee />}
          label="Total Revenue"
          value={formatMoney(analysis.totals.revenue, settings)}
        />
        <MetricCard
          icon={<TrendingUp />}
          label="Real Profit"
          value={formatMoney(analysis.totals.realProfit, settings)}
          positive={analysis.totals.realProfit >= 0}
        />
        <MetricCard
          icon={<Percent />}
          label="Net Margin"
          value={formatPercent(analysis.totals.margin)}
          positive={analysis.totals.margin >= settings.targetMargin}
        />
        <MetricCard
          icon={<Package />}
          label="Units Sold"
          value={analysis.totals.unitsSold}
        />
        <MetricCard
          icon={<AlertTriangle />}
          label="Return Rate"
          value={formatPercent(analysis.totals.returnRate)}
          warning={analysis.totals.returnRate >= settings.highReturnThreshold}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <SettingsIcon className="h-5 w-5" />
              Business Settings
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <NumberInput
                label="Target Margin %"
                value={settings.targetMargin}
                onChange={(value: number) =>
                  setSettings((current) => ({
                    ...current,
                    targetMargin: value,
                  }))
                }
                icon={<Target />}
              />

              <NumberInput
                label="High Return Alert %"
                value={settings.highReturnThreshold}
                onChange={(value: number) =>
                  setSettings((current) => ({
                    ...current,
                    highReturnThreshold: value,
                  }))
                }
                icon={<Percent />}
              />

              <NumberInput
                label="Default Shipping Cost"
                value={settings.defaultShippingCost}
                onChange={(value: number) =>
                  setSettings((current) => ({
                    ...current,
                    defaultShippingCost: value,
                  }))
                }
                icon={<Truck />}
              />

              <NumberInput
                label="Default Payment Fee %"
                value={settings.defaultPaymentFeePercent}
                onChange={(value: number) =>
                  setSettings((current) => ({
                    ...current,
                    defaultPaymentFeePercent: value,
                  }))
                }
                icon={<ReceiptIndianRupee />}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles className="h-5 w-5" />
              Audit Summary
            </h2>

            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Loss-making products"
                value={analysis.lossMaking.length}
                danger={analysis.lossMaking.length > 0}
              />
              <SummaryRow
                label="Low-margin products"
                value={analysis.lowMargin.length}
                danger={analysis.lowMargin.length > 0}
              />
              <SummaryRow
                label="High-return products"
                value={analysis.highReturn.length}
                danger={analysis.highReturn.length > 0}
              />
              <SummaryRow
                label="Products to promote"
                value={analysis.promote.length}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Upload Store Data</h2>
            <p className="text-sm text-gray-500">
              Upload all five CSV files for the most accurate profit audit.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <FileUploader
            title="Orders CSV"
            helper="orderId,date,product,sku,quantity,sellingPrice,discount,paymentFee"
            requiredColumns={["sku", "quantity", "sellingPrice"]}
            rowsCount={orders.length}
            onUpload={setOrders}
          />
          <FileUploader
            title="Product Cost CSV"
            helper="sku,product,productCost,packagingCost"
            requiredColumns={["sku", "productCost"]}
            rowsCount={costs.length}
            onUpload={setCosts}
          />
          <FileUploader
            title="Ad Spend CSV"
            helper="sku,adSpend"
            requiredColumns={["sku", "adSpend"]}
            rowsCount={ads.length}
            onUpload={setAds}
          />
          <FileUploader
            title="Shipping CSV"
            helper="sku,shippingCost"
            requiredColumns={["sku", "shippingCost"]}
            rowsCount={shipping.length}
            onUpload={setShipping}
          />
          <FileUploader
            title="Returns CSV"
            helper="sku,returnedUnits"
            requiredColumns={["sku", "returnedUnits"]}
            rowsCount={returns.length}
            onUpload={setReturns}
          />
        </div>
      </section>

      {analysis.warnings.length > 0 && (
        <Card className="rounded-[1.5rem] border-yellow-200 bg-yellow-50 shadow-sm">
          <CardContent className="p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-5 w-5" />
              Data Warnings
            </h2>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {analysis.warnings.map((warning: string, index: number) => (
                <p key={index} className="text-sm text-yellow-900">
                  • {warning}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <BarChart3 className="h-5 w-5" />
              Revenue Trend
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), settings)}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
              <TrendingUp className="h-5 w-5" />
              Product Profit
            </h2>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.products}>
                  <XAxis
                    dataKey="product"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(Number(value), settings)}
                  />
                  <Bar dataKey="realProfit" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold">Product Profitability</h2>
                <p className="text-sm text-gray-500">
                  Product-level revenue, profit, margin, return risk, and price
                  suggestion.
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search product"
                    className="w-44 rounded-xl border py-2 pl-9 pr-3 text-sm"
                  />
                </div>

                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="realProfit">Profit</option>
                  <option value="revenue">Revenue</option>
                  <option value="margin">Margin</option>
                  <option value="returnRate">Return Rate</option>
                </select>
              </div>
            </div>

            <TableCard products={visibleProducts} settings={settings} />
          </CardContent>
        </Card>

        <InsightCard
          title="AI Action Plan"
          suggestions={aiSuggestions}
          fallbackText="Click Generate AI to create a deeper action plan from Gemini."
        />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <SmallList
          title="Loss-making Products"
          items={analysis.lossMaking}
          empty="No loss-making products found."
          kind="loss"
          settings={settings}
        />
        <SmallList
          title="High-return Products"
          items={analysis.highReturn}
          empty="No high-return products found."
          kind="return"
          settings={settings}
        />
        <SmallList
          title="Best Products to Promote"
          items={analysis.promote}
          empty="No strong promotion candidate yet."
          kind="promote"
          settings={settings}
        />
      </section>

      <section>
        <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <h2 className="text-lg font-bold">Saved Report History</h2>

            {reports.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                No saved reports yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-2xl border bg-gray-50 p-4"
                  >
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FileUploader({
  title,
  helper,
  requiredColumns,
  onUpload,
  rowsCount,
}: {
  title: string;
  helper: string;
  requiredColumns: string[];
  onUpload: (rows: any[]) => void;
  rowsCount: number;
}) {
  const [error, setError] = useState("");

  return (
    <Card className="rounded-[1.5rem] border border-dashed border-gray-300 bg-white shadow-sm transition hover:border-emerald-400 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
            <Upload className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">
                {rowsCount} rows
              </span>
            </div>

            <p className="mt-1 break-words text-xs text-gray-500">{helper}</p>

            <input
              type="file"
              accept=".csv"
              className="mt-3 text-xs"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                const reader = new FileReader();

                reader.onload = () => {
                  try {
                    const parsed = parseCSV(String(reader.result));
                    const availableColumns = Object.keys(parsed[0] || {});
                    const missing = requiredColumns.filter(
                      (column) => !availableColumns.includes(column)
                    );

                    if (!parsed.length) {
                      throw new Error("CSV file is empty.");
                    }

                    if (missing.length) {
                      throw new Error(`Missing columns: ${missing.join(", ")}`);
                    }

                    setError("");
                    onUpload(parsed);
                  } catch (error: any) {
                    setError(error.message || "Could not read CSV file.");
                  }
                };

                reader.readAsText(file);
              }}
            />

            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon: React.ReactElement;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">
        <span className="w-3 h-3">{icon}</span>
        {label}
      </span>

      <input
        type="number"
        value={value}
        min="0"
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </label>
  );
}

function MetricCard({
  icon,
  label,
  value,
  positive,
  warning,
}: {
  icon: React.ReactElement;
  label: string;
  value: string | number;
  positive?: boolean;
  warning?: boolean;
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-2xl bg-gray-100 p-3">
            <span className="w-5 h-5">{icon}</span>
          </div>

          {positive !== undefined &&
            (positive ? (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                Good
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                Check
              </span>
            ))}

          {warning && (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
              Alert
            </span>
          )}
        </div>

        <p className="mt-5 text-sm font-medium text-gray-500">{label}</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
          {value}
        </h3>
      </CardContent>
    </Card>
  );
}

function SummaryRow({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-3">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`rounded-full px-2 py-1 text-xs font-bold ${
          danger ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function TableCard({
  products,
  settings,
}: {
  products: any[];
  settings: ProfitSettings;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-3">Product</th>
            <th>Revenue</th>
            <th>Profit</th>
            <th>Margin</th>
            <th>Return</th>
            <th>Status</th>
            <th>Suggested Price</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product: any) => {
            const status = getHealthStatus(product, settings);

            return (
              <tr key={product.sku} className="border-b last:border-none">
                <td className="py-3 font-medium">
                  <div>{product.product}</div>
                  <div className="text-xs text-gray-500">{product.sku}</div>
                </td>

                <td>{formatMoney(product.revenue, settings)}</td>

                <td
                  className={
                    product.realProfit < 0
                      ? "font-semibold text-red-700"
                      : "font-semibold"
                  }
                >
                  {formatMoney(product.realProfit, settings)}
                </td>

                <td>{formatPercent(product.margin)}</td>
                <td>{formatPercent(product.returnRate)}</td>

                <td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${status.tone}`}
                  >
                    {status.label}
                  </span>
                </td>

                <td>{formatMoney(product.suggestedPrice, settings)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InsightCard({
  title,
  suggestions,
  fallbackText,
}: {
  title: string;
  suggestions: any[];
  fallbackText: string;
}) {
  return (
    <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5" />
          {title}
        </h2>

        {suggestions.length === 0 ? (
          <p className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
            {fallbackText}
          </p>
        ) : (
          <div className="max-h-[32rem] space-y-3 overflow-auto pr-1">
            {suggestions.map((item: any, index: number) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {item.type}
                  </p>

                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      item.priority === "High"
                        ? "bg-red-100 text-red-700"
                        : item.priority === "Medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {item.priority || "Low"}
                  </span>
                </div>

                <h3 className="mt-1 font-bold">{item.title}</h3>

                <p className="mt-1 text-sm text-gray-600">
                  {item.problem || item.text}
                </p>

                <p className="mt-2 flex gap-2 text-sm font-medium">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  {item.action}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SmallList({
  title,
  items,
  empty,
  kind,
  settings,
}: {
  title: string;
  items: any[];
  empty: string;
  kind: "loss" | "return" | "promote";
  settings: ProfitSettings;
}) {
  return (
    <Card className="rounded-[1.5rem] border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <h2 className="mb-4 text-lg font-bold">{title}</h2>

        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle2 className="h-4 w-4" />
            {empty}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((product: any) => (
              <div key={product.sku} className="rounded-2xl bg-gray-50 p-4">
                <h3 className="flex items-center gap-2 font-semibold">
                  {kind === "loss" ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  {product.product}
                </h3>

                {kind === "loss" && (
                  <p className="mt-1 text-sm text-gray-600">
                    Profit: {formatMoney(product.realProfit, settings)}
                  </p>
                )}

                {kind === "return" && (
                  <p className="mt-1 text-sm text-gray-600">
                    Return rate: {formatPercent(product.returnRate)}
                  </p>
                )}

                {kind === "promote" && (
                  <p className="mt-1 text-sm text-gray-600">
                    Margin: {formatPercent(product.margin)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}