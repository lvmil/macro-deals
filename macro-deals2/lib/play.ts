// lib/play.ts
export async function getHtmlWithPlaywright(url: string): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      locale: "de-DE",
    });
    const page = await ctx.newPage();
    await page.goto("https://www.kaufland.de/", { waitUntil: "domcontentloaded", timeout: 60000 });
    // Try to accept cookie banner if visible
    try {
      const btn = await page.getByRole("button", { name: /akzeptieren|zustimmen|alle akzeptieren/i });
      await btn.click({ timeout: 3000 });
    } catch {}
    await page.goto(url, { waitUntil: "networkidle", timeout: 65000 });
    return await page.content();
  } catch {
    return "";
  } finally {
    await browser.close();
  }
}
