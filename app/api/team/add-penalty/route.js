import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Session from "@/models/Session";
import { getTeamFromRequest } from "@/lib/auth";

export async function POST(req) {
  try {
    const { teamName } = await getTeamFromRequest(req);
    if (!teamName) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const team = await Team.findOne({ teamName });
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Default to 60s if session not found, but try to use session.penaltyMinutes
    let amountSeconds = 60;
    if (team.activeSessionId) {
        const session = await Session.findById(team.activeSessionId);
        if (session && session.penaltyMinutes) {
            amountSeconds = session.penaltyMinutes * 60;
        }
    }

    team.penaltySeconds = (team.penaltySeconds || 0) + amountSeconds;
    await team.save();

    return NextResponse.json({
      success: true,
      penaltySeconds: team.penaltySeconds,
    });
  } catch (err) {
    console.error("Penalty error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
