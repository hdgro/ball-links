"use client";

import { useState } from "react";
import type { Player, PlayerStint } from "@/lib/types";
import { gradientWash, getTeamColor } from "@/lib/team-colors";

interface PlayerCardProps {
  player: Player;
  collapsed?: boolean;
  onToggle?: () => void;
  showExpanded?: boolean;
  // Fired the first time the user flips this card to its career-info side.
  // Parent uses this to track unique "hints used" — dedup is the parent's job
  // since the same player may be rendered in more than one card instance.
  onFlip?: (playerId: string) => void;
}

// One row per season. For a season with multiple teams (mid-year trade), the
// row carries more than one team so the render can lay them out side by side —
// preserving the source order so trades read left-to-right chronologically
// (e.g. Harden 2021: HOU → BRK, not alphabetical).
function getSeasonRows(
  stints: PlayerStint[] | undefined
): { season: number; teams: string[] }[] {
  if (!stints || stints.length === 0) return [];
  const byYear = new Map<number, string[]>();
  for (const { season, teamId } of stints) {
    const teams = byYear.get(season);
    if (!teams) {
      byYear.set(season, [teamId]);
    } else if (!teams.includes(teamId)) {
      teams.push(teamId);
    }
  }
  return [...byYear.keys()]
    .sort((a, b) => a - b)
    .map((season) => ({ season, teams: byYear.get(season)! }));
}

// Lowercase "i" in a solid disc — reads cleanly over any background, which the
// stroke-only version didn't when the card corner happened to land on white.
function InfoGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="6.5" r="1.7" />
      <rect x="10.3" y="10" width="3.4" height="8.5" rx="1.2" />
    </svg>
  );
}

function CloseGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="7" y1="7" x2="17" y2="17" />
      <line x1="17" y1="7" x2="7" y2="17" />
    </svg>
  );
}

export default function PlayerCard({
  player,
  collapsed = false,
  onToggle,
  showExpanded = true,
  onFlip,
}: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // Use /images/headshots/ — it serves both legacy players and recent rookies.
  // /images/players/ (the old path) 404s for anyone drafted in the last season or two.
  const headshotUrl = `https://www.basketball-reference.com/req/202106291/images/headshots/${player.id}.jpg`;
  const wash = gradientWash(player.bgColor);

  if (collapsed && !showExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 border border-card-border/40 rounded-lg text-sm text-white hover:brightness-110 transition-all flex items-center justify-between"
        style={{ backgroundImage: wash }}
      >
        <span className="font-medium drop-shadow-sm">{player.name}</span>
        <span className="text-white/80 text-xs">
          ({player.startYear} &ndash; {player.endYear})
        </span>
      </button>
    );
  }

  const seasons = getSeasonRows(player.stints);

  // Shared top-right badge — solid white disc with a dark "i"/× for high
  // contrast against any team-color or white-headshot backdrop.
  const badgeClass =
    "absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white text-slate-900 hover:bg-white/90 flex items-center justify-center shadow-md ring-1 ring-black/10 transition-colors";

  return (
    <div
      className="w-full max-w-xs mx-auto"
      style={{ perspective: "1200px" }}
    >
      <div
        className="relative transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ─── Front ──────────────────────────────────────────────────── */}
        <div
          className="border border-card-border rounded-xl p-4 relative"
          style={{
            backgroundImage: wash,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFlip?.(player.id);
              setFlipped(true);
            }}
            aria-label="Show career info"
            className={badgeClass}
          >
            <InfoGlyph className="w-4 h-4" />
          </button>

          <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-background mb-3">
            {!imgError ? (
              <img
                src={headshotUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/placeholder.svg"
                  alt="No photo available"
                  className="w-24 h-24 opacity-50"
                />
              </div>
            )}
          </div>
          <div className="text-center">
            <h3 className="font-bold text-lg text-white drop-shadow">
              {player.name}
            </h3>
            <p className="text-sm text-white/80">
              {player.startYear} &ndash; {player.endYear}
            </p>
          </div>
          {collapsed && onToggle && (
            <button
              onClick={onToggle}
              className="mt-2 w-full text-xs text-white/70 hover:text-white transition-colors"
            >
              Collapse
            </button>
          )}
        </div>

        {/* ─── Back ───────────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 border border-card-border rounded-xl p-4 flex flex-col"
          style={{
            backgroundImage: wash,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(false);
            }}
            aria-label="Hide career info"
            className={badgeClass}
          >
            <CloseGlyph className="w-4 h-4" />
          </button>

          <div className="text-center mb-3 pt-1 pr-8">
            <h3 className="font-bold text-lg text-white drop-shadow leading-tight">
              {player.name}
            </h3>
            <p className="text-xs uppercase tracking-wider text-white/70">
              Career
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            {seasons.length === 0 ? (
              <p className="text-sm text-white/70 text-center mt-6">
                No career data
              </p>
            ) : (
              <ul className="space-y-1.5">
                {seasons.map(({ season, teams }) => (
                  <li
                    key={season}
                    className="flex items-center gap-2"
                  >
                    <span className="text-white/80 text-xs tabular-nums w-10 shrink-0">
                      {season}
                    </span>
                    <div className="flex-1 flex gap-1.5">
                      {teams.map((team) => (
                        <div
                          key={team}
                          className="flex-1 rounded-md px-2 py-1 text-xs font-bold text-white text-center drop-shadow-sm border border-white/10"
                          style={{
                            backgroundImage: gradientWash(getTeamColor(team)),
                          }}
                        >
                          {team}
                        </div>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
