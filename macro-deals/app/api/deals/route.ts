import { NextResponse } from "next/server";
import { fetchHtml } from "../../../lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing ?url=" }, { status: 400 });

  const html = await fetchHtml(url);
  const snippet = html ? html.slice(0, 1200) : "";
  return NextResponse.json({
    usedProxy: process.env.USE_PROXY === "1",
    target: url,
    length: html.length,
    snippet
  });
}
