"use client";

import React, { useMemo, useState } from "react";
import { Upload, TrendingUp, TrendingDown, AlertTriangle, Sparkles, Package, IndianRupee, BarChart3, FileText, Download, RefreshCcw, Settings as SettingsIcon, Search, CheckCircle2, XCircle, Target, Percent, Truck, ReceiptIndianRupee, Save, Brain } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { analyzeProfit, defaultSettings, normalizeSku, type Settings } from "@/lib/profit";
import { parseCSV } from "@/lib/csv";

const sampleOrders = [
  { orderId: "ORD-001", date: "2026-05-01", product: "Gold Plated Bracelet", sku: "BR-001", quantity: 2, sellingPrice: 899, discount: 100, paymentFee: 32 },
  { orderId: "ORD-002", date: "2026-05-02", product: "Pearl Necklace", sku: "NK-002", quantity: 1, sellingPrice: 1499, discount: 200, paymentFee: 45 },
  { orderId: "ORD-003", date: "2026-05-03", product: "Silver Ring", sku: "RG-003", quantity: 3, sellingPrice: 599, discount: 0, paymentFee: 28 }
];

const sampleCosts = [
  { sku: "BR-001", product: "Gold Plated Bracelet", productCost: 390, packagingCost: 35 },
  { sku: "NK-002", product: "Pearl Necklace", productCost: 850, packagingCost: 55 },
  { sku: "RG-003", product: "Silver Ring", productCost: 180, packagingCost: 25 }
];

const sampleAds = [
  { sku: "BR-001", adSpend: 900 },
  { sku: "NK-002", adSpend: 1250 },
  { sku: "RG-003", adSpend: 350 }
];

const sampleShipping = [
  { sku: "BR-001", shippingCost: 90 },
  { sku: "NK-002", shippingCost: 120 },
  { sku: "RG-003", shippingCost: 70 }
];

const sampleReturns = [
  { sku: "BR-001", returnedUnits: 0 },
  { sku: "NK-002", returnedUnits: 1 },
  { sku: "RG-003", returnedUnits: 0 }
];

