import { NextResponse } from "next/server";

const LEAGUE_ID = "1326512818865868800";

export async function GET() {
  try {
    const response = await fetch(
      `https://api.sleeper.app/v1/league/${LEAGUE_ID}`,
      {
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`Sleeper returned ${response.status}`);
    }

    const league = await response.json();

    return NextResponse.json(league);
  } catch (error) {
    console.error("Sleeper API error:", error);

    return NextResponse.json(
      { error: "Unable to load league data" },
      { status: 500 }
    );
  }
}