import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";

export async function POST() {
  const user = await requireAppUser();
  return NextResponse.json({ user });
}
