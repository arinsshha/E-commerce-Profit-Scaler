"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const plans: Plan[] = ["FREE", "STARTER", "GROWTH", "PRO"];
const statuses: SubscriptionStatus[] = ["NONE", "ACTIVE", "PAST_DUE", "CANCELLED"];

async function requireAdminUser() {
  const user = await requireAppUser();

  if (user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return user;
}

function readEnumValue<T extends string>(value: FormDataEntryValue | null, allowed: readonly T[], fallback: T) {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

export async function updateUserSubscription(formData: FormData) {
  await requireAdminUser();

  const userId = String(formData.get("userId") || "");
  const email = String(formData.get("email") || "").trim();
  const plan = readEnumValue(formData.get("plan"), plans, "FREE");
  const subscriptionStatus = readEnumValue(formData.get("subscriptionStatus"), statuses, "NONE");

  if (!userId && !email) {
    redirect("/admin?message=missing-user");
  }

  const where = userId
    ? { id: userId }
    : {
        email: {
          equals: email,
          mode: "insensitive" as const
        }
      };

  const result = await prisma.user.updateMany({
    where,
    data: {
      plan,
      subscriptionStatus
    }
  });

  revalidatePath("/admin");
  redirect(`/admin?message=${result.count ? "updated" : "not-found"}`);
}
