import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { assertRazorpayPlan, getRazorpayAmountForPlan } from "@/lib/billing";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const notes = event.payload?.payment?.entity?.notes;
    const payment = event.payload?.payment?.entity;
    const userId = notes?.userId;

    if (userId) {
      const plan = assertRazorpayPlan(notes?.plan);
      const expectedAmount = getRazorpayAmountForPlan(plan);

      if (payment?.currency !== "INR" || Number(payment?.amount) !== expectedAmount) {
        return NextResponse.json({ error: "Payment amount does not match plan." }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionStatus: "ACTIVE",
          plan
        }
      });
    }
  }

  return NextResponse.json({ received: true });
}
