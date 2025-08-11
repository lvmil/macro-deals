// lib/play.ts
export async function getHtmlWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import("playwright"); // dynamic import to keep cold starts smaller
  const browser = await chromium.launch({
    args: ["--no-sandbox","--disable-setuid-sandbox"],
    headless: true,
  });
  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      locale: "de-DE",
    });
    const page = await ctx.newPage();
    // hit homepage first to set cookies, then go to deals
    await page.goto("https://www.kaufland.de/", { waitUntil: "domcontentloaded", timeout: 60000 });
    // accept cookie banner if present
    try { await page.getByRole("button", { name: /akzeptieren|zustimmen|alle akzeptieren/i }).click({ timeout: 4000 }); } catch {}
    // now go to target
    await page.goto(url, { waitUntil: "networkidle", timeout: 65000 });
    const html = await page.content();
    return html ?? "";
  } catch {
    return "";
  } finally {
    await browser.close();
  }
}
