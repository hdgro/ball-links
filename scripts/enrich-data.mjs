/**
 * Enrich player data with All-Star, First Round Pick, and career games info.
 *
 * Scrapes:
 *  1. All-Star by player page (1 page)
 *  2. NBA Draft pages 1975–2025 (51 pages)
 *  3. Per-game stats pages 1980–2026 for games played (47 pages)
 *
 * ~99 pages at 2.5s spacing ≈ 4 minutes.
 *
 * Usage: node scripts/enrich-data.mjs
 */

import { writeFileSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, "../src/data/players.json");

const BREF_BASE = "https://www.basketball-reference.com";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};
const DELAY_MS = 2500;

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

// Step 1: All-Star players
async function fetchAllStars() {
  console.log("  Fetching All-Star by player page...");
  const url = `${BREF_BASE}/awards/all_star_by_player.html`;
  const html = await fetchPage(url);
  if (!html) return new Set();

  const allStarIds = new Set();
  // The All-Star table uses plain <a href="/players/x/xxxxx01.html"> links
  const matches = html.matchAll(
    /<a href="\/players\/[a-z]\/([a-z]+\d{2})\.html">/g
  );
  for (const m of matches) {
    allStarIds.add(m[1]);
  }
  console.log(`  Found ${allStarIds.size} All-Star players`);
  return allStarIds;
}

// Step 2: First round draft picks
async function fetchFirstRoundPicks() {
  const firstRoundIds = new Set();
  const startYear = 1975;
  const endYear = 2025;
  const total = endYear - startYear + 1;

  for (let year = startYear; year <= endYear; year++) {
    process.stdout.write(
      `  [${year - startYear + 1}/${total}] ${year}...`
    );
    const url = `${BREF_BASE}/draft/NBA_${year}.html`;
    const html = await fetchPage(url);

    if (html) {
      const tableMatch = html.match(
        /<table[^>]*id="stats"[^>]*>[\s\S]*?<\/table>/
      );
      if (tableMatch) {
        const tableHtml = tableMatch[0];

        // Find where Round 2 starts
        const round2Idx = tableHtml.indexOf("Round 2");
        // If no Round 2 marker, use the whole table (some older drafts may differ)
        const round1Html =
          round2Idx > 0 ? tableHtml.slice(0, round2Idx) : tableHtml;

        // Extract player bref IDs from first-round rows
        // Draft page uses single quotes: href='/players/x/xxxxx01.html'
        const playerMatches = round1Html.matchAll(
          /data-stat="player"[^>]*><a href=['"]\/players\/[a-z]\/([a-z]+\d{2})\.html['"]>/g
        );
        let count = 0;
        for (const m of playerMatches) {
          firstRoundIds.add(m[1]);
          count++;
        }
        process.stdout.write(` ${count} picks`);
      }
    } else {
      process.stdout.write(" FAILED");
    }

    console.log();
    if (year < endYear) await sleep(DELAY_MS);
  }

  console.log(`  Total: ${firstRoundIds.size} first-round picks\n`);
  return firstRoundIds;
}

// Step 3: Career games from per-game stats pages
async function fetchCareerGames() {
  const playerGames = {}; // brefId -> total games
  const startSeason = 1980;
  const endSeason = 2026;
  const total = endSeason - startSeason + 1;

  for (let season = startSeason; season <= endSeason; season++) {
    process.stdout.write(
      `  [${season - startSeason + 1}/${total}] ${season}...`
    );
    const url = `${BREF_BASE}/leagues/NBA_${season}_per_game.html`;
    const html = await fetchPage(url);

    if (html) {
      const tableMatch = html.match(
        /<table[^>]*id="per_game_stats"[^>]*>[\s\S]*?<\/table>/
      );
      if (tableMatch) {
        const rows = tableMatch[0].match(/<tr[^>]*>[\s\S]*?<\/tr>/g) || [];
        let count = 0;

        for (const row of rows) {
          // Skip header rows
          if (row.includes("<th ") && row.includes('scope="col"')) continue;

          // Extract bref ID from data-append-csv or href
          let brefId;
          const csvMatch = row.match(/data-append-csv="([^"]+)"/);
          if (csvMatch) {
            brefId = csvMatch[1];
          } else {
            const hrefMatch = row.match(
              /\/players\/[a-z]\/([a-z]+\d{2})\.html/
            );
            if (hrefMatch) brefId = hrefMatch[1];
          }
          if (!brefId) continue;

          // Skip TOT rows — we'll sum individual team rows instead
          const teamMatch = row.match(
            /data-stat="team_name_abbr"[^>]*>(?:<a[^>]*>)?([A-Z]{3})(?:<\/a>)?/
          );
          if (teamMatch && teamMatch[1] === "TOT") continue;

          // Extract games played
          const gamesMatch = row.match(
            /data-stat="games"\s*>(\d+)/
          );
          if (!gamesMatch) continue;

          const games = parseInt(gamesMatch[1]);
          playerGames[brefId] = (playerGames[brefId] || 0) + games;
          count++;
        }
        process.stdout.write(` ${count} entries`);
      }
    } else {
      process.stdout.write(" FAILED");
    }

    console.log();
    if (season < endSeason) await sleep(DELAY_MS);
  }

  console.log(
    `  Total: ${Object.keys(playerGames).length} players with game data\n`
  );
  return playerGames;
}

async function main() {
  console.log("\nBall Links Data Enrichment");
  console.log("==========================\n");

  // Load existing data
  const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  console.log(
    `Loaded ${Object.keys(data.players).length} players from players.json\n`
  );

  // Step 1: All-Stars
  console.log("Step 1: All-Star players (1 page)...");
  const allStarIds = await fetchAllStars();
  await sleep(DELAY_MS);

  // Step 2: First-round picks
  console.log(`\nStep 2: First-round draft picks (51 pages, ~2 min)...`);
  const firstRoundIds = await fetchFirstRoundPicks();
  await sleep(DELAY_MS);

  // Step 3: Career games
  console.log(`Step 3: Career games played (47 pages, ~2 min)...`);
  const careerGames = await fetchCareerGames();

  // Step 4: Merge into player data
  console.log("Step 4: Merging enrichment data...");

  let allStarCount = 0;
  let firstRoundCount = 0;
  let gamesCount = 0;

  for (const [id, player] of Object.entries(data.players)) {
    if (allStarIds.has(id)) {
      player.allStar = true;
      allStarCount++;
    }
    if (firstRoundIds.has(id)) {
      player.firstRound = true;
      firstRoundCount++;
    }
    if (careerGames[id]) {
      player.careerGames = careerGames[id];
      gamesCount++;
    }
  }

  console.log(`  All-Stars matched: ${allStarCount}`);
  console.log(`  First-round picks matched: ${firstRoundCount}`);
  console.log(`  Players with game counts: ${gamesCount}`);

  // Write output
  writeFileSync(DATA_PATH, JSON.stringify(data));
  const sizeKB = (
    Buffer.byteLength(JSON.stringify(data)) / 1024
  ).toFixed(1);
  console.log(`  File size: ${sizeKB} KB`);
  console.log(`  Written to: ${DATA_PATH}`);

  console.log("\nDone!");
}

main().catch(console.error);
