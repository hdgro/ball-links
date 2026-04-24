"use client";

import { useState } from "react";
import type { Player } from "@/lib/types";

interface CompletionScreenProps {
  chain: Player[];
  guessCount: number;
  hints: number;
  onHome: () => void;
  onRestart: () => void;
  startPlayer: Player;
  finishPlayer: Player;
}

export default function CompletionScreen({
  chain,
  guessCount,
  hints,
  onHome,
  onRestart,
  startPlayer,
  finishPlayer,
}: CompletionScreenProps) {
  const [copiedChallenge, setCopiedChallenge] = useState(false);
  const [copiedResults, setCopiedResults] = useState(false);

  // The finish player isn't stored in the chain (it doesn't count as a link).
  // Append it for display so the path reads start → … → finish.
  const displayChain =
    chain.length > 0 && chain[chain.length - 1].id === finishPlayer.id
      ? chain
      : [...chain, finishPlayer];
  const linkCount = Math.max(0, chain.length - 1);

  const copyChallenge = async () => {
    const url = `${window.location.origin}/play?start=${startPlayer.id}&finish=${finishPlayer.id}`;
    await navigator.clipboard.writeText(url);
    setCopiedChallenge(true);
    setTimeout(() => setCopiedChallenge(false), 2000);
  };

  const copyResults = async () => {
    const chainIds = displayChain.map((p) => p.id).join(",");
    const url = `${window.location.origin}/results?start=${startPlayer.id}&finish=${finishPlayer.id}&chain=${chainIds}&guesses=${guessCount}&hints=${hints}`;
    await navigator.clipboard.writeText(url);
    setCopiedResults(true);
    setTimeout(() => setCopiedResults(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-accent">Connected!</h1>
          <p className="text-muted">
            You linked {startPlayer.name} to {finishPlayer.name}
          </p>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
          <div className="flex justify-between text-center">
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">
                {linkCount}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Links
              </div>
            </div>
            <div className="w-px bg-card-border" />
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">
                {guessCount}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Guesses
              </div>
            </div>
            <div className="w-px bg-card-border" />
            <div className="flex-1">
              <div className="text-2xl font-bold text-foreground">
                {hints}
              </div>
              <div className="text-xs text-muted uppercase tracking-wider">
                Hints
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card-bg border border-card-border rounded-xl p-4 space-y-1">
          <h3 className="text-xs uppercase tracking-wider text-muted font-semibold mb-3">
            Your Path
          </h3>
          {displayChain.map((player, index) => (
            <div key={player.id + index} className="flex items-center gap-2">
              {index < displayChain.length - 1 ? (
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
              ) : (
                <div className="w-4" />
              )}
              <div
                className={`flex-1 px-3 py-2 rounded-lg text-sm ${
                  index === 0 || index === displayChain.length - 1
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

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onHome}
            className="px-4 py-3 bg-card-bg border border-card-border rounded-lg text-foreground font-medium hover:bg-card-border/30 transition-colors"
          >
            Home
          </button>
          <button
            onClick={onRestart}
            className="px-4 py-3 bg-card-bg border border-card-border rounded-lg text-foreground font-medium hover:bg-card-border/30 transition-colors"
          >
            Restart
          </button>
          <button
            onClick={copyChallenge}
            className="px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            {copiedChallenge ? "Copied!" : "Share Challenge"}
          </button>
          <button
            onClick={copyResults}
            className="px-4 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            {copiedResults ? "Copied!" : "Share Results"}
          </button>
        </div>
      </div>
    </div>
  );
}
