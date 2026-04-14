import { NextRequest, NextResponse } from "next/server";
import { getPlayer, getHeadshotUrl } from "@/lib/players";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const player = await getPlayer(id);

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...player,
    headshotUrl: getHeadshotUrl(player),
  });
}
