export async function fetchHtml(url: string, headers: Record<string,string> = {}) {
  const useProxy = process.env.USE_PROXY === "1" && process.env.PROXY_URL;
  const target = useProxy
    ? `${process.env.PROXY_URL}${encodeURIComponent(url)}`
    : url;

  const res = await fetch(target, {
    headers: {
      "user-agent": "Mozilla/5.0 (MacroDealsBot/1.0)",
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "de-DE,de;q=0.9,en;q=0.8",
      // pretend consent
      "cookie": "cookie_consent=true; consent=true; kl_consent=true",
      ...headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
