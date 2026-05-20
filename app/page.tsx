import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { appConfig } from "@/lib/app-config";

const plans = [
  {
    key: "STARTER",
    name: "Starter",
    inr: "₹799/mo",
    usd: "$19/mo",
    desc: "For small stores",
    reports: "10 reports/month",
    rows: "5,000 CSV rows"
  },
  {
    key: "GROWTH",
    name: "Growth",
    inr: "₹1,999/mo",
    usd: "$49/mo",
    desc: "For growing brands",
    reports: "50 reports/month",
    rows: "25,000 CSV rows"
  },
  {
    key: "PRO",
    name: "Pro",
    inr: "₹4,999/mo",
    usd: "$99/mo",
    desc: "For ad-heavy businesses",
    reports: "Unlimited reports",
    rows: "100,000 CSV rows"
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <nav className="mx-auto flex max-w-6xl items-center justify-between py-4">
        <Link href="/" className="text-xl font-bold">{appConfig.name}</Link>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hidden text-sm text-gray-600 md:inline">Privacy</Link>
          <Link href="/terms" className="hidden text-sm text-gray-600 md:inline">Terms</Link>
          <Link href="/contact" className="hidden text-sm text-gray-600 md:inline">Contact</Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-2xl bg-black px-5 py-2 text-white">Login</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="rounded-2xl bg-black px-5 py-2 text-white">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-8 py-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-sm shadow-sm">
            AI Profit Advisor for E-commerce
          </p>
          <h1 className="text-5xl font-bold tracking-tight">{appConfig.tagline}</h1>
          <p className="mt-5 text-lg text-gray-600">
            Upload orders, product costs, ad spend, shipping, and returns. ProfitLens calculates real profit and gives clear business actions.
          </p>
          <div className="mt-8 flex gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-2xl bg-black px-6 py-3 text-white">Start free</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="rounded-2xl bg-black px-6 py-3 text-white">
                Open dashboard
              </Link>
            </SignedIn>
            <a href="#pricing" className="rounded-2xl border bg-white px-6 py-3">View pricing</a>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Free plan includes 1 report/month and simple English AI suggestions.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="grid gap-3">
            {[
              "Real profit per product",
              "Loss-making product alerts",
              "Low-margin product detection",
              "High-return product risk",
              "Best products to promote",
              "Advanced AI for paid users"
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-gray-100 p-4 font-medium">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl py-10">
        <h2 className="text-3xl font-bold">Pricing</h2>
        <p className="mt-2 text-gray-600">7-day trial. Pay with Razorpay or Stripe.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-2 text-3xl font-bold">{plan.inr}</p>
              <p className="text-gray-500">{plan.usd}</p>
              <p className="mt-2 text-gray-600">{plan.desc}</p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">
                <li>{plan.reports}</li>
                <li>{plan.rows}</li>
                <li>CSV/PDF export</li>
                <li>Advanced AI suggestions</li>
              </ul>
              <SignedIn>
                <Link href="/dashboard?upgrade=true" className="mt-5 inline-block rounded-2xl bg-black px-5 py-2 text-white">
                  Choose {plan.name}
                </Link>
              </SignedIn>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl border-t py-8 text-sm text-gray-600">
        <div className="flex flex-wrap gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p className="mt-4">© 2026 {appConfig.companyName}. Built from Hyderabad, India.</p>
      </footer>
    </main>
  );
}
