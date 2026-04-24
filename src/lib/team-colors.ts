// Primary team colors, keyed by basketball-reference abbreviation.
// Kept in sync with scripts/add-bg-colors.mjs — if you change a value here,
// update it there too and re-run the script to refresh players.json bgColor.

export const TEAM_COLORS: Record<string, string> = {
  ATL: "#E03A3E",
  BOS: "#007A33",
  BRK: "#000000",
  NJN: "#002A60",
  CHA: "#1D1160",
  CHO: "#1D1160",
  CHH: "#00788C",
  CHI: "#CE1141",
  CLE: "#860038",
  DAL: "#00538C",
  DEN: "#0E2240",
  DET: "#C8102E",
  GSW: "#1D428A",
  HOU: "#CE1141",
  IND: "#002D62",
  KCK: "#5A2D81",
  LAC: "#C8102E",
  LAL: "#552583",
  MEM: "#5D76A9",
  MIA: "#98002E",
  MIL: "#00471B",
  MIN: "#0C2340",
  NOH: "#0C2340",
  NOK: "#0C2340",
  NOP: "#0C2340",
  NYK: "#006BB6",
  OKC: "#007AC1",
  ORL: "#0077C0",
  PHI: "#006BB6",
  PHO: "#1D1160",
  POR: "#E03A3E",
  SAC: "#5A2D81",
  SAS: "#000000",
  SDC: "#C8102E",
  SEA: "#00653A",
  TOR: "#CE1141",
  UTA: "#002B5C",
  VAN: "#00B2A9",
  WAS: "#002B5C",
  WSB: "#002B5C",
};

const DEFAULT_COLOR = "#1F2937";

export function getTeamColor(team: string | undefined | null): string {
  if (!team) return DEFAULT_COLOR;
  return TEAM_COLORS[team] ?? DEFAULT_COLOR;
}

// Linear gradient wash used on PlayerCards — top-left team color fading
// through a translucent midtone to the app's card-bg in the bottom-right.
export function gradientWash(color: string | undefined | null): string {
  const c = color ?? DEFAULT_COLOR;
  return `linear-gradient(160deg, ${c} 0%, ${c}AA 35%, var(--card-bg, #1a2538) 100%)`;
}
