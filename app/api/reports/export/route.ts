import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { canExport } from "@/lib/limits";
import type { PlanName } from "@/lib/app-config";
import { captureServerEvent } from "@/lib/posthog";

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();

    if (!canExport(user.plan as PlanName)) {
      return NextResponse.json(
        { error: "Export is available only on paid plans." },
        { status: 403 }
      );
    }

    const { rows } = await request.json();

    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "Rows are required." }, { status: 400 });
    }

    await captureServerEvent({
      distinctId: user.id,
      event: "report_csv_clicked",
      properties: { plan: user.plan, rowCount: rows.length }
    });

    return NextResponse.json({ allowed: true, rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Export failed" }, { status: 500 });
  }
}
