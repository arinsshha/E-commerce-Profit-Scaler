type CaptureEvent = {
  distinctId?: string | null;
  event: string;
  properties?: Record<string, unknown>;
};

const posthogKey = process.env.POSTHOG_PROJECT_API_KEY || process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.POSTHOG_HOST ||
  process.env.NEXT_PUBLIC_POSTHOG_HOST ||
  "https://us.i.posthog.com";

export async function captureServerEvent({
  distinctId,
  event,
  properties = {}
}: CaptureEvent) {
  if (!posthogKey || !distinctId) return { skipped: true };

  try {
    const response = await fetch(`${posthogHost.replace(/\/$/, "")}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: posthogKey,
        distinct_id: distinctId,
        event,
        properties
      })
    });

    if (!response.ok) {
      throw new Error(`PostHog capture failed with ${response.status}`);
    }

    return { captured: true };
  } catch (error) {
    console.error(error);
    return { skipped: true, error: true };
  }
}
