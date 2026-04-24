import { getPlayer } from "@/lib/players";
import type { Player } from "@/lib/types";

// Preview route for evaluating color-accent treatments. Visit /preview-cards.
// Three sample players chosen for distinct primary colors:
//   LeBron (Lakers purple), Jayson Tatum (Celtics green), Joel Embiid (Sixers blue)

const SAMPLE_IDS = ["jamesle01", "tatumja01", "embiijo01"];

// NBA.com person IDs for the PNG-alpha variant. Hardcoded for this preview
// only — if we adopt variant E we'd scrape these for the whole roster.
const NBA_COM_ID: Record<string, number> = {
  jamesle01: 2544,
  tatumja01: 1628369,
  embiijo01: 203954,
};

function headshot(p: Player) {
  return `https://www.basketball-reference.com/req/202106291/images/headshots/${p.id}.jpg`;
}

function nbaHeadshot(p: Player) {
  const id = NBA_COM_ID[p.id];
  return id
    ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${id}.png`
    : null;
}

// ─── Variant A: Frame ────────────────────────────────────────────────────────
// Thick colored border wraps the whole card. Card interior stays neutral.
function FrameCard({ player }: { player: Player }) {
  const color = player.bgColor ?? "#1F2937";
  return (
    <div
      className="rounded-xl p-1 w-full max-w-xs mx-auto"
      style={{ backgroundColor: color }}
    >
      <div className="bg-card-bg rounded-lg p-4">
        <div className="aspect-[3/4] relative rounded-md overflow-hidden bg-background mb-3">
          <img
            src={headshot(player)}
            alt={player.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-lg text-foreground">{player.name}</h3>
          <p className="text-sm text-muted">
            {player.startYear} – {player.endYear}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Variant B: Nameplate ────────────────────────────────────────────────────
// The info band below the headshot becomes solid team color with white text.
function NameplateCard({ player }: { player: Player }) {
  const color = player.bgColor ?? "#1F2937";
  return (
    <div className="bg-card-bg border border-card-border rounded-xl overflow-hidden w-full max-w-xs mx-auto">
      <div className="p-4 pb-0">
        <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-background mb-3">
          <img
            src={headshot(player)}
            alt={player.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
      <div
        className="px-4 py-3 text-center text-white"
        style={{ backgroundColor: color }}
      >
        <h3 className="font-bold text-lg leading-tight">{player.name}</h3>
        <p className="text-sm text-white/80">
          {player.startYear} – {player.endYear}
        </p>
      </div>
    </div>
  );
}

// ─── Variant C: Ring ─────────────────────────────────────────────────────────
// Just the headshot tile picks up a thick team-colored ring/border.
function RingCard({ player }: { player: Player }) {
  const color = player.bgColor ?? "#1F2937";
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4 w-full max-w-xs mx-auto">
      <div
        className="aspect-[3/4] relative rounded-lg overflow-hidden bg-background mb-3"
        style={{
          boxShadow: `0 0 0 5px ${color}`,
          marginTop: 5,
          marginLeft: 5,
          marginRight: 5,
          width: "calc(100% - 10px)",
        }}
      >
        <img
          src={headshot(player)}
          alt={player.name}
          className="w-full h-full object-cover object-top"
        />
      </div>
      <div className="text-center mt-4">
        <h3 className="font-bold text-lg text-foreground">{player.name}</h3>
        <p className="text-sm text-muted">
          {player.startYear} – {player.endYear}
        </p>
      </div>
    </div>
  );
}

// ─── Variant D: Gradient wash ────────────────────────────────────────────────
// The entire card background is a linear gradient fading from the team color
// at the top-left to the default card bg. Headshot tile stays neutral.
function GradientCard({ player }: { player: Player }) {
  const color = player.bgColor ?? "#1F2937";
  return (
    <div
      className="rounded-xl border border-card-border p-4 w-full max-w-xs mx-auto"
      style={{
        backgroundImage: `linear-gradient(160deg, ${color} 0%, ${color}AA 35%, var(--card-bg, #111) 100%)`,
      }}
    >
      <div className="aspect-[3/4] relative rounded-lg overflow-hidden bg-background mb-3">
        <img
          src={headshot(player)}
          alt={player.name}
          className="w-full h-full object-cover object-top"
        />
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg text-white drop-shadow">
          {player.name}
        </h3>
        <p className="text-sm text-white/80">
          {player.startYear} – {player.endYear}
        </p>
      </div>
    </div>
  );
}

// ─── Variant E: PNG alpha over colored background ───────────────────────────
// What we originally wanted: transparent-cutout headshot from NBA.com CDN,
// sitting on a solid team-color field. Requires scraping NBA.com person IDs
// for the full roster — this preview hardcodes IDs for the three samples.
function AlphaCard({ player }: { player: Player }) {
  const color = player.bgColor ?? "#1F2937";
  const src = nbaHeadshot(player);
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-4 w-full max-w-xs mx-auto">
      <div
        className="aspect-[3/4] relative rounded-lg overflow-hidden mb-3"
        style={{ backgroundColor: color }}
      >
        {src ? (
          <img
            src={src}
            alt={player.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/70 text-xs text-center p-2">
            (No NBA.com ID mapped — would require a scraping pass)
          </div>
        )}
      </div>
      <div className="text-center">
        <h3 className="font-bold text-lg text-foreground">{player.name}</h3>
        <p className="text-sm text-muted">
          {player.startYear} – {player.endYear}
        </p>
      </div>
    </div>
  );
}

const VARIANTS = [
  { key: "frame", label: "A — Frame (colored card border)", Comp: FrameCard },
  { key: "nameplate", label: "B — Nameplate (colored footer)", Comp: NameplateCard },
  { key: "ring", label: "C — Ring (colored halo around headshot)", Comp: RingCard },
  { key: "gradient", label: "D — Gradient wash (team color fades across card)", Comp: GradientCard },
  { key: "alpha", label: "E — PNG alpha (NBA.com transparent headshot on color)", Comp: AlphaCard },
] as const;

export default async function PreviewCardsPage() {
  const loaded = await Promise.all(SAMPLE_IDS.map((id) => getPlayer(id)));
  const players = loaded.filter((p): p is Player => p !== null);

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-12">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            PlayerCard color-accent prototypes
          </h1>
          <p className="text-muted mt-2 max-w-2xl">
            Three treatments for showing each player&rsquo;s team color alongside
            the headshot, since the basketball-reference JPGs are opaque and
            can&rsquo;t be layered over. Pick one (or tell me to try a fourth).
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "#552583" }} />
              Lakers
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "#007A33" }} />
              Celtics
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: "#006BB6" }} />
              76ers
            </span>
          </div>
        </div>

        {VARIANTS.map(({ key, label, Comp }) => (
          <section key={key} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">{label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {players.map((p) => (
                <Comp key={p.id} player={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
