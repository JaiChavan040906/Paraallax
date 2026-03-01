import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Counter from "@/models/Counter";
import Session from "@/models/Session";
import Puzzle from "@/models/Puzzle";
import { setTeamCookie } from "@/lib/session";

// Standard Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shuffle that incorporates a team-specific seed offset so two teams
// logging in at the exact same millisecond still get different sequences.
function teamSpecificShuffle(arr, teamSeed) {
  const a = [...arr];
  // Derive a numeric offset from the seed string
  let seedOffset = 0;
  for (let k = 0; k < teamSeed.length; k++) {
    seedOffset = (seedOffset * 31 + teamSeed.charCodeAt(k)) >>> 0;
  }
  for (let i = a.length - 1; i > 0; i--) {
    // Blend Math.random() with the seed-derived offset so each team differs
    const raw = Math.random() + (seedOffset % (i + 1)) / (i + 2);
    const j = Math.floor(raw * (i + 1)) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req) {
  try {
    const { teamName, password, register } = await req.json();
    if (!teamName) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    await connectDB();

    // Clean up null tid fields (can conflict with unique index)
    try {
      await Team.updateMany({ tid: null }, { $unset: { tid: "" } });
    } catch (e) {
      console.warn("tid cleanup warning:", e.message || e);
    }

    // Ensure tid index is unique + sparse to allow missing tid values
    try {
      const existingIndexes = await Team.collection.indexes();
      const tidIndex = existingIndexes.find((ix) => ix.key && ix.key.tid === 1);
      if (tidIndex) {
        const isSparse = !!tidIndex.sparse;
        const isUnique = !!tidIndex.unique;
        if (!isSparse || !isUnique) {
          try {
            await Team.collection.dropIndex(tidIndex.name);
          } catch (dropErr) {
            console.warn('Failed to drop tid index:', dropErr.message || dropErr);
          }
          await Team.collection.createIndex({ tid: 1 }, { unique: true, sparse: true });
        }
      } else {
        await Team.collection.createIndex({ tid: 1 }, { unique: true, sparse: true });
      }
    } catch (e) {
      console.warn('tid index ensure warning:', e.message || e);
    }

    // Initialize counter from the current max tid (so new tids continue)
    try {
      const maxTeam = await Team.findOne({ tid: { $exists: true } }).sort({ tid: -1 }).select('tid').lean();
      const startSeq = maxTeam && typeof maxTeam.tid === 'number' ? maxTeam.tid : 0;
      await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $setOnInsert: { seq: startSeq } },
        { upsert: true },
      );
    } catch (e) {
      console.warn('counter init warning:', e.message || e);
    }

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

      // Generate next tid atomically
      const counter = await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $inc: { seq: 1 } },
        { new: true },
      );

      const now = new Date();

      // Check if a game is already running — if so, assign puzzles immediately
      // so the new team joins live instead of being stuck on the waiting room.
      const activeSessionForReg = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 });

      let newStatus = 'waiting';
      let assignedIds = [];

      if (activeSessionForReg) {
        const allPuzzles = await Puzzle.find({}, 'puzzleId').lean();
        const allIds = allPuzzles.map((p) => p.puzzleId);
        const take = Number(activeSessionForReg.puzzlesPerTeam || 5);
        const poolForTeam = teamSpecificShuffle(allIds, teamName.trim());
        assignedIds = poolForTeam.slice(0, take);
        assignedIds = teamSpecificShuffle(assignedIds, teamName.trim() + '_order');

        // Persist assignment on the session so re-logins get the same sequence
        if (!activeSessionForReg.assignments) activeSessionForReg.assignments = new Map();
        activeSessionForReg.assignments.set(teamName.trim(), assignedIds);
        await activeSessionForReg.save();

        newStatus = 'playing';
      }

      // Create new team
      team = await Team.create({
        teamName: teamName.trim(),
        password: password,
        tid: counter.seq,
        status: newStatus,
        lastLoginAt: now,
        loginTime: now,
        waitingRoomEnteredAt: newStatus === 'waiting' ? now : null,
        assignedPuzzleIds: assignedIds,
        activeSessionId: activeSessionForReg ? activeSessionForReg._id : null,
        currentIndex: 0,
        solvedPuzzleIds: [],
        penaltySeconds: 0,
        gameStartTime: newStatus === 'playing' ? now : null,
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

    // Verify password
    if (team.password !== password) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 },
      );
    }

    // If the team exists but doesn't have a tid (older data), assign one now
    if (team.tid === undefined || team.tid === null) {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'teamTid' },
        { $inc: { seq: 1 } },
        { new: true },
      );
      team.tid = counter.seq;
    }

    const now = new Date();
    // Record login time (always update whenever they hit login)
    team.loginTime = now;

    // Check if there's an active started session
    const activeSession = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 });
    if (activeSession) {
      // Only trust assignments stored against THIS session — never reuse stale
      // puzzle IDs that may belong to a previous game session.
      const existingAssignment =
        activeSession.assignments && activeSession.assignments.get(team.teamName);

      let assignment = existingAssignment;
      const isNewAssignment = !assignment || assignment.length === 0;

      if (isNewAssignment) {
        // Late-join: generate a fresh, team-unique puzzle list
        const allPuzzles = await Puzzle.find({}, 'puzzleId').lean();
        const allIds = allPuzzles.map((p) => p.puzzleId);
        const take = Number(activeSession.puzzlesPerTeam || 5);

        // Use team-specific shuffle so simultaneous late-joiners get different sequences
        const poolForTeam = teamSpecificShuffle(allIds, team.teamName);
        assignment = poolForTeam.slice(0, take);
        // Shuffle the selected slice again for sequence diversity
        assignment = teamSpecificShuffle(assignment, team.teamName + '_order');

        // Persist so re-logins get the same personal puzzle set
        activeSession.assignments.set(team.teamName, assignment);
        await activeSession.save();
      }

      // Always mark as playing and link to this session
      team.status = 'playing';
      team.assignedPuzzleIds = assignment;
      team.activeSessionId = activeSession._id;
      team.waitingRoomEnteredAt = null;

      // Only reset game progress if this is a brand-new assignment.
      // On a re-login, preserve whatever currentIndex / solved state they had.
      if (isNewAssignment) {
        team.currentIndex = 0;
        team.solvedPuzzleIds = [];
        team.penaltySeconds = 0;
        team.gameStartTime = now;
      }

      await team.save();

      const res = NextResponse.json({ success: true, teamName: team.teamName, status: team.status });
      setTeamCookie(res, team.teamName);
      return res;
    }

    // No active session: reset any stale terminal status back to waiting.
    // This covers teams logging in fresh after a previous game ended
    // (their status may still be 'caught', 'success', 'inactive', etc.)
    if (team.status !== 'playing') {
      team.status = 'waiting';
      team.waitingRoomEnteredAt = now;
      // Clear all game state so they start fresh
      team.assignedPuzzleIds = [];
      team.currentIndex = 0;
      team.solvedPuzzleIds = [];
      team.penaltySeconds = 0;
      team.activeSessionId = null;
      team.activeRoomId = null;
      team.gameStartTime = null;
      team.finishTime = null;
      team.finalScore = null;
      team.finalPenalty = null;
      team.finalStatus = null;
    }
    team.lastLoginAt = now;
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
