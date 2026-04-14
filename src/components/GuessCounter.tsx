"use client";

interface GuessCounterProps {
  total: number;
  correct: number;
}

export default function GuessCounter({ total, correct }: GuessCounterProps) {
  const incorrect = total - correct;

  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4">
      <h3 className="text-xs uppercase tracking-wider text-muted mb-3 font-semibold">
        Guesses
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-foreground/80">Total</span>
          <span className="font-bold text-xl text-foreground">{total}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-success/80">Correct</span>
          <span className="font-bold text-lg text-success">{correct}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-error/80">Incorrect</span>
          <span className="font-bold text-lg text-error">{incorrect}</span>
        </div>
      </div>
    </div>
  );
}
