import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Puzzle from "@/models/Puzzle";

import { dealDomainPuzzles } from "@/lib/puzzleAssigner";

export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { durationMinutes, puzzlesPerTeam, penaltyMinutes } = await req.json();
    if (!durationMinutes || durationMinutes < 1) {
      return NextResponse.json({ error: "durationMinutes must be >= 1" }, { status: 400 });
    }

    await connectDB();

    // Fetch waiting teams (teams that have logged in and are waiting)
    const waitingTeams = await Team.find({ status: "waiting" }).lean();
    const teamNames = waitingTeams.map((t) => t.teamName);

    // Fetch all puzzles 
    const allPuzzles = await Puzzle.find({}, "puzzleId type").lean();


    if (allPuzzles.length < (puzzlesPerTeam || 1)) {
      return NextResponse.json(
        { error: `Not enough puzzles in DB. Need ${puzzlesPerTeam}, have ${allPuzzles.length}` },
        { status: 400 },
      );
    }

    // Create session document and assignments. We'll attempt a transaction first.
    const assignments = dealDomainPuzzles(allPuzzles, teamNames);

    const startTime = new Date();

    const sessionDoc = new Session({
      status: "started",
      startedAt: startTime,
      durationMinutes: Number(durationMinutes),
      puzzlesPerTeam: Number(puzzlesPerTeam || 5),
      penaltyMinutes: Number(penaltyMinutes ?? 5),
      teamNames,
    });

    // apply assignments map
    for (const tn of Object.keys(assignments)) {
      sessionDoc.assignments.set(tn, assignments[tn]);
    }

    // Try transaction (replica set) approach
    const mongoSession = await mongoose.startSession();
    let usedTransaction = false;
    try {
      mongoSession.startTransaction();
      usedTransaction = true;

      await sessionDoc.save({ session: mongoSession });

      // Update all waiting teams atomically
      const updates = [];
      for (const t of waitingTeams) {
        updates.push(
          Team.updateOne(
            { _id: t._id, status: "waiting" },
            {
              $set: {
                status: "playing",
                assignedPuzzleIds: assignments[t.teamName],
                currentIndex: 0,
                solvedPuzzleIds: [],
                penaltySeconds: 0,
                activeSessionId: sessionDoc._id,
                gameStartTime: startTime,
              },
            },
            { session: mongoSession },
          ),
        );
      }
      await Promise.all(updates);

      await mongoSession.commitTransaction();
      mongoSession.endSession();

      return NextResponse.json({ success: true, startTime, sessionId: sessionDoc._id });
    } catch (txErr) {
      if (usedTransaction) {
        await mongoSession.abortTransaction();
        mongoSession.endSession();
      }
      console.warn("Transaction failed, falling back to sequential updates:", txErr);
      // Fallback: save sessionDoc and perform sequential updates (best-effort)
    }

    // Fallback (no transaction): save session then update teams sequentially
    await sessionDoc.save();
    const failed = [];
    for (const t of waitingTeams) {
      const res = await Team.findOneAndUpdate(
        { _id: t._id, status: "waiting" },
        {
          status: "playing",
          assignedPuzzleIds: assignments[t.teamName],
          currentIndex: 0,
          solvedPuzzleIds: [],
          penaltySeconds: 0,
          activeSessionId: sessionDoc._id,
          gameStartTime: startTime,
        },
      );
      if (!res) failed.push(t.teamName);
    }

    if (failed.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Not all teams updated",
        failed,
        sessionId: sessionDoc._id,
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, startTime, sessionId: sessionDoc._id });
  } catch (err) {
    console.error("Start session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
