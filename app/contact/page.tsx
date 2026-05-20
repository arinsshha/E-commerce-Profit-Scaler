import { appConfig } from "@/lib/app-config";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl p-6 py-12">
      <h1 className="text-4xl font-bold">Contact ProfitLens</h1>
      <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <p><strong>Owner:</strong> {appConfig.ownerName}</p>
        <p><strong>Company:</strong> {appConfig.companyName}</p>
        <p><strong>Location:</strong> {appConfig.city}, {appConfig.country}</p>
        <p><strong>Support:</strong> {appConfig.temporarySupportEmail}</p>
        <p><strong>Business:</strong> {appConfig.temporaryBusinessEmail}</p>
        <p className="mt-4 text-sm text-gray-600">
          Official domain emails will be activated after a domain is purchased.
        </p>
      </div>
    </main>
  );
}
