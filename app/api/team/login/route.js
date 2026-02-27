import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { setTeamCookie } from "@/lib/session";

export async function POST(req) {
  try {
    const { teamName, register } = await req.json();
    if (!teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Check if team exists
    let team = await Team.findOne({ teamName: teamName.trim() });

    // If register flag is true, create new team
    if (register) {
      if (team) {
        return NextResponse.json(
          { error: "Team name already taken" },
          { status: 409 },
        );
      }

      // Create new team
      team = await Team.create({
        teamName: teamName.trim(),
        status: "waiting",
        lastLoginAt: new Date(),
      });

      const res = NextResponse.json({
        success: true,
        teamName: team.teamName,
        status: team.status,
      });

      setTeamCookie(res, team.teamName);
      return res;
    }

    // Login existing team
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Set team to waiting if currently inactive
    if (team.status === "inactive") {
      team.status = "waiting";
    }
    team.lastLoginAt = new Date();
    await team.save();

    const res = NextResponse.json({
      success: true,
      teamName: team.teamName,
      status: team.status,
    });

    setTeamCookie(res, team.teamName);
    return res;
  } catch (err) {
    console.error("Team login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
