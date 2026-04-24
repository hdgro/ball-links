// Enrich players.json with `hof` flag and `bgColor` for the PlayerCard.
//
// Rules (priority order):
//   1. Player has a 2026 stint → primary color of their current (2026) team
//      (latest team if traded mid-season)
//   2. Player is a Hall of Famer → gold
//   3. Player's last season was 2025 and they have no 2026 stint → pale gray
//      (best-effort "active free agent" detection)
//   4. Otherwise → primary color of the team they played for most
//      (by stint count, tiebroken by the later stint — this is a proxy for
//      "games played per team", which we don't have at single-game resolution)
//
// Team colors are NBA primaries per nbacolors.com / teamcolorcodes.com.
// Run with: node scripts/add-bg-colors.mjs

import fs from "fs/promises";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "src", "data", "players.json");
const HOF_URL = "https://www.basketball-reference.com/awards/hof.html";

// Primary colors for every franchise abbreviation we see in the dataset,
// including historical codes (SEA, NJN, KCK, SDC, VAN, WSB, etc.).
const TEAM_COLORS = {
  ATL: "#E03A3E", // Hawks — red
  BOS: "#007A33", // Celtics — green
  BRK: "#000000", // Brooklyn Nets — black
  NJN: "#002A60", // New Jersey Nets — navy (historical)
  CHA: "#1D1160", // Charlotte Hornets (2014–) — purple
  CHO: "#1D1160", // Charlotte Bobcats/Hornets alt code
  CHH: "#00788C", // Charlotte Hornets (1988–2002) — teal
  CHI: "#CE1141", // Bulls — red
  CLE: "#860038", // Cavaliers — wine
  DAL: "#00538C", // Mavericks — royal blue
  DEN: "#0E2240", // Nuggets — navy
  DET: "#C8102E", // Pistons — red
  GSW: "#1D428A", // Warriors — royal blue
  HOU: "#CE1141", // Rockets — red
  IND: "#002D62", // Pacers — navy
  KCK: "#5A2D81", // Kansas City Kings — purple (historical)
  LAC: "#C8102E", // Clippers — red
  LAL: "#552583", // Lakers — purple
  MEM: "#5D76A9", // Grizzlies — memphis midnight
  MIA: "#98002E", // Heat — red
  MIL: "#00471B", // Bucks — green
  MIN: "#0C2340", // Timberwolves — navy
  NOH: "#0C2340", // New Orleans Hornets — navy (historical)
  NOK: "#0C2340", // New Orleans/OKC Hornets (Katrina years) — navy
  NOP: "#0C2340", // Pelicans — navy
  NYK: "#006BB6", // Knicks — blue
  OKC: "#007AC1", // Thunder — blue
  ORL: "#0077C0", // Magic — blue
  PHI: "#006BB6", // 76ers — blue
  PHO: "#1D1160", // Suns — purple
  POR: "#E03A3E", // Trail Blazers — red
  SAC: "#5A2D81", // Kings — purple
  SAS: "#000000", // Spurs — black
  SDC: "#C8102E", // San Diego Clippers — red (historical)
  SEA: "#00653A", // SuperSonics — green (historical)
  TOR: "#CE1141", // Raptors — red
  UTA: "#002B5C", // Jazz — navy
  VAN: "#00B2A9", // Vancouver Grizzlies — teal (historical)
  WAS: "#002B5C", // Wizards — navy
  WSB: "#002B5C", // Washington Bullets — navy (historical)
};

const HOF_GOLD = "#B8860B"; // dark goldenrod (muted gold that reads as metallic)
const FA_GRAY = "#9CA3AF"; // pale gray — matches tailwind's gray-400
const DEFAULT = "#1F2937"; // fallback slate if team code is unknown

// ---- HOF scrape -------------------------------------------------------------

