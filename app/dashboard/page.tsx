import { UserButton } from "@clerk/nextjs";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard-client";
import { appConfig } from "@/lib/app-config";

export default async function DashboardPage() {
  const user = await requireAppUser();

  const reports = await prisma.report.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      title: true,
      createdAt: true,
      analysis: true
    }
  });

  return (
    <main className="min-h-screen bg-gray-50 p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Logged in as {user.email || "user"}</p>
            <p className="text-sm font-medium">Plan: {user.plan} • Status: {user.subscriptionStatus}</p>
            <p className="text-xs text-gray-500">
              Support: {appConfig.temporarySupportEmail}
            </p>
          </div>
          <UserButton />
        </header>
        <DashboardClient
          initialReports={JSON.parse(JSON.stringify(reports))}
          userPlan={user.plan}
        />
      </div>
    </main>
  );
}
