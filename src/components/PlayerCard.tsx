"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";

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

  const headshotUrl = player.nbaComId
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.nbaComId}.png`
    : "/placeholder.svg";

  if (collapsed && !showExpanded) {
    return (
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 bg-card-bg/60 border border-card-border/50 rounded-lg text-sm text-foreground/80 hover:bg-card-bg hover:border-card-border transition-all flex items-center justify-between"
      >
        <span className="font-medium">{player.name}</span>
        <span className="text-muted text-xs">
          ({player.startYear} &ndash; {player.endYear})
        </span>
      </button>
    );
  }

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4 w-full max-w-xs mx-auto">
      <div className="aspect-[4/3] relative rounded-lg overflow-hidden bg-background mb-3">
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
        <h3 className="font-bold text-lg text-foreground">{player.name}</h3>
        <p className="text-sm text-muted">
          {player.startYear} &ndash; {player.endYear}
        </p>
      </div>
      {collapsed && onToggle && (
        <button
          onClick={onToggle}
          className="mt-2 w-full text-xs text-muted hover:text-foreground transition-colors"
        >
          Collapse
        </button>
      )}
    </div>
  );
}
