import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import Team from '@/models/Team';
import { setTeamCookie } from '@/lib/session';

export async function POST(req) {
    try {
        const { tid, password } = await req.json();
        if (!tid || !password) {
            return NextResponse.json({ error: 'tid and password are required' }, { status: 400 });
        }

        await connectDB();
        const team = await Team.findOne({ tid: tid.trim().toUpperCase() });
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const valid = await bcrypt.compare(password, team.passwordHash);
        if (!valid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Set team to waiting if currently inactive
        if (team.status === 'inactive') {
            team.status = 'waiting';
        }
        team.lastLoginAt = new Date();
        await team.save();

        const res = NextResponse.json({
            success: true,
            tid: team.tid,
            teamName: team.teamName,
            status: team.status,
        });

        setTeamCookie(res, team.tid);
        return res;
    } catch (err) {
        console.error('Team login error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
