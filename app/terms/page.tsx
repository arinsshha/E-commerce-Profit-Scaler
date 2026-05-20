import { appConfig } from "@/lib/app-config";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 py-12">
      <h1 className="text-4xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-gray-600">Last updated: May 21, 2026</p>

      <div className="mt-8 space-y-5 text-gray-700">
        <p>
          By using ProfitLens, you agree to use the tool for lawful e-commerce business analysis only.
        </p>
        <p>
          ProfitLens provides profitability calculations and AI-generated suggestions. These are business-support insights, not financial, tax, or legal advice.
        </p>
        <p>
          You are responsible for checking your uploaded data, product costs, ad spend, shipping costs, return data, and final business decisions.
        </p>
        <p>
          Paid plans are billed monthly. ProfitLens offers a {appConfig.refundPolicy} policy for eligible users.
        </p>
        <p>
          Contact: {appConfig.temporaryBusinessEmail}. After the official domain is active, contact {appConfig.futureBusinessEmail}.
        </p>
      </div>
    </main>
  );
}
