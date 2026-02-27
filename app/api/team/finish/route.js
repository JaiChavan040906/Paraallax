import { NextResponse } from "next/server";
import { getTeamFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function POST(req) {
  try {
    const team = await getTeamFromRequest(req);
    if (!team)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (team.status !== "playing") {
      return NextResponse.json(
        { error: "Team not in playing status" },
        { status: 400 },
      );
    }

    await connectDB();
    const now = new Date();

    await Team.findByIdAndUpdate(team._id, {
      status: "success",
      finishTime: now,
    });

    // Calculate time taken in seconds
    const gameStart = new Date(team.gameStartTime);
    const timeTakenSeconds = Math.floor((now - gameStart) / 1000);

    return NextResponse.json({
      success: true,
      message: "Game finished successfully!",
      timeTaken: timeTakenSeconds,
    });
  } catch (err) {
    console.error("Finish error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
