import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardClient } from "@/components/dashboard-client";
import { DashboardThemeToggle } from "@/components/dashboard-theme-toggle";
import { appConfig } from "@/lib/app-config";
import { getReportsUsedThisMonth } from "@/lib/limits";

export default async function DashboardPage() {
  const user = await requireAppUser();

  const [reports, reportsUsedThisMonth] = await Promise.all([
    prisma.report.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        createdAt: true,
        analysis: true,
      },
    }),
    getReportsUsedThisMonth(user.id)
  ]);

  return (
    <main className="min-h-screen bg-[#eef1f5] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <header className="flex flex-col gap-4 rounded-[24px] bg-white px-5 py-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">
              ProfitLens Workspace
            </p>
            <p className="break-words text-xs text-slate-500">
              {user.email || "user"} · Plan: {user.plan} · Support:{" "}
              {appConfig.temporarySupportEmail}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DashboardThemeToggle />
            {user.email === process.env.ADMIN_EMAIL && (
              <Link
                href="/admin"
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Admin
              </Link>
            )}
            <UserButton />
          </div>
        </header>

        <DashboardClient
          initialReports={JSON.parse(JSON.stringify(reports))}
          userPlan={user.plan}
          reportsUsedThisMonth={reportsUsedThisMonth}
        />
      </div>
    </main>
  );
}
