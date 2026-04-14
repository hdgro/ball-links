"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SearchResult } from "@/lib/types";

interface PlayerSearchProps {
  onSelect: (player: SearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export default function PlayerSearch({
  onSelect,
  placeholder = "Search for a player...",
  disabled = false,
  error = false,
  autoFocus = false,
}: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/players/search?q=${encodeURIComponent(q)}`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setIsOpen(data.results.length > 0);
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 200);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(result);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full px-4 py-3 rounded-lg bg-card-bg border-2 transition-colors text-foreground placeholder:text-muted outline-none ${
          error
            ? "border-error"
            : "border-card-border focus:border-accent"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      )}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-card-bg border border-card-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center justify-between ${
                index === activeIndex
                  ? "bg-accent/20 text-foreground"
                  : "text-foreground hover:bg-card-border/30"
              } ${index === 0 ? "rounded-t-lg" : ""} ${
                index === results.length - 1 ? "rounded-b-lg" : ""
              }`}
            >
              <span className="font-medium">{result.name}</span>
              <span className="text-sm text-muted ml-2">
                ({result.startYear} &ndash; {result.endYear})
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
