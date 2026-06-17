import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { sendTrialEmail, sendWelcomeEmail } from "@/lib/brevo";
import { captureServerEvent } from "@/lib/posthog";

export async function requireAppUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new Error("Unauthorized");
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null;

  const existingUser = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { clerkId: clerkUser.id },
        data: { email, name }
      })
    : await prisma.user.create({
        data: { clerkId: clerkUser.id, email, name }
      });

  if (!existingUser) {
    await Promise.all([
      sendWelcomeEmail(user),
      sendTrialEmail(user),
      captureServerEvent({
        distinctId: user.id,
        event: "user_signed_up",
        properties: { email: user.email, plan: user.plan }
      })
    ]);
  }

  return user;
}
