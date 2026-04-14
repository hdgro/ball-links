import { NextRequest, NextResponse } from "next/server";
import { checkTeammates } from "@/lib/players";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const otherId = request.nextUrl.searchParams.get("with");

  if (!otherId) {
    return NextResponse.json(
      { error: "Missing 'with' query parameter" },
      { status: 400 }
    );
  }

  const result = await checkTeammates(id, otherId);
  return NextResponse.json(result);
}
