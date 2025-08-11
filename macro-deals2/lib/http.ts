// lib/http.ts
function appendParam(base: string, kv: string): string {
  // PROXY_URL already ends with &url=
  // We want to add extra params BEFORE the target URL.
  // If PROXY_URL already has render= or others, we’ll override by appending again (ScraperAPI respects last).
  const idx = base.indexOf("&url=");
  if (idx === -1) return base;
  const head = base.slice(0, idx);
  const tail = base.slice(idx); // includes &url=
  return `${head}&${kv}${tail}`;
}

async function doFetch(target: string, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8"
      },
      cache: "no-store",
      signal: controller.signal
    });
    const text = res.ok ? await res.text() : "";
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(t);
  }
}

export async function fetchHtml(url: string) {
  const useProxy = process.env.USE_PROXY === "1";
  const base = process.env.PROXY_URL || "";
  const timeoutMs = 65_000;

  // 1) Proxy + RENDER
  if (useProxy && base) {
    const withRender = appendParam(base, "render=true");
    const target = `${withRender}${encodeURIComponent(url)}`;
    const r1 = await doFetch(target, timeoutMs);
    console.log("[fetchHtml] try#1 proxy+render:", r1.ok, r1.status, "| host: api.scraperapi.com");
    if (r1.ok && r1.text.length > 2000) return r1.text;
  }

  // 2) Proxy + NO RENDER
  if (useProxy && base) {
    const noRender = appendParam(base, "render=false");
    const target = `${noRender}${encodeURIComponent(url)}`;
    const r2 = await doFetch(target, timeoutMs);
    console.log("[fetchHtml] try#2 proxy+noRender:", r2.ok, r2.status, "| host: api.scraperapi.com");
    if (r2.ok && r2.text.length > 2000) return r2.text;
  }

  // 3) Direct (no proxy) as last resort
  {
    const r3 = await doFetch(url, 30_000);
    console.log("[fetchHtml] try#3 direct:", r3.ok, r3.status, "| host:", (()=>{try{return new URL(url).host}catch{return "?"}})());
    if (r3.ok) return r3.text;
  }

  return "";
}
