import { NextRequest, NextResponse } from "next/server";
import { searchPlayers } from "@/lib/players";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchPlayers(q, 8);
  return NextResponse.json({ results });
}
