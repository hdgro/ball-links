"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerSearch from "@/components/PlayerSearch";
import FilterPanel from "@/components/FilterPanel";
import type { SearchResult, RandomFilters } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "random" | null>(null);
  const [startPlayer, setStartPlayer] = useState<SearchResult | null>(null);
  const [finishPlayer, setFinishPlayer] = useState<SearchResult | null>(null);
  const [filters, setFilters] = useState<RandomFilters>({
    modernEra: false,
    minSeasons: false,
    minGames: false,
    allStar: false,
    firstRound: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startManualGame = () => {
    if (!startPlayer || !finishPlayer) return;
    router.push(`/play?start=${startPlayer.id}&finish=${finishPlayer.id}`);
  };

  const startRandomGame = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, "true");
      });

      const res = await fetch(`/api/random?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate random players");
        return;
      }

      const data = await res.json();
      router.push(
        `/play?start=${data.startPlayer.id}&finish=${data.finishPlayer.id}`
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-accent">Ball</span>{" "}
            <span className="text-foreground">Links</span>
          </h1>
          <p className="text-muted text-sm">
            Connect two NBA players through common teammates
          </p>
        </div>

        {/* Mode Selection */}
        {mode === null && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("manual")}
              className="w-full py-4 px-6 bg-card-bg border border-card-border rounded-xl text-foreground font-medium hover:border-accent transition-colors group"
            >
              <div className="text-lg">Choose Players</div>
              <div className="text-sm text-muted group-hover:text-muted">
                Pick your own Start and Finish
              </div>
            </button>
            <button
              onClick={() => setMode("random")}
              className="w-full py-4 px-6 bg-card-bg border border-card-border rounded-xl text-foreground font-medium hover:border-accent transition-colors group"
            >
              <div className="text-lg">Random Players</div>
              <div className="text-sm text-muted group-hover:text-muted">
                Generate a random challenge
              </div>
            </button>
          </div>
        )}

        {/* Manual Mode */}
        {mode === "manual" && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setMode(null);
                setStartPlayer(null);
                setFinishPlayer(null);
              }}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              &larr; Back
            </button>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-semibold mb-1 block">
                  Start Player
                </label>
                {startPlayer ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-card-bg border border-success/50 rounded-lg">
                    <span className="font-medium text-foreground">
                      {startPlayer.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">
                        ({startPlayer.startYear}&ndash;{startPlayer.endYear})
                      </span>
                      <button
                        onClick={() => setStartPlayer(null)}
                        className="text-muted hover:text-error transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <PlayerSearch
                    onSelect={setStartPlayer}
                    placeholder="Search start player..."
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted font-semibold mb-1 block">
                  Finish Player
                </label>
                {finishPlayer ? (
                  <div className="flex items-center justify-between px-4 py-3 bg-card-bg border border-success/50 rounded-lg">
                    <span className="font-medium text-foreground">
                      {finishPlayer.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted">
                        ({finishPlayer.startYear}&ndash;{finishPlayer.endYear})
                      </span>
                      <button
                        onClick={() => setFinishPlayer(null)}
                        className="text-muted hover:text-error transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <PlayerSearch
                    onSelect={setFinishPlayer}
                    placeholder="Search finish player..."
                  />
                )}
              </div>
            </div>

            <button
              onClick={startManualGame}
              disabled={!startPlayer || !finishPlayer}
              className="w-full py-3 bg-accent text-white rounded-lg font-bold text-lg hover:bg-accent-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start Game
            </button>
          </div>
        )}

        {/* Random Mode */}
        {mode === "random" && (
          <div className="space-y-4">
            <button
              onClick={() => setMode(null)}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              &larr; Back
            </button>

            <FilterPanel filters={filters} onChange={setFilters} />

            {error && (
              <div className="px-4 py-3 bg-error/10 border border-error/30 rounded-lg text-error text-sm">
                {error}
              </div>
            )}

            <button
              onClick={startRandomGame}
              disabled={isLoading}
              className="w-full py-3 bg-accent text-white rounded-lg font-bold text-lg hover:bg-accent-hover transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate Challenge"
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
