"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  IndianRupee,
  Package,
  Percent,
  ReceiptIndianRupee,
  RefreshCcw,
  Save,
  Search,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Upload,
  UserRound,
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
  {
    orderId: "ORD-004",
    date: "2026-05-04",
    product: "Crystal Earrings",
    sku: "ER-004",
    quantity: 2,
    sellingPrice: 499,
    discount: 50,
    paymentFee: 18,
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
  {
    sku: "ER-004",
    product: "Crystal Earrings",
    productCost: 220,
    packagingCost: 22,
  },
];

const sampleAds = [
  { sku: "BR-001", adSpend: 900 },
  { sku: "NK-002", adSpend: 1250 },
  { sku: "RG-003", adSpend: 350 },
  { sku: "ER-004", adSpend: 450 },
];

const sampleShipping = [
  { sku: "BR-001", shippingCost: 90 },
  { sku: "NK-002", shippingCost: 120 },
  { sku: "RG-003", shippingCost: 70 },
  { sku: "ER-004", shippingCost: 75 },
];

const sampleReturns = [
  { sku: "BR-001", returnedUnits: 0 },
  { sku: "NK-002", returnedUnits: 1 },
  { sku: "RG-003", returnedUnits: 0 },
  { sku: "ER-004", returnedUnits: 1 },
];

type DashboardClientProps = {
  initialReports: any[];
  userPlan: string;
};

