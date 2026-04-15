/**
 * Ball Links Data Builder
 *
 * Scrapes basketball-reference.com season stats pages to build the
 * full player database. Uses per-game stats pages which list ALL
 * players for a season with their team — one page per season.
 *
 * ~45 pages total (1980–2025) at 3.5s spacing ≈ 3 minutes.
 *
 * Usage: node scripts/build-data.mjs
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/data/players.json");
const CHECKPOINT_PATH = resolve(__dirname, "../src/data/.build-checkpoint.json");

const BREF_BASE = "https://www.basketball-reference.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const START_SEASON = 1980;
const END_SEASON = 2026;
const DELAY_MS = 3500;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    if (res.status === 429) {
      console.log("    Rate limited! Waiting 30s...");
      await sleep(30000);
      const retry = await fetch(url, { headers: HEADERS });
      if (!retry.ok) return null;
      return await retry.text();
    }
    if (!res.ok) {
      console.error(`    HTTP ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.error(`    Fetch error: ${err.message}`);
    return null;
  }
}

function extractPlayersFromSeasonPage(html, season) {
  const entries = [];

  // Each row has: name_display with player link, then team_name_abbr with team link
  // We need to extract pairs of (player, team) from each table row

  // Get the per_game_stats table
  const tableMatch = html.match(
    /<table[^>]*id="per_game_stats"[^>]*>[\s\S]*?<\/table>/
  );
  if (!tableMatch) return entries;

  const rows = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];

  for (const row of rows) {
    // Skip header rows
    if (row.includes("<th ") && row.includes("scope=\"col\"")) continue;

    // Extract player
    const playerMatch = row.match(
      /data-stat="name_display"[^>]*><a href="\/players\/\w\/([^"]+)\.html"[^>]*>([^<]+)<\/a>/
    );
    if (!playerMatch) continue;

    const brefId = playerMatch[1];
    const name = decodeHTMLEntities(playerMatch[2].trim());

    // Extract team
    const teamMatch = row.match(
      /data-stat="team_name_abbr"[^>]*><a href="\/teams\/([^/]+)\//
    );

    // Players with "TOT" (total) played on multiple teams — we'll get their
    // individual team entries from subsequent rows
    if (!teamMatch) continue;
    const team = teamMatch[1];

    // Skip "TOT" rows (aggregate for multi-team players)
    if (team === "TOT") continue;

    entries.push({ brefId, name, team });
  }

  return entries;
}

function decodeHTMLEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
}

// Also get career years from player index pages
async function fetchPlayerIndex() {
  const playerYears = {};
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");

  for (const letter of letters) {
    process.stdout.write(`  ${letter.toUpperCase()}...`);
    const url = `${BREF_BASE}/players/${letter}/`;
    const html = await fetchPage(url);

    if (html) {
      const tableMatch = html.match(
        /<table[^>]*id="players"[^>]*>[\s\S]*?<\/table>/
      );
      if (tableMatch) {
        const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/g) || [];
        let count = 0;
        for (const row of rows) {
          const idMatch = row.match(/\/players\/\w\/([^"]+)\.html/);
          if (!idMatch) continue;

          const yearMin = row.match(
            /data-stat="year_min"[^>]*>(\d{4})/
          );
          const yearMax = row.match(
            /data-stat="year_max"[^>]*>(\d{4})/
          );
          if (yearMin && yearMax) {
            playerYears[idMatch[1]] = {
              startYear: parseInt(yearMin[1]),
              endYear: parseInt(yearMax[1]),
            };
            count++;
          }
        }
        process.stdout.write(`${count} `);
      }
    }
    await sleep(DELAY_MS);
  }
  console.log(`\n  Total: ${Object.keys(playerYears).length} players indexed`);
  return playerYears;
}

async function main() {
  console.log("\nBall Links Data Builder");
  console.log("=======================\n");

  // Check for checkpoint (resume interrupted builds)
  let checkpoint = null;
  if (existsSync(CHECKPOINT_PATH)) {
    try {
      checkpoint = JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
      console.log(`Resuming from checkpoint (season ${checkpoint.lastSeason + 1})...\n`);
    } catch {
      checkpoint = null;
    }
  }

  // Step 1: Fetch player career years from index
  let playerYears;
  if (checkpoint && checkpoint.playerYears) {
    playerYears = checkpoint.playerYears;
    console.log(`Step 1: Using cached player index (${Object.keys(playerYears).length} players)\n`);
  } else {
    console.log("Step 1: Building player index (26 pages, ~1.5 min)...");
    playerYears = await fetchPlayerIndex();
    console.log();
  }

  // Step 2: Fetch season stats pages
  const allPlayers = checkpoint ? checkpoint.players || {} : {};
  const allRosters = checkpoint ? checkpoint.rosters || {} : {};
  const playerStints = checkpoint ? checkpoint.stints || {} : {};
  const startFrom = checkpoint ? (checkpoint.lastSeason || START_SEASON - 1) + 1 : START_SEASON;

  const totalSeasons = END_SEASON - startFrom + 1;
  console.log(`Step 2: Fetching season pages (${startFrom}–${END_SEASON}, ${totalSeasons} pages, ~${Math.ceil(totalSeasons * DELAY_MS / 60000)} min)...`);

  for (let season = startFrom; season <= END_SEASON; season++) {
    process.stdout.write(
      `  [${season - startFrom + 1}/${totalSeasons}] ${season}...`
    );

    const url = `${BREF_BASE}/leagues/NBA_${season}_per_game.html`;
    const html = await fetchPage(url);

    if (html) {
      const entries = extractPlayersFromSeasonPage(html, season);

      // Group by team to build rosters
      const teamGroups = {};
      for (const entry of entries) {
        const rosterKey = `${entry.team}-${season}`;
        if (!teamGroups[rosterKey]) teamGroups[rosterKey] = [];
        if (!teamGroups[rosterKey].includes(entry.brefId)) {
          teamGroups[rosterKey].push(entry.brefId);
        }

        // Add/update player
        if (!allPlayers[entry.brefId]) {
          const years = playerYears[entry.brefId];
          allPlayers[entry.brefId] = {
            name: entry.name,
            startYear: years ? years.startYear : season,
            endYear: years ? years.endYear : season,
          };
        }

        // Add stint
        if (!playerStints[entry.brefId]) playerStints[entry.brefId] = [];
        if (!playerStints[entry.brefId].includes(rosterKey)) {
          playerStints[entry.brefId].push(rosterKey);
        }
      }

      // Merge rosters
      for (const [key, roster] of Object.entries(teamGroups)) {
        allRosters[key] = roster;
      }

      console.log(` ${entries.length} player-team entries`);
    } else {
      console.log(" FAILED");
    }

    // Save checkpoint after each season
    const cp = {
      playerYears,
      players: allPlayers,
      rosters: allRosters,
      stints: playerStints,
      lastSeason: season,
    };
    writeFileSync(CHECKPOINT_PATH, JSON.stringify(cp));

    if (season < END_SEASON) await sleep(DELAY_MS);
  }

  // Step 3: Write output
  console.log("\nStep 3: Writing data file...");

  const outputData = {
    players: allPlayers,
    rosters: allRosters,
    playerStints: playerStints,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(outputData));

  const sizeKB = (Buffer.byteLength(JSON.stringify(outputData)) / 1024).toFixed(1);
  const playerCount = Object.keys(allPlayers).length;
  const rosterCount = Object.keys(allRosters).length;
  console.log(`  ${playerCount} players, ${rosterCount} team-seasons`);
  console.log(`  File size: ${sizeKB} KB`);
  console.log(`  Written to: ${OUTPUT_PATH}`);

  // Clean up checkpoint
  try {
    const { unlinkSync } = await import("fs");
    unlinkSync(CHECKPOINT_PATH);
  } catch {}

  console.log("\nDone!");
}

main().catch(console.error);
