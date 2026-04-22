"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";
import { gradientWash } from "@/lib/team-colors";

interface PlayerCardProps {
  player: Player;
  collapsed?: boolean;
  onToggle?: () => void;
  showExpanded?: boolean;
}

export default function PlayerCard({
  player,
  collapsed = false,
  onToggle,
  showExpanded = true,
}: PlayerCardProps) {
  const [imgError, setImgError] = useState(false);

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

  return (
    <div
      className="border border-card-border rounded-xl p-4 w-full max-w-xs mx-auto"
      style={{ backgroundImage: wash }}
    >
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
  );
}
