import { appConfig } from "@/lib/app-config";

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 py-12">
      <h1 className="text-4xl font-bold">Refund Policy</h1>
      <div className="mt-8 space-y-5 text-gray-700">
        <p>
          ProfitLens offers a 7-day refund policy for first-time paid subscriptions.
        </p>
        <p>
          To request a refund, email {appConfig.temporarySupportEmail} within 7 days of payment with your account email and payment reference.
        </p>
        <p>
          Refunds may not apply to accounts that heavily used paid features, violated terms, or requested repeated refunds.
        </p>
      </div>
    </main>
  );
}
