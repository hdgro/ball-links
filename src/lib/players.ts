import Fuse from "fuse.js";
import type { Player, SearchResult, TeammateCheckResult } from "./types";

interface PlayerData {
  players: Record<
    string,
    {
      name: string;
      startYear: number;
      endYear: number;
      nbaComId?: number;
      allStar?: boolean;
      firstRound?: boolean;
      careerGames?: number;
    }
  >;
  rosters: Record<string, string[]>;
  playerStints: Record<string, string[]>;
}

let cachedData: PlayerData | null = null;
let cachedFuse: Fuse<Player> | null = null;

async function loadData(): Promise<PlayerData> {
  if (cachedData) return cachedData;

  const data = await import("@/data/players.json");
  cachedData = data.default as unknown as PlayerData;
  return cachedData;
}

function getPlayerList(data: PlayerData): Player[] {
  return Object.entries(data.players).map(([id, p]) => ({
    id,
    name: p.name,
    startYear: p.startYear,
    endYear: p.endYear,
    nbaComId: p.nbaComId,
    allStar: p.allStar,
    firstRound: p.firstRound,
    careerGames: p.careerGames,
  }));
}

async function getFuse(): Promise<Fuse<Player>> {
  if (cachedFuse) return cachedFuse;

  const data = await loadData();
  const players = getPlayerList(data);

  cachedFuse = new Fuse(players, {
    keys: ["name"],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
  });

  return cachedFuse;
}

export async function searchPlayers(
  query: string,
  limit = 10
): Promise<SearchResult[]> {
  const fuse = await getFuse();
  const results = fuse.search(query, { limit });

  return results.map((r) => ({
    id: r.item.id,
    name: r.item.name,
    startYear: r.item.startYear,
    endYear: r.item.endYear,
    score: r.score ?? 1,
  }));
}

export async function getPlayer(id: string): Promise<Player | null> {
  const data = await loadData();
  const p = data.players[id];
  if (!p) return null;

  return {
    id,
    name: p.name,
    startYear: p.startYear,
    endYear: p.endYear,
    nbaComId: p.nbaComId,
  };
}

export async function checkTeammates(
  playerId1: string,
  playerId2: string
): Promise<TeammateCheckResult> {
  const data = await loadData();

  const stints1 = data.playerStints[playerId1];
  const stints2 = data.playerStints[playerId2];

  if (!stints1 || !stints2) {
    return { isTeammate: false, sharedTeams: [] };
  }

  const set1 = new Set(stints1);
  const shared: { team: string; season: number }[] = [];

  for (const stint of stints2) {
    if (set1.has(stint)) {
      const [team, seasonStr] = stint.split("-");
      shared.push({ team, season: parseInt(seasonStr) });
    }
  }

  return {
    isTeammate: shared.length > 0,
    sharedTeams: shared,
  };
}

export async function getTeammateIds(playerId: string): Promise<string[]> {
  const data = await loadData();
  const stints = data.playerStints[playerId];
  if (!stints) return [];

  const teammateSet = new Set<string>();

  for (const stint of stints) {
    const rosterKey = stint;
    const roster = data.rosters[rosterKey];
    if (roster) {
      for (const pid of roster) {
        if (pid !== playerId) {
          teammateSet.add(pid);
        }
      }
    }
  }

  return Array.from(teammateSet);
}

export async function getRandomPlayer(filters: {
  modernEra?: boolean;
  minSeasons?: boolean;
  minGames?: boolean;
  allStar?: boolean;
  firstRound?: boolean;
}): Promise<Player | null> {
  const data = await loadData();
  let players = getPlayerList(data);

  if (filters.modernEra) {
    players = players.filter((p) => p.startYear >= 1980);
  }

  if (filters.minSeasons) {
    players = players.filter((p) => p.endYear - p.startYear + 1 >= 5);
  }

  if (filters.minGames) {
    players = players.filter((p) => (p.careerGames ?? 0) >= 500);
  }

  if (filters.allStar) {
    players = players.filter((p) => p.allStar === true);
  }

  if (filters.firstRound) {
    players = players.filter((p) => p.firstRound === true);
  }

  if (players.length === 0) return null;

  const idx = Math.floor(Math.random() * players.length);
  return players[idx];
}

export async function getAllPlayers(): Promise<Player[]> {
  const data = await loadData();
  return getPlayerList(data);
}

export function getHeadshotUrl(player: Player): string {
  if (player.nbaComId) {
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.nbaComId}.png`;
  }
  return "/placeholder.svg";
}
