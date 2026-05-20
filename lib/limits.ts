import { prisma } from "@/lib/db";
import { getPlanConfig, type PlanName } from "@/lib/app-config";

export async function getReportsUsedThisMonth(userId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return prisma.report.count({
    where: {
      userId,
      createdAt: {
        gte: start
      }
    }
  });
}

export async function assertCanCreateReport({
  userId,
  plan,
  totalRows
}: {
  userId: string;
  plan: PlanName;
  totalRows: number;
}) {
  const planConfig = getPlanConfig(plan);

  if (totalRows > Number(planConfig.maxCsvRows)) {
    throw new Error(
      `${planConfig.name} plan allows up to ${planConfig.maxCsvRows} CSV rows. Your upload has ${totalRows} rows.`
    );
  }

  if (planConfig.reportsPerMonth !== "unlimited") {
    const used = await getReportsUsedThisMonth(userId);
    if (used >= Number(planConfig.reportsPerMonth)) {
      throw new Error(
        `${planConfig.name} plan allows ${planConfig.reportsPerMonth} report(s) per month. Please upgrade to create more reports.`
      );
    }
  }

  return true;
}

export function canExport(plan: PlanName) {
  return Boolean(getPlanConfig(plan).exportEnabled);
}

export function getAILevel(plan: PlanName) {
  return getPlanConfig(plan).aiLevel;
}