function formatMoney(value: number, settings: Settings = defaultSettings) {
  return new Intl.NumberFormat(settings.locale, {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function getHealthStatus(product: any, settings: Settings) {
  if (product.realProfit < 0) return { label: "Losing Money", tone: "bg-red-100 text-red-700" };
  if (product.margin < settings.targetMargin) return { label: "Low Margin", tone: "bg-yellow-100 text-yellow-800" };
  if (product.returnRate >= settings.highReturnThreshold) return { label: "Return Risk", tone: "bg-orange-100 text-orange-800" };
  return { label: "Healthy", tone: "bg-green-100 text-green-700" };
}

function FileUploader({ title, helper, requiredColumns, onUpload, rowsCount }: any) {
  const [error, setError] = useState("");

  return (
    <Card className="border-dashed">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-gray-100 p-2"><Upload className="h-5 w-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{title}</h3>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] text-gray-600">{rowsCount} rows</span>
            </div>
            <p className="mt-1 break-words text-xs text-gray-500">{helper}</p>
            <input
              type="file"
              accept=".csv"
              className="mt-3 text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    const parsed = parseCSV(String(reader.result));
                    const availableColumns = Object.keys(parsed[0] || {});
                    const missing = requiredColumns.filter((column: string) => !availableColumns.includes(column));
                    if (!parsed.length) throw new Error("CSV file is empty.");
                    if (missing.length) throw new Error(`Missing columns: ${missing.join(", ")}`);
                    setError("");
                    onUpload(parsed);
                  } catch (err: any) {
                    setError(err.message || "Could not read CSV file.");
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

export function DashboardClient({ initialReports, userPlan }: { initialReports: any[]; userPlan: string }) {
  const [orders, setOrders] = useState<any[]>(sampleOrders);
  const [costs, setCosts] = useState<any[]>(sampleCosts);
  const [ads, setAds] = useState<any[]>(sampleAds);
  const [shipping, setShipping] = useState<any[]>(sampleShipping);
  const [returns, setReturns] = useState<any[]>(sampleReturns);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("realProfit");
  const [reports, setReports] = useState<any[]>(initialReports || []);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const isFreePlan = userPlan === "FREE";
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const analysis = useMemo(() => {
    return analyzeProfit({ orders, costs, ads, shipping, returns, settings });
  }, [orders, costs, ads, shipping, returns, settings]);

  const visibleProducts = useMemo(() => {
    return [...analysis.products]
      .filter((p: any) => `${p.product} ${p.sku}`.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a: any, b: any) => Number(b[sortBy] || 0) - Number(a[sortBy] || 0));
  }, [analysis.products, searchTerm, sortBy]);

  const daily = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    orders.forEach((order: any) => {
      const date = order.date || "Unknown";
      dailyMap[date] = (dailyMap[date] || 0) + Number(order.sellingPrice || 0) * Number(order.quantity || 1);
    });
    return Object.entries(dailyMap).map(([date, revenue]) => ({ date, revenue }));
  }, [orders]);

  async function saveReport() {
    setSaving(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Profit Report ${new Date().toLocaleDateString()}`, orders, costs, ads, shipping, returns, settings, analysis })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save report");
      setReports((current) => [data.report, ...current]);
    } finally {
      setSaving(false);
    }
  }

  async function generateAI() {
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis })
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions || data.result?.suggestions || []);
    } finally {
      setAiLoading(false);
    }
  }

  async function startStripeCheckout(priceId?: string) {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: priceId || process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER })
    });
    const data = await response.json();
    if (data.url) window.location.href = data.url;
  }

  async function exportCsvReport() {
    if (isFreePlan) {
      alert("Export is available only on paid plans.");
      return;
    }

    const rows = analysis.products.map((p: any) => ({
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

    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows })
    });

    if (!response.ok) {
      const data = await response.json();
      alert(data.error || "Export failed");
      return;
    }

    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((row: any) => headers.map((header) => String(row[header] ?? "")).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "profitlens_analysis_report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-sm">
            <Sparkles className="h-4 w-4" /> Production SaaS Dashboard
          </p>
          <h1 className="text-4xl font-bold tracking-tight">E-commerce Profit Lens</h1>
          <p className="mt-2 max-w-2xl text-gray-600">Upload CSV files, analyze profit, save report history, and generate AI suggestions. Free users get simple English AI. Paid users get advanced English + Hinglish AI.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => startStripeCheckout()}>Upgrade</Button>
          <Button variant="outline" onClick={generateAI} disabled={aiLoading}>
            <Brain className="mr-2 h-4 w-4" /> {aiLoading ? "Generating..." : "Generate AI"}
          </Button>
          <Button variant="outline" onClick={exportCsvReport} disabled={isFreePlan} title={isFreePlan ? "Export is available on paid plans" : "Export CSV"}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={saveReport} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <h2 className="flex items-center gap-2 text-lg font-bold"><SettingsIcon className="h-5 w-5" /> Business Settings</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <NumberInput label="Target Margin %" value={settings.targetMargin} onChange={(value: number) => setSettings((s) => ({ ...s, targetMargin: value }))} icon={<Target />} />
            <NumberInput label="High Return Alert %" value={settings.highReturnThreshold} onChange={(value: number) => setSettings((s) => ({ ...s, highReturnThreshold: value }))} icon={<Percent />} />
            <NumberInput label="Default Shipping Cost" value={settings.defaultShippingCost} onChange={(value: number) => setSettings((s) => ({ ...s, defaultShippingCost: value }))} icon={<Truck />} />
            <NumberInput label="Default Payment Fee %" value={settings.defaultPaymentFeePercent} onChange={(value: number) => setSettings((s) => ({ ...s, defaultPaymentFeePercent: value }))} icon={<ReceiptIndianRupee />} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-5">
        <FileUploader title="Orders CSV" helper="orderId,date,product,sku,quantity,sellingPrice,discount,paymentFee" requiredColumns={["sku", "quantity", "sellingPrice"]} rowsCount={orders.length} onUpload={setOrders} />
        <FileUploader title="Product Cost CSV" helper="sku,product,productCost,packagingCost" requiredColumns={["sku", "productCost"]} rowsCount={costs.length} onUpload={setCosts} />
        <FileUploader title="Ad Spend CSV" helper="sku,adSpend" requiredColumns={["sku", "adSpend"]} rowsCount={ads.length} onUpload={setAds} />
        <FileUploader title="Shipping CSV" helper="sku,shippingCost" requiredColumns={["sku", "shippingCost"]} rowsCount={shipping.length} onUpload={setShipping} />
        <FileUploader title="Returns CSV" helper="sku,returnedUnits" requiredColumns={["sku", "returnedUnits"]} rowsCount={returns.length} onUpload={setReturns} />
      </div>

      {analysis.warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent>
            <h2 className="flex items-center gap-2 font-bold"><AlertTriangle className="h-5 w-5" /> Data Warnings</h2>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {analysis.warnings.map((warning: string, index: number) => <p key={index} className="text-sm text-yellow-900">• {warning}</p>)}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard icon={<IndianRupee />} label="Total Revenue" value={formatMoney(analysis.totals.revenue, settings)} />
        <MetricCard icon={<TrendingUp />} label="Real Profit" value={formatMoney(analysis.totals.realProfit, settings)} positive={analysis.totals.realProfit >= 0} />
        <MetricCard icon={<Percent />} label="Net Margin" value={formatPercent(analysis.totals.margin)} positive={analysis.totals.margin >= settings.targetMargin} />
        <MetricCard icon={<Package />} label="Units Sold" value={analysis.totals.unitsSold} />
        <MetricCard icon={<AlertTriangle />} label="Return Rate" value={formatPercent(analysis.totals.returnRate)} warning={analysis.totals.returnRate >= settings.highReturnThreshold} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><BarChart3 className="h-5 w-5" /> Revenue Trend</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={daily}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value), settings)} />
                  <Line type="monotone" dataKey="revenue" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><TrendingUp className="h-5 w-5" /> Product Profit</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.products}>
                  <XAxis dataKey="product" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => formatMoney(Number(value), settings)} />
                  <Bar dataKey="realProfit" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold">Product Profitability</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search product" className="w-40 rounded-xl border py-2 pl-9 pr-3 text-sm" />
                </div>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-xl border bg-white px-3 py-2 text-sm">
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

        <Card>
          <CardContent>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5" /> AI Suggestions</h2>
            {aiSuggestions.length ? (
              <div className="space-y-3">
                {aiSuggestions.map((item: any, index: number) => (
                  <div key={index} className="rounded-2xl bg-gray-100 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">{item.type} • {item.priority}</p>
                    <h3 className="mt-1 font-bold">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{item.problem}</p>
                    <p className="mt-2 flex gap-2 text-sm font-medium"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {item.action}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Click “Generate AI” to get suggestions. Free plan uses simple English AI. Paid plans use advanced English + Hinglish AI.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <h2 className="text-lg font-bold">Saved Report History</h2>
          {reports.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No saved reports yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {reports.map((report) => (
                <div key={report.id} className="rounded-2xl bg-gray-100 p-4">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-gray-600">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NumberInput({ label, value, onChange, icon }: any) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-600">{React.cloneElement(icon, { className: "h-3 w-3" })} {label}</span>
      <input type="number" value={value} min="0" className="w-full rounded-xl border bg-white px-3 py-2 text-sm" onChange={(e) => onChange(Number(e.target.value || 0))} />
    </label>
  );
}

function MetricCard({ icon, label, value, positive, warning }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-gray-100 p-2">{React.cloneElement(icon, { className: "h-5 w-5" })}</div>
          {positive !== undefined && (positive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />)}
          {warning && <AlertTriangle className="h-5 w-5" />}
        </div>
        <p className="mt-5 text-sm text-gray-500">{label}</p>
        <h3 className="mt-1 text-2xl font-bold">{value}</h3>
      </CardContent>
    </Card>
  );
}

function TableCard({ products, settings }: any) {
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
          {products.map((p: any) => {
            const status = getHealthStatus(p, settings);
            return (
              <tr key={p.sku} className="border-b last:border-none">
                <td className="py-3 font-medium">
                  <div>{p.product}</div>
                  <div className="text-xs text-gray-500">{p.sku}</div>
                </td>
                <td>{formatMoney(p.revenue, settings)}</td>
                <td className={p.realProfit < 0 ? "font-semibold text-red-700" : "font-semibold"}>{formatMoney(p.realProfit, settings)}</td>
                <td>{formatPercent(p.margin)}</td>
                <td>{formatPercent(p.returnRate)}</td>
                <td><span className={`rounded-full px-2 py-1 text-xs ${status.tone}`}>{status.label}</span></td>
                <td>{formatMoney(p.suggestedPrice, settings)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
