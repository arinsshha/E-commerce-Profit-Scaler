import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    if (!razorpay) return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });

    const user = await requireAppUser();
    const { amount = 79900, currency = "INR", plan = "STARTER" } = await request.json();

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `profitlens_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        plan
      }
    });

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Razorpay order failed" }, { status: 500 });
  }
}
