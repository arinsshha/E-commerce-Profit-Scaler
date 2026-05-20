import { appConfig } from "@/lib/app-config";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 py-12">
      <h1 className="text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-gray-600">Last updated: May 21, 2026</p>

      <div className="mt-8 space-y-5 text-gray-700">
        <p>
          {appConfig.companyName} respects your privacy. ProfitLens helps e-commerce businesses analyze profitability using uploaded CSV files and generated reports.
        </p>
        <p>
          We may collect your name, email address, account information, uploaded CSV data, generated reports, payment status, and usage data needed to provide the service.
        </p>
        <p>
          Your uploaded business data is used to calculate profitability, generate reports, and provide AI suggestions. We do not sell your uploaded business data.
        </p>
        <p>
          Payments are processed through Stripe and Razorpay. We do not store full card details on our servers.
        </p>
        <p>
          For support or deletion requests, contact {appConfig.temporarySupportEmail}. After the official domain is active, contact {appConfig.futureSupportEmail}.
        </p>
      </div>
    </main>
  );
}
