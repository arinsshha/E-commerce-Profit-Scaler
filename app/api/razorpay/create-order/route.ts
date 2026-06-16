import { NextResponse } from "next/server";
import { requireAppUser } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { assertRazorpayPlan, getRazorpayAmountForPlan } from "@/lib/billing";

export async function POST(request: Request) {
  try {
    if (!razorpay) return NextResponse.json({ error: "Razorpay is not configured" }, { status: 500 });

    const user = await requireAppUser();
    const { plan: requestedPlan } = await request.json();
    const plan = assertRazorpayPlan(requestedPlan);
    const amount = getRazorpayAmountForPlan(plan);

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
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
