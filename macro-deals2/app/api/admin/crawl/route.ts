import { NextResponse } from "next/server";
import { fetchKaufland } from "../../../../lib/fetchers/kaufland";
import { dbSetJSON } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const store = (searchParams.get("store") || "").toLowerCase();
  const zip = searchParams.get("zip") || "60311";

  if (secret !== process.env.CRAWL_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (store !== "kaufland") {
    return NextResponse.json({ error: "unsupported store" }, { status: 400 });
  }

  const deals = await fetchKaufland(zip);
  // write normalized payload
  const payload = { zip, store, deals, ts: Date.now() };
  await dbSetJSON(`deals:${store}:${zip}`, payload, 60 * 60 * 6); // 6h TTL

  return NextResponse.json({ ok: true, store, zip, count: deals.length });
}
