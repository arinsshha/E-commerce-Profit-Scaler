import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { canExport } from "@/lib/limits";
import type { PlanName } from "@/lib/app-config";
import { captureServerEvent } from "@/lib/posthog";

function escapePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function buildSimplePdf(lines: string[]) {
  const textCommands = lines
    .slice(0, 42)
    .map((line, index) => `BT /F1 ${index === 0 ? 18 : 10} Tf 50 ${760 - index * 16} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(textCommands)} >> stream\n${textCommands}\nendstream endobj`
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf);
}

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();

    if (!canExport(user.plan as PlanName)) {
      return NextResponse.json(
        { error: "PDF export is available only on paid plans." },
        { status: 403 }
      );
    }

    const { summary, rows = [], topFixes = [], actionPlan = {}, consultantNotes } = await request.json();
    const actionLines = [
      ["Stop ads", actionPlan.stopAds],
      ["Increase price", actionPlan.increasePrice],
      ["Reduce discount", actionPlan.reduceDiscount],
      ["Fix returns", actionPlan.fixReturns],
      ["Promote winners", actionPlan.promoteWinners]
    ].flatMap(([title, items]) => {
      const list = Array.isArray(items) ? items.slice(0, 3) : [];
      if (!list.length) return [];
      return [
        String(title),
        ...list.map((item: Record<string, unknown>) => `- ${item.product || item.sku}: ${item.detail || ""}`)
      ];
    });

    const lines = [
      "ProfitLens Profit Report",
      "",
      summary?.storeName ? `Store: ${summary.storeName}` : "Store: ProfitLens workspace",
      summary?.clientName ? `Client: ${summary.clientName}` : "",
      summary?.generatedAt ? `Generated: ${summary.generatedAt}` : `Generated: ${new Date().toLocaleString()}`,
      summary?.revenue ? `Revenue: ${summary.revenue}` : "",
      summary?.profit ? `Real profit: ${summary.profit}` : "",
      summary?.margin ? `Net margin: ${summary.margin}` : "",
      "",
      "Top fixes",
      ...topFixes.slice(0, 5).map((fix: string) => `- ${fix}`),
      "",
      "Action plan",
      ...actionLines,
      "",
      consultantNotes ? `Consultant notes: ${consultantNotes}` : "",
      "",
      "Top products",
      ...rows.slice(0, 12).map((row: Record<string, unknown>, index: number) =>
        `${index + 1}. ${row.product || row.sku}: profit ${row.realProfit}, margin ${row.marginPercent}%`
      )
    ].filter(Boolean);

    const pdf = buildSimplePdf(lines);

    await captureServerEvent({
      distinctId: user.id,
      event: "report_pdf_clicked",
      properties: {
        plan: user.plan,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        storeName: summary?.storeName || null
      }
    });

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=profitlens-report.pdf"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "PDF export failed" }, { status: 500 });
  }
}
