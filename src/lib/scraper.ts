import * as cheerio from "cheerio";

const BREF_BASE = "https://www.basketball-reference.com";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
};

async function fetchPage(url: string): Promise<cheerio.CheerioAPI | null> {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    return cheerio.load(html);
  } catch {
    return null;
  }
}

export async function scrapePlayerIndex(
  letter: string
): Promise<
  { id: string; name: string; startYear: number; endYear: number }[]
> {
  const $ = await fetchPage(`${BREF_BASE}/players/${letter}/`);
  if (!$) return [];

  const players: {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
  }[] = [];

  $("table#players tbody tr").each((_, row) => {
    const $row = $(row);
    const link = $row.find("th a");
    if (!link.length) return;

    const href = link.attr("href") || "";
    const idMatch = href.match(/\/players\/\w\/(\w+)\.html/);
    if (!idMatch) return;

    const name = link.text().trim();
    const startYear = parseInt($row.find("td:nth-child(2)").text().trim());
    const endYear = parseInt($row.find("td:nth-child(3)").text().trim());

    if (name && !isNaN(startYear) && !isNaN(endYear)) {
      players.push({ id: idMatch[1], name, startYear, endYear });
    }
  });

  return players;
}

export async function scrapeTeamRoster(
  teamAbbr: string,
  season: number
): Promise<{ name: string; brefId: string }[]> {
  const $ = await fetchPage(`${BREF_BASE}/teams/${teamAbbr}/${season}.html`);
  if (!$) return [];

  const roster: { name: string; brefId: string }[] = [];

  $("table#roster tbody tr").each((_, row) => {
    const link = $(row).find("td[data-stat='player'] a");
    if (!link.length) return;

    const href = link.attr("href") || "";
    const idMatch = href.match(/\/players\/\w\/(\w+)\.html/);
    if (!idMatch) return;

    roster.push({
      name: link.text().trim(),
      brefId: idMatch[1],
    });
  });

  return roster;
}

export async function scrapePlayerHeadshot(
  brefId: string
): Promise<string | null> {
  const letter = brefId.charAt(0);
  const $ = await fetchPage(`${BREF_BASE}/players/${letter}/${brefId}.html`);
  if (!$) return null;

  const img = $("div.media-item img").attr("src");
  return img || null;
}
