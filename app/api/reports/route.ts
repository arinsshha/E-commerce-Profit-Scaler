import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assertCanCreateReport } from "@/lib/limits";
import type { PlanName } from "@/lib/app-config";

const ReportSchema = z.object({
  title: z.string().min(1).max(120),
  settings: z.any(),
  orders: z.array(z.any()),
  costs: z.array(z.any()),
  ads: z.array(z.any()),
  shipping: z.array(z.any()),
  returns: z.array(z.any()),
  analysis: z.any()
});

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
        analysis: body.analysis
      }
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not save report" }, { status: 400 });
  }
}
