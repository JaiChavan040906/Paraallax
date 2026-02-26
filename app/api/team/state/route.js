import { NextResponse } from 'next/server';
import { getTeamFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Room from '@/models/Room';
import Puzzle from '@/models/Puzzle';
import Team from '@/models/Team';

export async function GET(req) {
    try {
        const team = await getTeamFromRequest(req);
        if (!team) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // If team is waiting, check if their room has started
        if (team.status === 'waiting') {
            if (team.activeRoomId) {
                const room = await Room.findById(team.activeRoomId);
                if (room && room.status === 'started') {
                    return NextResponse.json({ status: 'playing', shouldRedirect: '/team/game' });
                }
            }
            return NextResponse.json({ status: 'waiting' });
        }

        if (team.status === 'success') return NextResponse.json({ status: 'success' });
        if (team.status === 'caught') return NextResponse.json({ status: 'caught' });

        if (team.status !== 'playing') {
            return NextResponse.json({ status: team.status });
        }

        // --- Playing state ---
        const room = await Room.findById(team.activeRoomId);
        if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

        // Calculate timeLeft
        const now = Date.now();
        const endTime = new Date(room.startTime).getTime() + room.durationMinutes * 60 * 1000;
        const timeLeft = Math.floor((endTime - now) / 1000) - team.penaltySeconds;

        // Auto-catch if time expired
        if (timeLeft <= 0 && team.status === 'playing') {
            await Team.findByIdAndUpdate(team._id, { status: 'caught' });
            return NextResponse.json({ status: 'caught' });
        }

        // Get current puzzle
        const puzzleId = team.assignedPuzzleIds[team.currentIndex];
        const puzzle = await Puzzle.findOne({ puzzleId });
        if (!puzzle) return NextResponse.json({ error: 'Puzzle not found' }, { status: 404 });

        const isSolved = team.solvedPuzzleIds.includes(puzzleId);

        return NextResponse.json({
            status: 'playing',
            timeLeft,
            penaltySeconds: team.penaltySeconds,
            currentIndex: team.currentIndex,
            totalPuzzles: team.assignedPuzzleIds.length,
            solvedCount: team.solvedPuzzleIds.length,
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
