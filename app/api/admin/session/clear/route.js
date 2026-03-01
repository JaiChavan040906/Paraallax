import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Session from "@/models/Session";
import Team from "@/models/Team";
import Counter from "@/models/Counter";

// Admin can clear teams + sessions at any time — no cooldown.
export async function POST(req) {
  try {
    const admin = await getAdminFromRequest(req);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const teamResult = await Team.deleteMany({});
    const sessionResult = await Session.deleteMany({});
    // Reset tid counter so team numbering starts from 1 again
    await Counter.deleteOne({ _id: "teamTid" });

    return NextResponse.json({
      success: true,
      cleared: {
        teams: teamResult.deletedCount,
        sessions: sessionResult.deletedCount,
      },
    });
  } catch (err) {
    console.error("Clear session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
