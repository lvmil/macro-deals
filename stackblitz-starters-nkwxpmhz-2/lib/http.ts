export async function getHTML(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (MacroDealsBot/0.1; +https://example.com)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0 (MacroDealsBot/0.1)" },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}