"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Player } from "@/lib/types";

function ResultsContent() {
  const searchParams = useSearchParams();

  const startId = searchParams.get("start");
  const finishId = searchParams.get("finish");
  const chainParam = searchParams.get("chain");
  const guessCount = parseInt(searchParams.get("guesses") || "0");

  const [chain, setChain] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChain() {
      if (!startId || !finishId || !chainParam) {
        setError("Invalid results link");
        setIsLoading(false);
        return;
      }

      try {
        const ids = chainParam.split(",");
        const players = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`/api/players/${id}`);
            if (!res.ok) return null;
            return res.json();
          })
        );

        const validPlayers = players.filter(Boolean) as Player[];
        if (validPlayers.length === 0) {
          setError("Could not load player data");
          setIsLoading(false);
          return;
        }

        setChain(validPlayers);
      } catch {
        setError("Failed to load results");
      } finally {
        setIsLoading(false);
      }
    }

    loadChain();
  }, [startId, finishId, chainParam]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-error">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-2 bg-accent text-white rounded-lg"
          >
            Play Ball Links
          </a>
        </div>
      </div>
    );
  }

  const pathLength = chain.length;
  const startPlayer = chain[0];
  const finishPlayer = chain[chain.length - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">
            <span className="text-accent">Ball</span>{" "}
            <span className="text-foreground">Links</span>
          </h1>
          <p className="text-muted text-sm">
            {startPlayer?.name} to {finishPlayer?.name}
          </p>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {pathLength}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Players
              </div>
            </div>
            <div className="w-px bg-card-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {pathLength - 1}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Links
              </div>
            </div>
            <div className="w-px bg-card-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {guessCount}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Guesses
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-1">
          <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">
            Path
          </h3>
          {chain.map((player, index) => (
            <div key={player.id + index} className="flex items-center gap-2">
              {index > 0 && (
                <div className="w-4 flex justify-center">
                  <svg
                    className="w-3 h-3 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              )}
              {index === 0 && <div className="w-4" />}
              <div
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                  index === 0 || index === chain.length - 1
                    ? "bg-accent/15 text-accent font-semibold"
                    : "bg-card-border/30 text-foreground"
                }`}
              >
                {player.name}{" "}
                <span className="text-muted text-xs">
                  ({player.startYear}&ndash;{player.endYear})
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a
            href={`/play?start=${startId}&finish=${finishId}`}
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-bold hover:bg-accent-hover transition-colors"
          >
            Try This Challenge
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
