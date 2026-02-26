import { NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Team from '@/models/Team';

export async function GET(req) {
    try {
        const admin = await getAdminFromRequest(req);
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const teams = await Team.find({}, 'tid teamName status activeRoomId solvedPuzzleIds penaltySeconds assignedPuzzleIds').lean();
        return NextResponse.json({ teams });
    } catch (err) {
        console.error('Admin teams error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
