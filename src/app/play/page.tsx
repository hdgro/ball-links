"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PlayerCard from "@/components/PlayerCard";
import PlayerSearch from "@/components/PlayerSearch";
import GuessCounter from "@/components/GuessCounter";
import CompletionScreen from "@/components/CompletionScreen";
import type { Player, SearchResult } from "@/lib/types";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const startId = searchParams.get("start");
  const finishId = searchParams.get("finish");

  const [startPlayer, setStartPlayer] = useState<Player | null>(null);
  const [finishPlayer, setFinishPlayer] = useState<Player | null>(null);
  const [chain, setChain] = useState<Player[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [guessCount, setGuessCount] = useState(0);
  const [correctGuesses, setCorrectGuesses] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNearFinish, setIsNearFinish] = useState(false);

  const loadPlayers = useCallback(async () => {
    if (!startId || !finishId) {
      setLoadError("Missing start or finish player");
      return;
    }

    try {
      const [startRes, finishRes] = await Promise.all([
        fetch(`/api/players/${startId}`),
        fetch(`/api/players/${finishId}`),
      ]);

      if (!startRes.ok || !finishRes.ok) {
        setLoadError("Could not load player data");
        return;
      }

      const start = await startRes.json();
      const finish = await finishRes.json();

      setStartPlayer(start);
      setFinishPlayer(finish);
      setCurrentPlayer(start);
      setChain([start]);
    } catch {
      setLoadError("Failed to load game data");
    }
  }, [startId, finishId]);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers]);

  // Check if current player is one step away from the finish player
  useEffect(() => {
    if (!currentPlayer || !finishId || isComplete) {
      setIsNearFinish(false);
      return;
    }
    if (currentPlayer.id === finishId) {
      setIsNearFinish(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/players/${currentPlayer.id}/teammates?with=${finishId}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setIsNearFinish(Boolean(data.isTeammate));
      } catch {
        if (!cancelled) setIsNearFinish(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentPlayer, finishId, isComplete]);

  const handleGuess = async (result: SearchResult) => {
    if (!currentPlayer || isChecking) return;

    setIsChecking(true);
    setGuessCount((prev) => prev + 1);

    try {
      const res = await fetch(
        `/api/players/${currentPlayer.id}/teammates?with=${result.id}`
      );
      const data = await res.json();

      if (!data.isTeammate) {
        setErrorFlash(true);
        setTimeout(() => setErrorFlash(false), 1500);
        setIsChecking(false);
        return;
      }

      const guessedPlayer: Player = {
        id: result.id,
        name: result.name,
        startYear: result.startYear,
        endYear: result.endYear,
      };

      // Try to get nbaComId for headshot
      try {
        const playerRes = await fetch(`/api/players/${result.id}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          guessedPlayer.nbaComId = playerData.nbaComId;
        }
      } catch {
        // Use without headshot
      }

      setCorrectGuesses((prev) => prev + 1);
      setChain((prev) => [...prev, guessedPlayer]);
      setCurrentPlayer(guessedPlayer);

      // Check if we've reached the finish player
      if (result.id === finishId) {
        setIsComplete(true);
      }
    } catch {
      setErrorFlash(true);
      setTimeout(() => setErrorFlash(false), 1500);
    } finally {
      setIsChecking(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-error">{loadError}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-accent text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!startPlayer || !finishPlayer || !currentPlayer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (isComplete) {
    return (
      <CompletionScreen
        chain={chain}
        guessCount={guessCount}
        startPlayer={startPlayer}
        finishPlayer={finishPlayer}
        onHome={() => router.push("/")}
        onRestart={() => {
          setChain([startPlayer]);
          setCurrentPlayer(startPlayer);
          setGuessCount(0);
          setCorrectGuesses(0);
          setIsComplete(false);
          setExpandedIndex(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Finish player banner */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-card-border">
        <div className="max-w-lg mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">
              Connect to
            </div>
            <button
              onClick={() => router.push("/")}
              className="text-muted hover:text-foreground transition-colors text-sm"
            >
              Quit
            </button>
          </div>
          <button
            onClick={() => {
              if (!isNearFinish || isChecking) return;
              handleGuess({
                id: finishPlayer.id,
                name: finishPlayer.name,
                startYear: finishPlayer.startYear,
                endYear: finishPlayer.endYear,
                score: 0,
              });
            }}
            disabled={!isNearFinish || isChecking}
            className={`w-full px-4 py-2 rounded-lg text-sm transition-all flex items-center justify-between border ${
              isNearFinish
                ? "bg-accent/20 border-accent text-foreground hover:bg-accent/30 cursor-pointer animate-pulse"
                : "bg-card-bg/60 border-card-border/50 text-foreground/80 cursor-default"
            }`}
          >
            <span className="font-medium">{finishPlayer.name}</span>
            <span className="text-muted text-xs">
              ({finishPlayer.startYear} &ndash; {finishPlayer.endYear})
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex gap-4">
          {/* Main game area */}
          <div className="flex-1 space-y-4">
            {/* Guess input */}
            <div className="space-y-2">
              <PlayerSearch
                onSelect={handleGuess}
                placeholder="Enter a teammate..."
                error={errorFlash}
                disabled={isChecking}
                autoFocus
              />
              {errorFlash && (
                <p className="text-error text-sm text-center animate-pulse">
                  Not a teammate! Try again.
                </p>
              )}
              {isChecking && (
                <div className="flex justify-center">
                  <div className="w-5 h-5 border-2 border-muted border-t-accent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Active player card */}
            <PlayerCard player={currentPlayer} />

            {/* Chain history (collapsed cards) */}
            {chain.length > 1 && (
              <div className="space-y-2">
                {chain
                  .slice(0, -1)
                  .reverse()
                  .map((player, reverseIdx) => {
                    const originalIndex = chain.length - 2 - reverseIdx;
                    const isExpanded = expandedIndex === originalIndex;
                    return (
                      <PlayerCard
                        key={player.id + originalIndex}
                        player={player}
                        collapsed={true}
                        showExpanded={isExpanded}
                        onToggle={() =>
                          setExpandedIndex(
                            isExpanded ? null : originalIndex
                          )
                        }
                      />
                    );
                  })}
              </div>
            )}
          </div>

          {/* Guess counter sidebar (desktop) */}
          <div className="hidden sm:block w-32 shrink-0">
            <div className="sticky top-20">
              <GuessCounter total={guessCount} correct={correctGuesses} />
            </div>
          </div>
        </div>

        {/* Mobile guess counter */}
        <div className="sm:hidden fixed bottom-4 right-4 z-30">
          <div className="bg-card-bg border border-card-border rounded-xl px-4 py-2 shadow-lg">
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted">Guesses:</span>
              <span className="font-bold text-foreground">{guessCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
