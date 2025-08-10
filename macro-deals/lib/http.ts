// lib/http.ts
export async function fetchHtml(url: string, headers: Record<string,string> = {}) {
  const useProxy = process.env.USE_PROXY === "1";
  const proxy = process.env.PROXY_URL || "";

  // Build target URL safely
  const target = useProxy && proxy ? `${proxy}${encodeURIComponent(url)}` : url;

  // 25s timeout to avoid AbortError too early
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        "cookie": "cookie_consent=true; consent=true; kl_consent=true",
        ...headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    // Never crash the service; caller will see empty html and fall back to stub
    console.error("[fetchHtml] error for", url, err);
    return "";
  } finally {
    clearTimeout(t);
  }
}
