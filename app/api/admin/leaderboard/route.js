import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Room from "@/models/Room";
import Team from "@/models/Team";

export async function GET(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    if (!roomId)
      return NextResponse.json({ error: "roomId required" }, { status: 400 });

    await connectDB();
    const room = await Room.findById(roomId).lean();
    if (!room)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const teams = await Team.find({ teamName: { $in: room.teamNames } }).lean();

    const now = Date.now();
    const leaderboard = teams.map((team) => {
      let timeLeft = null;
      let timeTaken = null;

      if (room.startTime && room.status === "started") {
        const endTime =
          new Date(room.startTime).getTime() + room.durationMinutes * 60 * 1000;
        timeLeft =
          Math.floor((endTime - now) / 1000) - (team.penaltySeconds || 0);
        if (timeLeft < 0) timeLeft = 0;
      }

      // Calculate time taken if team finished
      if (team.status === "success" && team.finishTime && team.gameStartTime) {
        const startTime = new Date(team.gameStartTime).getTime();
        const finishTimeMs = new Date(team.finishTime).getTime();
        timeTaken = Math.floor((finishTimeMs - startTime) / 1000);
      }

      return {
        teamName: team.teamName,
        status: team.status,
        solvedCount: (team.solvedPuzzleIds || []).length,
        totalPuzzles: (team.assignedPuzzleIds || []).length,
        penaltySeconds: team.penaltySeconds || 0,
        timeLeft,
        timeTaken,
      };
    });

    // Sort: success first, then by solved count desc, then penalty asc
    leaderboard.sort((a, b) => {
      if (a.status === "success" && b.status !== "success") return -1;
      if (b.status === "success" && a.status !== "success") return 1;
      if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
      return a.penaltySeconds - b.penaltySeconds;
    });

    return NextResponse.json({
      leaderboard,
      room: {
        status: room.status,
        durationMinutes: room.durationMinutes,
        startTime: room.startTime,
      },
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
