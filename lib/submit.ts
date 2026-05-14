import type { FinalResult } from "./types";

export interface SubmitPayload {
  result: FinalResult;
  locale: string;
  uaClass: "mobile" | "tablet" | "desktop";
  appVersion: string;
}

function getUaClass(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export async function submitResult(
  result: FinalResult,
  locale: string,
  consented: boolean
): Promise<void> {
  if (!consented) return;

  const payload: SubmitPayload = {
    result,
    locale,
    uaClass: getUaClass(),
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? "dev",
  };

  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok && res.status >= 500) {
      // 1 retry after 1 second
      await new Promise((r) => setTimeout(r, 1000));
      await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch (e) {
    console.debug("[submit] failed silently", e);
  }
}
