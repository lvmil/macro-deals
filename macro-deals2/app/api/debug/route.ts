import { NextResponse } from "next/server";
import { fetchHtml } from "../../../lib/http";
import { getHtmlWithPlaywright } from "../../../lib/play";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const mode = (searchParams.get("mode") || "auto").toLowerCase();
  if (!url) return NextResponse.json({ error: "Missing ?url=" }, { status: 400 });

  let html = "";
  let path = "";

  try {
    if (mode === "playwright") {
      html = await getHtmlWithPlaywright(url);
      path = "playwright";
    } else {
      html = await fetchHtml(url);
      path = "fetchHtml(auto)";
    }
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({
    mode: path,
    usedProxy: process.env.USE_PROXY === "1",
    target: url,
    length: html?.length || 0,
    snippet: html ? html.slice(0, 1000) : ""
  });
}
