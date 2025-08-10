// macro-deals/lib/http.ts
export async function fetchHtml(url: string, headers: Record<string, string> = {}) {
  const useProxy = process.env.USE_PROXY === "1";
  const proxy = process.env.PROXY_URL || "";

  // Build the final target (proxy if enabled)
  const target = useProxy && proxy ? `${proxy}${encodeURIComponent(url)}` : url;

  // Longer timeout for heavy pages (e.g., headless-rendered)
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 45_000);

  try {
    // Lightweight log to confirm whether proxy is used and which host we hit
    try {
      const host = new URL(target).host;
      console.log("[fetchHtml] proxy:", useProxy ? "YES" : "NO", "| host:", host);
    } catch {}

    const res = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        // basic consent cookies
        "cookie": "cookie_consent=true; consent=true; kl_consent=true",
        ...headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    // Never crash the API—callers fall back to stubs if needed
    console.error("[fetchHtml] error for", url, err);
    return "";
  } finally {
    clearTimeout(t);
  }
}
