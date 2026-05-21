import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  IndianRupee,
  LineChart,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { appConfig } from "@/lib/app-config";

const painPoints = [
  "Products with high sales but low real profit",
  "Ad spend that looks good on ROAS but fails on net margin",
  "Discounts silently eating your profit",
  "Returns damaging your real earnings",
  "Shipping and packaging costs reducing margins",
  "Wrong products getting promoted",
];

const auditItems = [
  "Real profit after product cost, shipping, payment fee, discounts, and ads",
  "Loss-making product detection",
  "Low-margin product alerts",
  "High-return product risk analysis",
  "Best products to promote",
  "AI-powered action plan for next steps",
];

const steps = [
  {
    title: "Upload your store data",
    text: "Use orders, product costs, ad spend, shipping, and return CSV files.",
  },
  {
    title: "ProfitLens analyzes profit leaks",
    text: "The system calculates real profit and detects weak products.",
  },
  {
    title: "Get a clear action plan",
    text: "You receive recommendations on pricing, ads, returns, and products to promote.",
  },
];

const packages = [
  {
    name: "Starter Audit",
    price: "₹999",
    desc: "For small sellers who want a quick profit check.",
    points: ["1 store data analysis", "Top problem products", "Top products to promote", "Basic action plan"],
  },
  {
    name: "Growth Audit",
    price: "₹2,999",
    desc: "For active stores running ads or discounts.",
    points: ["Detailed profit report", "Pricing suggestions", "Return-risk analysis", "Ad-spend waste review", "30-minute explanation call"],
    highlighted: true,
  },
  {
    name: "Monthly Monitoring",
    price: "₹4,999/mo",
    desc: "For brands that want regular profit tracking.",
    points: ["Weekly report", "Monthly summary", "Product-wise recommendations", "WhatsApp/email support"],
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-400 text-black">
            <BarChart3 className="h-5 w-5" />
          </span>
          ProfitLens
        </Link>

        <div className="hidden items-center gap-6 text-sm text-gray-300 md:flex">
          <a href="#how-it-works" className="hover:text-white">How it works</a>
          <a href="#services" className="hover:text-white">Services</a>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>

        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-gray-200">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <section className="relative overflow-hidden border-t border-white/10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Sparkles className="h-4 w-4" />
              AI Profit Audit for E-commerce Stores
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Find hidden profit leaks before they drain your e-commerce business.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              ProfitLens analyzes your orders, product costs, ad spend, shipping, discounts, and returns to show which products are truly profitable — and which ones are quietly losing money.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 font-semibold text-black hover:bg-emerald-300">
                    Get Free Mini Audit <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-7 py-4 font-semibold text-black hover:bg-emerald-300">
                  Open Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </SignedIn>

              <a href="#sample" className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 font-semibold text-white hover:bg-white/10">
                View Sample Results
              </a>
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-2xl font-bold text-emerald-300">5+</p>
                <p className="text-gray-400">data sources</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300">AI</p>
                <p className="text-gray-400">action plan</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-300">CSV</p>
                <p className="text-gray-400">report ready</p>
              </div>
            </div>
          </div>

          <div id="sample" className="rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-[1.5rem] bg-[#0B1020] p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">ProfitLens Report</p>
                  <h2 className="text-xl font-bold">Store Profit Snapshot</h2>
                </div>
                <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold text-black">
                  Live Audit
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Metric title="Revenue" value="₹2.4L" icon={<IndianRupee />} />
                <Metric title="Real Profit" value="₹38K" icon={<TrendingUp />} />
                <Metric title="Leaks Found" value="12" icon={<TrendingDown />} />
              </div>

              <div className="mt-5 rounded-2xl bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold">Top Profit Leaks</p>
                  <p className="text-xs text-gray-400">AI detected</p>
                </div>

                {[
                  ["Pearl Necklace", "Low margin", "-₹4,200"],
                  ["Crystal Earrings", "High returns", "18%"],
                  ["Bracelet Ads", "Ad waste", "₹7,500"],
                ].map(([name, issue, value]) => (
                  <div key={name} className="flex items-center justify-between border-t border-white/10 py-3">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-sm text-gray-400">{issue}</p>
                    </div>
                    <p className="font-bold text-red-300">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-sm font-semibold text-emerald-200">Recommended Action</p>
                <p className="mt-1 text-sm text-gray-300">
                  Increase price on low-margin products, pause ads on loss-making SKUs, and promote high-margin products with low return rates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold text-emerald-700">The problem</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              High sales do not always mean high profit.
            </h2>
            <p className="mt-5 text-lg text-gray-600">
              Many stores celebrate revenue while hidden costs quietly destroy margin.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {painPoints.map((point) => (
              <div key={point} className="rounded-3xl border bg-gray-50 p-6">
                <TrendingDown className="mb-4 h-6 w-6 text-red-500" />
                <p className="font-medium">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-semibold text-emerald-300">What you get</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              A clear profit audit, not another confusing dashboard.
            </h2>
            <p className="mt-5 text-lg text-gray-300">
              ProfitLens turns messy e-commerce data into simple business actions you can use immediately.
            </p>
          </div>

          <div className="grid gap-3">
            {auditItems.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-gray-200">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-6 py-20 text-black">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold text-emerald-700">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              From CSV files to profit actions in minutes.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border bg-gray-50 p-7">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="mt-3 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-semibold text-emerald-300">Profit Audit Service</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
              Choose how deep you want your store analyzed.
            </h2>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className={`rounded-[2rem] border p-7 ${
                  pkg.highlighted
                    ? "border-emerald-400 bg-emerald-400 text-black"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <p className={`mt-2 ${pkg.highlighted ? "text-black/70" : "text-gray-400"}`}>
                  {pkg.desc}
                </p>
                <p className="mt-6 text-4xl font-bold">{pkg.price}</p>

                <div className="mt-6 space-y-3">
                  {pkg.points.map((point) => (
                    <div key={point} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>{point}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className={`mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3 font-semibold ${
                    pkg.highlighted
                      ? "bg-black text-white"
                      : "bg-white text-black"
                  }`}
                >
                  Request Audit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20 text-black">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <TrustCard icon={<PackageSearch />} title="Product-level clarity" text="See exactly which SKUs create profit and which ones drain it." />
          <TrustCard icon={<Target />} title="Action-first reports" text="Get practical next steps instead of just charts and numbers." />
          <TrustCard icon={<ShieldCheck />} title="Built for early sellers" text="Works with CSV exports, so you do not need complex integrations." />
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center md:p-12">
          <LineChart className="mx-auto mb-5 h-10 w-10 text-emerald-300" />
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
            Want to know which products are actually making money?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Start with a free mini audit and see where your store may be losing profit.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full bg-emerald-400 px-7 py-4 font-semibold text-black hover:bg-emerald-300">
                  Get Free Mini Audit
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link href="/dashboard" className="rounded-full bg-emerald-400 px-7 py-4 font-semibold text-black hover:bg-emerald-300">
                Open Dashboard
              </Link>
            </SignedIn>

            <Link href="/contact" className="rounded-full border border-white/15 px-7 py-4 font-semibold text-white hover:bg-white/10">
              Contact ProfitLens
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-gray-400 md:flex-row">
          <p>© 2026 {appConfig.companyName}. Built from Hyderabad, India.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/refund" className="hover:text-white">Refund</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-3 text-emerald-300">{icon}</div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function TrustCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border bg-gray-50 p-7">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-3 text-gray-600">{text}</p>
    </div>
  );
}