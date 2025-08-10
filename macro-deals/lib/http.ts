// lib/http.ts
export async function fetchHtml(url: string, headers: Record<string,string> = {}) {
  const useProxy = process.env.USE_PROXY === "1";
  const proxy = process.env.PROXY_URL || "";

  if (useProxy && !proxy) {
    throw new Error("USE_PROXY=1 but PROXY_URL is missing");
  }

  const target = useProxy ? `${proxy}${encodeURIComponent(url)}` : url;

  // 12s timeout so we don't hang forever
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 25_000);

  try {
    const res = await fetch(target, {
      headers: {
        "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        // basic consent cookies to unlock content
        "cookie": "cookie_consent=true; consent=true; kl_consent=true",
        ...headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}