function formatMoney(value: number, settings: ProfitSettings = defaultSettings) {
  const locale = settings?.locale || "en-IN";
  const currency = settings?.currency || "INR";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
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

  const chartProducts = useMemo(() => {
    return [...analysis.products]
      .sort((a: any, b: any) => b.realProfit - a.realProfit)
      .slice(0, 6);
  }, [analysis.products]);

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
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col justify-between">
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <BarChart3 className="h-8 w-8" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                    ProfitLens Dashboard
                  </h1>
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Live profit audit workspace for e-commerce data
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Pill text={`Plan: ${userPlan}`} />
                  <Pill text={`${analysis.products.length} products`} />
                  <Pill text={`${reports.length} saved reports`} />
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={generateAI}
                disabled={aiLoading}
                className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Brain className="mr-2 h-4 w-4" />
                {aiLoading ? "Generating..." : "Generate AI"}
              </Button>

              <Button
                variant="outline"
                onClick={exportCsvReport}
                disabled={isFreePlan}
                className="rounded-2xl border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>

              <Button
                onClick={saveReport}
                disabled={saving}
                className="rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Report"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoMiniCard
              title="Workspace Status"
              value="Active"
              subValue="Analysis ready"
              icon={<Activity className="h-5 w-5" />}
              accent="emerald"
            />
            <InfoMiniCard
              title="Period"
              value="Last 30 Days"
              subValue="Tracking enabled"
              icon={<CalendarDays className="h-5 w-5" />}
              accent="sky"
            />
            <InfoMiniCard
              title="Owner"
              value="You"
              subValue="Audit workspace"
              icon={<UserRound className="h-5 w-5" />}
              accent="violet"
            />
            <InfoMiniCard
              title="Reports"
              value={String(reports.length)}
              subValue="Saved in history"
              icon={<FileText className="h-5 w-5" />}
              accent="amber"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <MetricCard
          title="Total Revenue"
          value={formatMoney(analysis.totals.revenue, settings)}
          subtitle="Gross revenue from uploaded orders"
          icon={<IndianRupee className="h-5 w-5" />}
          status="neutral"
        />
        <MetricCard
          title="Real Profit"
          value={formatMoney(analysis.totals.realProfit, settings)}
          subtitle="Revenue after all tracked costs"
          icon={<TrendingUp className="h-5 w-5" />}
          status={analysis.totals.realProfit >= 0 ? "good" : "bad"}
        />
        <MetricCard
          title="Net Margin"
          value={formatPercent(analysis.totals.margin)}
          subtitle={`Target margin ${settings.targetMargin}%`}
          icon={<Percent className="h-5 w-5" />}
          status={
            analysis.totals.margin >= settings.targetMargin ? "good" : "warn"
          }
        />
        <MetricCard
          title="Units Sold"
          value={String(analysis.totals.unitsSold)}
          subtitle="Total items sold"
          icon={<Package className="h-5 w-5" />}
          status="neutral"
        />
        <MetricCard
          title="Return Rate"
          value={formatPercent(analysis.totals.returnRate)}
          subtitle={`Alert above ${settings.highReturnThreshold}%`}
          icon={<AlertTriangle className="h-5 w-5" />}
          status={
            analysis.totals.returnRate >= settings.highReturnThreshold
              ? "bad"
              : "good"
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Upload Store Data
                  </h2>
                  <p className="text-sm text-slate-500">
                    Upload all 5 CSV files for a complete profit audit
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                  CSV only
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Revenue Trend
                  </h2>
                  <p className="text-sm text-slate-500">
                    Revenue timeline from uploaded orders
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">
                  Last 30 days
                </div>
              </div>

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
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Product Profitability
                  </h2>
                  <p className="text-sm text-slate-500">
                    Revenue, profit, margin, returns, and suggested pricing
                  </p>
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

              <ProductTable products={visibleProducts} settings={settings} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    AI Action Plan
                  </h2>
                  <p className="text-sm text-slate-500">
                    Gemini-generated suggestions
                  </p>
                </div>
              </div>

              {aiSuggestions.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                  Click <strong>Generate AI</strong> to get a smarter action plan
                  based on profitability, margin, returns, and product performance.
                </div>
              ) : (
                <div className="max-h-[460px] space-y-3 overflow-auto pr-1">
                  {aiSuggestions.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {item.type || "Insight"}
                        </span>

                        <PriorityBadge priority={item.priority || "Low"} />
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {item.problem || item.text}
                      </p>

                      <div className="mt-3 rounded-2xl bg-white px-3 py-2 text-sm font-medium text-slate-700">
                        ✅ {item.action}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Business Settings
                  </h2>
                  <p className="text-sm text-slate-500">
                    Adjust your audit assumptions
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <NumberInput
                  label="Target Margin %"
                  value={settings.targetMargin}
                  onChange={(value: number) =>
                    setSettings((current) => ({
                      ...current,
                      targetMargin: value,
                    }))
                  }
                  icon={<Target className="h-4 w-4" />}
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
                  icon={<Percent className="h-4 w-4" />}
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
                  icon={<Truck className="h-4 w-4" />}
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
                  icon={<ReceiptIndianRupee className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Risk Snapshot
                  </h2>
                  <p className="text-sm text-slate-500">
                    Current audit watchlist
                  </p>
                </div>
                <RefreshCcw className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-3">
                <SnapshotRow
                  label="Loss-making products"
                  value={analysis.lossMaking.length}
                  tone="red"
                />
                <SnapshotRow
                  label="Low-margin products"
                  value={analysis.lowMargin.length}
                  tone="yellow"
                />
                <SnapshotRow
                  label="High-return products"
                  value={analysis.highReturn.length}
                  tone="orange"
                />
                <SnapshotRow
                  label="Best to promote"
                  value={analysis.promote.length}
                  tone="green"
                />
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
                  <h2 className="text-lg font-bold text-slate-900">
                    Top Product Profit
                  </h2>
                  <p className="text-sm text-slate-500">
                    Best performing products
                  </p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartProducts}>
                    <XAxis
                      dataKey="product"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                      height={65}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatMoney(Number(value), settings)}
                    />
                    <Bar dataKey="realProfit" fill="#6366f1" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {analysis.warnings.length > 0 && (
        <Card className="rounded-[28px] border-0 bg-yellow-50 shadow-sm ring-1 ring-yellow-100">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-700" />
              <h2 className="font-bold text-yellow-900">Data Warnings</h2>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {analysis.warnings.map((warning: string, index: number) => (
                <p key={index} className="text-sm text-yellow-900">
                  • {warning}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <InsightListCard
          title="Loss-making Products"
          items={analysis.lossMaking}
          emptyText="No loss-making products found."
          kind="loss"
          settings={settings}
        />
        <InsightListCard
          title="High-return Products"
          items={analysis.highReturn}
          emptyText="No high-return products found."
          kind="return"
          settings={settings}
        />
        <InsightListCard
          title="Best Products to Promote"
          items={analysis.promote}
          emptyText="No strong promotion candidate found."
          kind="promote"
          settings={settings}
        />
      </section>

      <section>
        <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                Saved Report History
              </h2>
              <p className="text-sm text-slate-500">
                Your saved ProfitLens analysis reports
              </p>
            </div>

            {reports.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
                No saved reports yet.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-3xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {report.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {new Date(report.createdAt).toLocaleString()}
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
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
      {text}
    </span>
  );
}

function InfoMiniCard({
  title,
  value,
  subValue,
  icon,
  accent,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ReactNode;
  accent: "emerald" | "sky" | "violet" | "amber";
}) {
  const accentMap = {
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="rounded-[24px] bg-slate-50 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className={`rounded-2xl p-2 ${accentMap[accent]}`}>{icon}</div>
      </div>

      <p className="text-xs font-medium text-slate-500">{title}</p>
      <h3 className="mt-1 text-lg font-bold text-slate-900">{value}</h3>
      <p className="text-sm text-slate-500">{subValue}</p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  status,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  status: "good" | "bad" | "warn" | "neutral";
}) {
  const statusMap = {
    good: "bg-emerald-100 text-emerald-700",
    bad: "bg-red-100 text-red-700",
    warn: "bg-yellow-100 text-yellow-800",
    neutral: "bg-slate-100 text-slate-700",
  };

  const statusLabel = {
    good: "Healthy",
    bad: "Risk",
    warn: "Check",
    neutral: "Live",
  };

  return (
    <Card className="rounded-[24px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusMap[status]}`}>
            {statusLabel[status]}
          </span>
        </div>

        <p className="mt-5 text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
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
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white p-3 text-emerald-700 shadow-sm">
          <Upload className="h-5 w-5" />
        </div>

        <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
          {rowsCount} rows
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{helper}</p>

      <input
        type="file"
        accept=".csv"
        className="mt-3 block w-full text-xs text-slate-600"
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
  icon: React.ReactNode;
}) {
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
        onChange={(event) => onChange(Number(event.target.value || 0))}
      />
    </label>
  );
}

function ProductTable({
  products,
  settings,
}: {
  products: any[];
  settings: ProfitSettings;
}) {
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
          {products.map((product: any) => {
            const status = getHealthStatus(product, settings);

            return (
              <tr key={product.sku} className="border-b border-slate-100 last:border-none">
                <td className="py-4">
                  <div className="font-semibold text-slate-900">{product.product}</div>
                  <div className="text-xs text-slate-500">{product.sku}</div>
                </td>

                <td className="text-slate-700">
                  {formatMoney(product.revenue, settings)}
                </td>

                <td
                  className={
                    product.realProfit < 0
                      ? "font-semibold text-red-700"
                      : "font-semibold text-slate-900"
                  }
                >
                  {formatMoney(product.realProfit, settings)}
                </td>

                <td className="text-slate-700">{formatPercent(product.margin)}</td>
                <td className="text-slate-700">{formatPercent(product.returnRate)}</td>

                <td>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${status.tone}`}>
                    {status.label}
                  </span>
                </td>

                <td className="font-medium text-slate-900">
                  {formatMoney(product.suggestedPrice, settings)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "High"
      ? "bg-red-100 text-red-700"
      : priority === "Medium"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-emerald-100 text-emerald-700";

  return (
    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${tone}`}>
      {priority}
    </span>
  );
}

function SnapshotRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "yellow" | "orange" | "green";
}) {
  const toneMap = {
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-800",
    orange: "bg-orange-100 text-orange-800",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`rounded-full px-2 py-1 text-xs font-bold ${toneMap[tone]}`}>
        {value}
      </span>
    </div>
  );
}

function InsightListCard({
  title,
  items,
  emptyText,
  kind,
  settings,
}: {
  title: string;
  items: any[];
  emptyText: string;
  kind: "loss" | "return" | "promote";
  settings: ProfitSettings;
}) {
  return (
    <Card className="rounded-[28px] border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-6">
        <div className="mb-5 flex items-center gap-2">
          <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
            {kind === "loss" ? (
              <TrendingDown className="h-5 w-5" />
            ) : kind === "return" ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">Quick product watchlist</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((product: any) => (
              <div key={product.sku} className="rounded-3xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{product.product}</h3>
                    <p className="text-xs text-slate-500">{product.sku}</p>
                  </div>

                  {kind === "loss" ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                </div>

                {kind === "loss" && (
                  <p className="mt-2 text-sm text-slate-600">
                    Profit: {formatMoney(product.realProfit, settings)}
                  </p>
                )}

                {kind === "return" && (
                  <p className="mt-2 text-sm text-slate-600">
                    Return rate: {formatPercent(product.returnRate)}
                  </p>
                )}

                {kind === "promote" && (
                  <p className="mt-2 text-sm text-slate-600">
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