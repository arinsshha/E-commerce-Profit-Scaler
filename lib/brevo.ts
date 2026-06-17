import { appConfig } from "@/lib/app-config";

type BrevoEmail = {
  to: string | null | undefined;
  name?: string | null;
  subject: string;
  htmlContent: string;
  templateId?: number;
  params?: Record<string, unknown>;
};

const brevoApiKey = process.env.BREVO_API_KEY;
const senderEmail =
  process.env.BREVO_SENDER_EMAIL ||
  process.env.SUPPORT_EMAIL ||
  appConfig.temporarySupportEmail;
const senderName = process.env.BREVO_SENDER_NAME || appConfig.name;

function templateIdFromEnv(key: string) {
  const value = Number(process.env[key] || 0);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function escapeHtml(value: string | null | undefined) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendBrevoEmail({
  to,
  name,
  subject,
  htmlContent,
  templateId,
  params = {}
}: BrevoEmail) {
  if (!brevoApiKey || !to) return { skipped: true };

  const body = templateId
    ? {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: name || undefined }],
        templateId,
        params
      }
    : {
        sender: { email: senderEmail, name: senderName },
        to: [{ email: to, name: name || undefined }],
        subject,
        htmlContent
      };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Brevo email failed: ${message}`);
  }

  return response.json();
}

async function safeSendBrevoEmail(email: BrevoEmail) {
  try {
    return await sendBrevoEmail(email);
  } catch (error) {
    console.error(error);
    return { skipped: true, error: true };
  }
}

export function sendWelcomeEmail(user: { email?: string | null; name?: string | null }) {
  const displayName = escapeHtml(user.name || "there");

  return safeSendBrevoEmail({
    to: user.email,
    name: user.name,
    subject: "Welcome to ProfitLens",
    templateId: templateIdFromEnv("BREVO_WELCOME_TEMPLATE_ID"),
    params: { name: user.name || "there", appName: appConfig.name },
    htmlContent: `
      <p>Hi ${displayName},</p>
      <p>Welcome to ProfitLens. Upload your store CSVs, generate your first profit report, and spot profit leaks before they grow.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard">Open your dashboard</a></p>
    `
  });
}

export function sendTrialEmail(user: { email?: string | null; name?: string | null }) {
  const displayName = escapeHtml(user.name || "there");

  return safeSendBrevoEmail({
    to: user.email,
    name: user.name,
    subject: "Your ProfitLens trial is ready",
    templateId: templateIdFromEnv("BREVO_TRIAL_TEMPLATE_ID"),
    params: {
      name: user.name || "there",
      trialDays: appConfig.pricing.trialDays,
      appName: appConfig.name
    },
    htmlContent: `
      <p>Hi ${displayName},</p>
      <p>Your ${appConfig.pricing.trialDays}-day ProfitLens trial workspace is ready. Start with sample data or upload live CSVs when you are ready.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard">Start your trial</a></p>
    `
  });
}

export function sendReportReadyEmail({
  user,
  reportTitle
}: {
  user: { email?: string | null; name?: string | null };
  reportTitle: string;
}) {
  const displayName = escapeHtml(user.name || "there");
  const safeReportTitle = escapeHtml(reportTitle);

  return safeSendBrevoEmail({
    to: user.email,
    name: user.name,
    subject: "Your ProfitLens report is ready",
    templateId: templateIdFromEnv("BREVO_REPORT_READY_TEMPLATE_ID"),
    params: {
      name: user.name || "there",
      reportTitle,
      appName: appConfig.name
    },
    htmlContent: `
      <p>Hi ${displayName},</p>
      <p>Your report, <strong>${safeReportTitle}</strong>, is ready in ProfitLens.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/dashboard">View your report</a></p>
    `
  });
}
