const NBA_STATS_BASE = "https://stats.nba.com/stats";
const NBA_CDN_BASE = "https://cdn.nba.com/headshots/nba/latest/1040x760";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.nba.com/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.nba.com",
};

async function fetchNbaStats(
  endpoint: string,
  params: Record<string, string>
): Promise<NbaStatsResponse | null> {
  const url = new URL(`${NBA_STATS_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  try {
    const res = await fetch(url.toString(), {
      headers: HEADERS,
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as NbaStatsResponse;
  } catch {
    return null;
  }
}

interface NbaStatsResponse {
  resultSets: {
    name: string;
    headers: string[];
    rowSet: (string | number | null)[][];
  }[];
}

function parseResultSet(
  response: NbaStatsResponse,
  resultSetName?: string
): Record<string, string | number | null>[] {
  const resultSet = resultSetName
    ? response.resultSets.find((rs) => rs.name === resultSetName)
    : response.resultSets[0];

  if (!resultSet) return [];

  return resultSet.rowSet.map((row) => {
    const obj: Record<string, string | number | null> = {};
    resultSet.headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

export async function fetchAllPlayers(): Promise<
  {
    id: number;
    name: string;
    fromYear: number;
    toYear: number;
  }[]
> {
  const data = await fetchNbaStats("commonallplayers", {
    LeagueID: "00",
    Season: "2024-25",
    IsOnlyCurrentSeason: "0",
  });

  if (!data) return [];

  const rows = parseResultSet(data);
  return rows
    .filter((r) => r.FROM_YEAR && r.TO_YEAR)
    .map((r) => ({
      id: r.PERSON_ID as number,
      name: r.DISPLAY_FIRST_LAST as string,
      fromYear: r.FROM_YEAR as number,
      toYear: r.TO_YEAR as number,
    }));
}

export async function fetchPlayerCareerStats(
  playerId: number
): Promise<{ teamId: number; teamAbbr: string; season: string }[]> {
  const data = await fetchNbaStats("playercareerstats", {
    PerMode: "Totals",
    PlayerID: playerId.toString(),
  });

  if (!data) return [];

  const rows = parseResultSet(data, "SeasonTotalsRegularSeason");
  return rows.map((r) => ({
    teamId: r.TEAM_ID as number,
    teamAbbr: r.TEAM_ABBREVIATION as string,
    season: r.SEASON_ID as string,
  }));
}

export function getHeadshotUrl(nbaComId: number): string {
  return `${NBA_CDN_BASE}/${nbaComId}.png`;
}

export { NBA_CDN_BASE };