async function scrapeHof() {
  console.log("Fetching Hall of Fame list…");
  const res = await fetch(HOF_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });
  if (!res.ok) throw new Error(`HOF fetch failed: ${res.status}`);
  const html = await res.text();

  // The HOF page lists every enshrinee — players, coaches, referees, contributors,
  // teams. We only want category = Player. Split into <tr> blocks and keep only
  // rows whose category cell is literally "Player", then extract the bref ID.
  const ids = new Set();
  const rowRegex = /<tr\b[^>]*>[\s\S]*?<\/tr>/g;
  const playerCategoryMarker = ">Player</td>";
  const idRegex = /\/players\/[a-z]\/([a-z'\-]+\d{2})\.html/;

  const rows = html.match(rowRegex) ?? [];
  for (const row of rows) {
    if (!row.includes(playerCategoryMarker)) continue;
    const m = row.match(idRegex);
    if (m) ids.add(m[1]);
  }
  console.log(`  found ${ids.size} HOF players (category=Player)`);
  return ids;
}

// ---- bgColor resolution -----------------------------------------------------

function pickCurrentTeam(stints) {
  // Latest 2026 stint; stints are in chronological order as built.
  const y2026 = stints.filter((s) => s.endsWith("-2026"));
  if (y2026.length === 0) return null;
  return y2026[y2026.length - 1].split("-")[0];
}

function pickMostPlayedTeam(stints) {
  if (stints.length === 0) return null;
  const counts = new Map();
  const lastSeen = new Map();
  stints.forEach((stint, idx) => {
    const [team, yearStr] = stint.split("-");
    const year = parseInt(yearStr, 10);
    counts.set(team, (counts.get(team) ?? 0) + 1);
    // Track the latest season we saw this team — used for tiebreaker.
    if (!lastSeen.has(team) || year > lastSeen.get(team)) {
      lastSeen.set(team, year);
    }
  });

  let best = null;
  for (const [team, count] of counts) {
    if (!best) {
      best = { team, count, last: lastSeen.get(team) };
      continue;
    }
    if (
      count > best.count ||
      (count === best.count && lastSeen.get(team) > best.last)
    ) {
      best = { team, count, last: lastSeen.get(team) };
    }
  }
  return best?.team ?? null;
}

function resolveBgColor({ stints, endYear, hof }) {
  // 1. Active on a 2026 roster
  const currentTeam = pickCurrentTeam(stints);
  if (currentTeam) return TEAM_COLORS[currentTeam] ?? DEFAULT;

  // 2. Hall of Famer
  if (hof) return HOF_GOLD;

  // 3. Played last season but not on a 2026 roster → treat as active FA
  if (endYear === 2025) return FA_GRAY;

  // 4. Retired non-HOF → team they played for most
  const topTeam = pickMostPlayedTeam(stints);
  if (topTeam) return TEAM_COLORS[topTeam] ?? DEFAULT;

  return DEFAULT;
}

// ---- main -------------------------------------------------------------------

async function main() {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  const data = JSON.parse(raw);

  const hofIds = await scrapeHof();

  let hofMatched = 0;
  let activeCount = 0;
  let faCount = 0;
  let retiredHofCount = 0;
  let retiredTeamCount = 0;

  for (const [id, player] of Object.entries(data.players)) {
    const stints = data.playerStints[id] ?? [];
    const hof = hofIds.has(id);
    if (hof) {
      player.hof = true;
      hofMatched++;
    } else {
      delete player.hof;
    }

    const bgColor = resolveBgColor({
      stints,
      endYear: player.endYear,
      hof,
    });
    player.bgColor = bgColor;

    if (pickCurrentTeam(stints)) activeCount++;
    else if (hof) retiredHofCount++;
    else if (player.endYear === 2025) faCount++;
    else retiredTeamCount++;
  }

  await fs.writeFile(DATA_PATH, JSON.stringify(data));
  const size = (await fs.stat(DATA_PATH)).size;

  console.log(`\nWrote ${DATA_PATH} (${(size / 1024).toFixed(1)} KB)`);
  console.log(`  ${hofMatched} HOF players matched`);
  console.log(`  ${activeCount} active (2026 roster)`);
  console.log(`  ${faCount} presumed active free agents (endYear 2025, no 2026 stint)`);
  console.log(`  ${retiredHofCount} retired HOF`);
  console.log(`  ${retiredTeamCount} retired, color from most-played team`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
