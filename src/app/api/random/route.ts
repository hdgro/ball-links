import { NextRequest, NextResponse } from "next/server";
import { checkTeammates, getRandomPlayer } from "@/lib/players";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const filters = {
    modernEra: params.get("modernEra") === "true",
    minSeasons: params.get("minSeasons") === "true",
    minGames: params.get("minGames") === "true",
    allStar: params.get("allStar") === "true",
    firstRound: params.get("firstRound") === "true",
  };

  const startPlayer = await getRandomPlayer(filters);
  if (!startPlayer) {
    return NextResponse.json(
      { error: "Not enough players match the selected filters" },
      { status: 400 }
    );
  }

  // Keep resampling the finish player until we get someone who is:
  //   - a different player from the start, and
  //   - never a teammate (no shared team-season) — ensures the shortest
  //     path between the pair is at least one intermediate link, so the
  //     puzzle is never a trivial direct connection.
  let finishPlayer = null;
  for (let attempts = 0; attempts < 30; attempts++) {
    const candidate = await getRandomPlayer(filters);
    if (!candidate) break;
    if (candidate.id === startPlayer.id) continue;
    const { isTeammate } = await checkTeammates(startPlayer.id, candidate.id);
    if (isTeammate) continue;
    finishPlayer = candidate;
    break;
  }

  if (!finishPlayer) {
    return NextResponse.json(
      {
        error:
          "Could not find a non-teammate pair matching the selected filters",
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    startPlayer,
    finishPlayer,
  });
}
