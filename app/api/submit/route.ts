import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { result, locale, uaClass, appVersion } = body;

    // Basic validation
    if (!result?.code || typeof result.code !== "string") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    // If consented flag is false, skip saving
    if (result.consented === false) {
      return NextResponse.json({ ok: true });
    }

    // TODO: D1 insert (requires Cloudflare env binding)
    // const { env } = (req as unknown as { cf: { env: { DB: D1Database } } }).cf ?? {}
    // await env.DB.prepare(`INSERT INTO results (...) VALUES (...)`).run(...)

    console.log("[submit] received", result.code, locale, uaClass, appVersion);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
