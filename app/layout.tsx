import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThirdPartyIntegrations } from "@/components/third-party-integrations";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProfitLens SaaS",
  description: "AI profit advisor for e-commerce stores"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {children}
          <ThirdPartyIntegrations />
        </body>
      </html>
    </ClerkProvider>
  );
}
