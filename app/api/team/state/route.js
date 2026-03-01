import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Session from '@/models/Session';
import Puzzle from '@/models/Puzzle';
import Team from '@/models/Team';

// Fisher-Yates shuffle with team-specific seed so simultaneous late-joiners
// still get different puzzle sequences.
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

export async function GET(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // ── Waiting state ────────────────────────────────────────────────────────
        // When a team is waiting and a session is active, promote them to 'playing'
        // right here so the very next poll from /team/game already has full data.
        if (team.status === 'waiting') {
            let session = null;
            if (team.activeSessionId) session = await Session.findById(team.activeSessionId);
            if (!session) session = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 });

            if (!session || session.status !== 'started') {
                return NextResponse.json({ status: 'waiting' });
            }

            // Check if the session already has an assignment for this team
            const existingAssignment = session.assignments && session.assignments.get(team.teamName);
            let assignment = existingAssignment;

            if (!assignment || assignment.length === 0) {
                // Assign puzzles now (same logic as login route)
                const allPuzzles = await Puzzle.find({}, 'puzzleId').lean();
                const allIds = allPuzzles.map((p) => p.puzzleId);
                const take = Number(session.puzzlesPerTeam || 5);
                const pool = teamSpecificShuffle(allIds, team.teamName);
                assignment = pool.slice(0, take);
                assignment = teamSpecificShuffle(assignment, team.teamName + '_order');

                if (!session.assignments) session.assignments = new Map();
                session.assignments.set(team.teamName, assignment);
                await session.save();
            }

            // Promote the team in the DB
            const now = new Date();
            await Team.findByIdAndUpdate(team._id, {
                status: 'playing',
                assignedPuzzleIds: assignment,
                activeSessionId: session._id,
                waitingRoomEnteredAt: null,
                currentIndex: 0,
                solvedPuzzleIds: [],
                penaltySeconds: 0,
                gameStartTime: now,
            });

            // Return the redirect signal so the waiting-room page navigates to game
            return NextResponse.json({ status: 'playing', shouldRedirect: '/team/game' });
        }

        // ── Terminal states ──────────────────────────────────────────────────────
        if (team.status === 'success') return NextResponse.json({ status: 'success' });
        if (team.status === 'caught') return NextResponse.json({ status: 'caught' });

        if (team.status !== 'playing') {
            return NextResponse.json({ status: team.status });
        }

        // ── Playing state ────────────────────────────────────────────────────────
        // Re-fetch team from DB so we get the latest assignedPuzzleIds (may have
        // just been written by the promotion block above in a concurrent request).
        const freshTeam = await Team.findById(team._id).lean();

        // Resolve session for time calculations
        let session = null;
        if (freshTeam.activeSessionId) session = await Session.findById(freshTeam.activeSessionId);
        if (!session) session = await Session.findOne({ status: 'started' }).sort({ startedAt: -1 });
        if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

        // If session has ended, redirect to results
        if (session.status === 'ended') {
            return NextResponse.json({ status: 'ended', shouldRedirect: '/team/results' });
        }

        // Calculate timeLeft
        const now = Date.now();
        const endTime = new Date(session.startedAt).getTime() + session.durationMinutes * 60 * 1000;
        const timeLeft = Math.floor((endTime - now) / 1000) - (freshTeam.penaltySeconds || 0);

        // Auto-catch if time expired
        if (timeLeft <= 0) {
            await Team.findByIdAndUpdate(freshTeam._id, { status: 'caught' });
            return NextResponse.json({ status: 'caught' });
        }

        // Guard against empty assignedPuzzleIds (race condition on first poll)
        if (!freshTeam.assignedPuzzleIds || freshTeam.assignedPuzzleIds.length === 0) {
            return NextResponse.json({ status: 'loading' });
        }

        const puzzleId = freshTeam.assignedPuzzleIds[freshTeam.currentIndex];
        const puzzle = await Puzzle.findOne({ puzzleId });
        if (!puzzle) {
            return NextResponse.json({ status: 'loading' });
        }

        const isSolved = (freshTeam.solvedPuzzleIds || []).includes(puzzleId);

        return NextResponse.json({
            status: 'playing',
            timeLeft,
            penaltySeconds: freshTeam.penaltySeconds,
            currentIndex: freshTeam.currentIndex,
            totalPuzzles: freshTeam.assignedPuzzleIds.length,
            solvedCount: (freshTeam.solvedPuzzleIds || []).length,
            puzzle: {
                puzzleId: puzzle.puzzleId,
                type: puzzle.type,
                title: puzzle.title,
                prompt: puzzle.prompt,
                uiConfig: puzzle.uiConfig,
            },
            isSolved,
        });
    } catch (err) {
        console.error('Team state error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
