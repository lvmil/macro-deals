import { NextResponse } from "next/server";
import { setCache } from "../../../../lib/cache";
import { fetchKaufland } from "../../../../lib/fetchers/kaufland";

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

  try {
    const deals = await fetchKaufland(zip);
    setCache(`deals:${zip}:kaufland`, deals, 1000 * 60 * 60 * 6); // 6h cache
    return NextResponse.json({ ok: true, store, zip, count: deals.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, store, zip, error: String(e) }, { status: 500 });
  }
}
