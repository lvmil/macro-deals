export async function fetchHtml(url: string, headers: Record<string, string> = {}) {
  const useProxy = process.env.USE_PROXY === "1";
  const proxy = process.env.PROXY_URL || "";
  const target = useProxy && proxy ? `${proxy}${encodeURIComponent(url)}` : url;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 60_000); // 60s

  try {
    try {
      const host = new URL(target).host;
      console.log("[fetchHtml] proxy:", useProxy ? "YES" : "NO", "| host:", host);
    } catch {}

    const res = await fetch(target, {
      headers: {
        // keep UA basic; drop consent cookies (let the renderer handle consent)
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
        ...headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    console.error("[fetchHtml] error for", url, err);
    return "";
  } finally {
    clearTimeout(t);
  }
}
