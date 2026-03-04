import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Puzzle from "@/models/Puzzle";

// Fisher-Yates shuffle
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Team-specific shuffle for diversity
function teamSpecificShuffle(arr, teamSeed) {
    const a = [...arr];
    let seedOffset = 0;
    for (let k = 0; k < teamSeed.length; k++) {
        seedOffset = (seedOffset * 31 + teamSeed.charCodeAt(k)) >>> 0;
    }
    for (let i = a.length - 1; i > 0; i--) {
        const raw = Math.random() + (seedOffset % (i + 1)) / (i + 2);
        const j = Math.floor(raw * (i + 1)) % (i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// POST /api/admin/approve-teams
// Body: { teamNames: string[] }
// Moves selected waiting teams into the game (assigns puzzles if session is active)
export async function POST(req) {
    try {
        const admin = await getAdminFromRequest(req);
        if (!admin)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { teamNames } = await req.json();
        if (!Array.isArray(teamNames) || teamNames.length === 0) {
            return NextResponse.json(
                { error: "teamNames must be a non-empty array" },
                { status: 400 }
            );
        }

        await connectDB();

        const now = new Date();

        // Find active session (if any)
        const activeSession = await Session.findOne({ status: "started" }).sort({
            startedAt: -1,
        });

        // Fetch all puzzles for assignment
        const allPuzzles = await Puzzle.find({}, "puzzleId").lean();
        const allPuzzleIds = allPuzzles.map((p) => p.puzzleId);

        const approved = [];
        const notFound = [];

        for (const teamName of teamNames) {
            const team = await Team.findOne({ teamName: teamName.trim() });
            if (!team) {
                notFound.push(teamName);
                continue;
            }

            if (activeSession) {
                // Check if team already has an assignment in this session
                const existingAssignment =
                    activeSession.assignments &&
                    activeSession.assignments.get(team.teamName);
                let assignment = existingAssignment;

                if (!assignment || assignment.length === 0) {
                    // Generate fresh, team-unique puzzle assignment
                    const take = Number(activeSession.puzzlesPerTeam || 5);
                    const poolForTeam = teamSpecificShuffle(allPuzzleIds, team.teamName);
                    assignment = poolForTeam.slice(0, take);
                    assignment = teamSpecificShuffle(assignment, team.teamName + "_order");

                    // Persist to session
                    activeSession.assignments.set(team.teamName, assignment);
                }

                // Add to session teamNames if not already present
                if (!activeSession.teamNames.includes(team.teamName)) {
                    activeSession.teamNames.push(team.teamName);
                }

                team.status = "playing";
                team.assignedPuzzleIds = assignment;
                team.activeSessionId = activeSession._id;
                team.currentIndex = team.currentIndex || 0;
                team.solvedPuzzleIds = team.solvedPuzzleIds?.length ? team.solvedPuzzleIds : [];
                team.penaltySeconds = team.penaltySeconds || 0;
                team.gameStartTime = team.gameStartTime || now;
                team.waitingRoomEnteredAt = null;
            } else {
                // No active session yet — just mark them as approved/waiting
                // They'll be picked up when session starts
                // (status stays "waiting" so session start will include them)
                team.status = "waiting";
            }

            await team.save();
            approved.push(teamName);
        }

        if (activeSession) {
            await activeSession.save();
        }

        return NextResponse.json({ success: true, approved, notFound });
    } catch (err) {
        console.error("Approve teams error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
