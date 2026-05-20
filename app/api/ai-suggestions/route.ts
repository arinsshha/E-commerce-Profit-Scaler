import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { generateAISuggestions } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const user = await requireAppUser();
    const { analysis } = await request.json();

    if (!analysis) {
      return NextResponse.json({ error: "Analysis is required" }, { status: 400 });
    }

    const result = await generateAISuggestions({
      analysis,
      plan: user.plan
    });

    return NextResponse.json({ result, suggestions: result.suggestions || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "AI suggestions failed" }, { status: 500 });
  }
}
