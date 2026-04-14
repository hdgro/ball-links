import { NextRequest, NextResponse } from "next/server";
import { getRandomPlayer } from "@/lib/players";

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
  let finishPlayer = await getRandomPlayer(filters);

  // Ensure start and finish are different
  let attempts = 0;
  while (finishPlayer && startPlayer && finishPlayer.id === startPlayer.id && attempts < 20) {
    finishPlayer = await getRandomPlayer(filters);
    attempts++;
  }

  if (!startPlayer || !finishPlayer) {
    return NextResponse.json(
      { error: "Not enough players match the selected filters" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    startPlayer,
    finishPlayer,
  });
}
