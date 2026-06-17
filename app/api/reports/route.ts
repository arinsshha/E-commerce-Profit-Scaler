import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCanCreateReport } from "@/lib/limits";
import type { PlanName } from "@/lib/app-config";
import { ReportSchema } from "@/lib/report-schema";
import type { Prisma } from "@prisma/client";
import { sendReportReadyEmail } from "@/lib/brevo";
import { captureServerEvent } from "@/lib/posthog";

export async function GET() {
  try {
    const user = await requireAppUser();
    const reports = await prisma.report.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const body = ReportSchema.parse(await request.json());

    const totalRows =
      body.orders.length +
      body.costs.length +
      body.ads.length +
      body.shipping.length +
      body.returns.length;

    await assertCanCreateReport({
      userId: user.id,
      plan: user.plan as PlanName,
      totalRows
    });

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        title: body.title,
        settings: body.settings,
        orders: body.orders,
        costs: body.costs,
        ads: body.ads,
        shipping: body.shipping,
        returns: body.returns,
        analysis: body.analysis as unknown as Prisma.InputJsonValue
      }
    });

    await Promise.all([
      sendReportReadyEmail({ user, reportTitle: report.title }),
      captureServerEvent({
        distinctId: user.id,
        event: "report_generated",
        properties: {
          reportId: report.id,
          reportTitle: report.title,
          plan: user.plan,
          totalRows
        }
      })
    ]);

    return NextResponse.json({ report });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not save report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
