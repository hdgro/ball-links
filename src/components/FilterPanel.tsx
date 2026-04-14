"use client";

import type { RandomFilters } from "@/lib/types";

interface FilterPanelProps {
  filters: RandomFilters;
  onChange: (filters: RandomFilters) => void;
}

const FILTER_OPTIONS: { key: keyof RandomFilters; label: string; description: string }[] = [
  {
    key: "modernEra",
    label: "Modern Era Only",
    description: "1980 \u2013 present",
  },
  {
    key: "minSeasons",
    label: "Min 5 Seasons",
    description: "At least 5 seasons played",
  },
  {
    key: "minGames",
    label: "Min 500 Games",
    description: "At least 500 career games",
  },
  {
    key: "allStar",
    label: "All-Star",
    description: "All-Star appearance required",
  },
  {
    key: "firstRound",
    label: "1st Round Pick",
    description: "First-round draft pick only",
  },
];

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const toggle = (key: keyof RandomFilters) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
        Filters (optional)
      </h3>
      {FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => toggle(opt.key)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${
            filters[opt.key]
              ? "bg-accent/15 border-accent text-foreground"
              : "bg-card-bg border-card-border text-foreground/70 hover:border-card-border/80"
          }`}
        >
          <div className="text-left">
            <div className="font-medium text-sm">{opt.label}</div>
            <div className="text-xs text-muted">{opt.description}</div>
          </div>
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              filters[opt.key]
                ? "bg-accent border-accent"
                : "border-muted"
            }`}
          >
            {filters[opt.key] && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
