import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: "Stripe is not configured" }, { status: 500 });

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature || "",
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );

    if (event.type === "checkout.session.completed") {
      const session: any = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "ACTIVE",
            plan: "STARTER",
            stripeCustomerId: session.customer
          }
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription: any = event.data.object;
      const customerId = subscription.customer;

      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: {
          subscriptionStatus: "CANCELLED",
          plan: "FREE"
        }
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 400 });
  }
}
