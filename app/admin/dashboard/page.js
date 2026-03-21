"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

function formatTime(s) {
  if (s === null || s === undefined) return "--:--:--";
  if (s <= 0) return "00:00:00";
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}

const STATUS_COLORS = {
  inactive: "status-inactive",
  waiting: "status-waiting",
  playing: "status-playing",
  success: "status-success",
  caught: "status-caught",
};

export default function AdminDashboard() {
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);


  const [durationMinutes, setDurationMinutes] = useState(90);
  const [penaltyMinutes, setPenaltyMinutes] = useState(5);

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const [session, setSession] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [sessionTimer, setSessionTimer] = useState(null);


  const fetchData = async () => {
    try {
      const teamsRes = await fetch("/api/admin/teams");
      if (teamsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);

      // Leaderboard always auto-fetches — no roomId needed
      const lbRes = await fetch("/api/admin/leaderboard");
      if (lbRes.ok) {
        const lbData = await lbRes.json();
        setLeaderboard(lbData.leaderboard || []);
        if (lbData.session) setSession(lbData.session);
      }
    } catch {
      /* network, retry */
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // ensure event log interval cleaned
  useEffect(() => {
    const eventInterval = setInterval(() => {
      if (session && session._id) fetchEventLog(session._id);
      else fetchEventLog();
    }, 1000);
    return () => clearInterval(eventInterval);
  }, [session]);

  // Client-side countdown timer for time left
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeaderboard((prev) =>
        prev.map((t) => ({
          ...t,
          timeLeft: Math.max(0, (t.timeLeft || 0) - 1),
        })),
      );
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // fetch event log for admin terminal
  async function fetchEventLog(sessionId) {
    try {
      const url = sessionId ? `/api/admin/session/event-log?sessionId=${sessionId}` : '/api/admin/session/event-log';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      // session might be null (before start) so explicitly update
      if ('session' in data) setSession(data.session);
      if (Array.isArray(data.eventLog)) setEventLog(data.eventLog);
    } catch (e) {
      // ignore
    }
  }

  // helper to compute session remaining seconds
  function computeSessionRemaining(s) {
    if (!s || !s.startedAt || !s.durationMinutes) return null;
    const end = new Date(s.startedAt).getTime() + Number(s.durationMinutes) * 60000;
    return Math.max(0, Math.round((end - Date.now()) / 1000));
  }

  async function startSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const body = { durationMinutes: durationMinutes || 90, penaltyMinutes: penaltyMinutes || 5 };
      const res = await fetch('/api/admin/session/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to start'));
      else {
        setMsg('✓ Session started');
        fetchEventLog(data.sessionId);
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }

  async function stopSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const body = { sessionId: session && session.id ? session.id : session && session._id };
      const res = await fetch('/api/admin/session/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to stop'));
      else {
        setMsg('✓ Session stopped');
        fetchEventLog(body.sessionId);
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }

  async function clearSession() {
    if (loading) return;
    setLoading(true);
    setMsg("");
    try {
      const body = { sessionId: session && session.id ? session.id : session && session._id };
      const res = await fetch('/api/admin/session/clear', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) setMsg('Error: ' + (data.error || 'Failed to clear'));
      else {
        setMsg('✓ Cleared teams and sessions');
        // refresh
        setSession(null);
        setEventLog([]);
        fetchData();
      }
    } catch (e) {
      setMsg('Network error');
    }
    setLoading(false);
  }



  const [approvedNames, setApprovedNames] = useState([]);

  function toggleApprove(teamName) {
    setApprovedNames((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName]
    );
  }

  async function approveTeams() {
    if (approvedNames.length === 0) {
      setMsg("Select at least one team to allow.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/approve-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamNames: approvedNames }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + (data.error || "Failed to approve"));
      } else {
        setMsg(`✓ Approved ${data.approved?.length || 0} team(s)`);
        setApprovedNames([]);
        fetchData();
      }
    } catch {
      setMsg("Network error");
    }
    setLoading(false);
  }

  const waitingTeams = teams.filter((t) => t.status === "waiting");
  const playingTeams = teams.filter((t) =>
    ["playing", "success", "caught"].includes(t.status),
  );

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="text-terminal-amber text-2xl font-bold tracking-widest"
            style={{ textShadow: "0 0 10px #ffb000" }}
          >
            PARAALLAX — ADMIN
          </div>
          <div className="text-terminal-muted text-xs uppercase tracking-wider">
            Control Panel · Polling every 10s
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <button
              onClick={() => router.push("/admin/leaderboard")}
              className="btn-amber text-xs px-3 py-1"
            >
              📊 View Leaderboard
            </button>
          )}
          <div className="text-terminal-muted text-xs animate-pulse">◌ LIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Team Selection + Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Waiting Teams — with approval checkboxes */}
          <div className="terminal-card">
            <div className="terminal-header flex items-center justify-between">
              <span>Waiting Teams ({waitingTeams.length})</span>
              {waitingTeams.length > 0 && (
                <button
                  onClick={() =>
                    setApprovedNames(
                      approvedNames.length === waitingTeams.length
                        ? []
                        : waitingTeams.map((t) => t.teamName)
                    )
                  }
                  className="text-terminal-muted text-xs hover:text-terminal-green"
                >
                  {approvedNames.length === waitingTeams.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>
            {waitingTeams.length === 0 ? (
              <p className="text-terminal-muted text-xs">
                No teams waiting. Teams must log in first.
              </p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {waitingTeams.map((t) => (
                  <label
                    key={t.teamName}
                    className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-terminal-border/10"
                  >
                    <input
                      type="checkbox"
                      checked={approvedNames.includes(t.teamName)}
                      onChange={() => toggleApprove(t.teamName)}
                      className="accent-green-500 w-4 h-4"
                    />
                    <span className="text-terminal-green text-sm font-bold">{t.teamName}</span>
                    <span className="text-terminal-muted text-xs ml-auto">
                      {t.waitingRoomEnteredAt
                        ? new Date(t.waitingRoomEnteredAt).toLocaleTimeString()
                        : ""}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {waitingTeams.length > 0 && (
              <button
                onClick={approveTeams}
                disabled={loading || approvedNames.length === 0}
                className="btn-amber w-full mt-3 disabled:opacity-30"
              >
                {loading ? "ALLOWING..." : `✔ ALLOW SELECTED (${approvedNames.length})`}
              </button>
            )}
            <p className="text-terminal-muted text-xs mt-2">
              Tick teams and click Allow to send them into the game.
            </p>
          </div>

          {/* Session Controls */}
          <div className="terminal-card space-y-3">
            <div className="terminal-header">Session Controls</div>

            <div>
              <label className="text-terminal-muted text-xs block mb-1">Duration (minutes)</label>
              <input type="number" min="1" max="300" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} className="terminal-input" id="duration-minutes" />
            </div>
            <div>
              <label className="text-terminal-muted text-xs block mb-1">Penalty per Wrong Answer (minutes)</label>
              <input type="number" min="1" max="60" value={penaltyMinutes} onChange={(e) => setPenaltyMinutes(e.target.value)} className="terminal-input" id="penalty-minutes" />
            </div>
            <button onClick={startSession} disabled={loading} className="btn-amber w-full disabled:opacity-30">{loading ? "STARTING..." : "▶ START SESSION"}</button>
            <div className="text-terminal-muted text-xs mt-2">Active session: {session && session._id ? session._id.toString().slice(-8) : 'none'}</div>
            <div className="mt-2">
              <button onClick={stopSession} disabled={!session || session.status !== 'started'} className="btn-primary w-full disabled:opacity-30">STOP SESSION</button>
            </div>
            <div className="mt-2">
              <button onClick={clearSession} className="btn-amber w-full">CLEAR TEAMS & SESSIONS</button>
            </div>
          </div>

          {/* Live Event Terminal */}
          <div className="terminal-card">
            <div className="terminal-header">Event Terminal</div>
            <div className="text-terminal-muted text-xs mb-2">Live log of teams and timings</div>
            <div className="max-h-48 overflow-y-auto text-xs">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-terminal-muted">
                    <th className="text-left px-2 py-1">Team</th>
                    <th className="text-left px-2 py-1">Login</th>
                    <th className="text-left px-2 py-1">Game Start</th>
                    <th className="text-left px-2 py-1">Status</th>
                    <th className="text-left px-2 py-1">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {eventLog.map((e) => (
                    <tr key={e.teamName} className="border-b border-terminal-border/20">
                      <td className="px-2 py-1 text-terminal-green font-bold">{e.teamName}</td>
                      <td className="px-2 py-1">{e.loginTime ? new Date(e.loginTime).toLocaleTimeString() : '—'}</td>
                      <td className="px-2 py-1">{e.gameStartedAt ? new Date(e.gameStartedAt).toLocaleTimeString() : '—'}</td>
                      <td className="px-2 py-1">{e.status || '—'}</td>
                      <td className="px-2 py-1">{e.finalScore != null ? e.finalScore : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`px-4 py-2 rounded border text-xs ${msg.startsWith("✓")
                ? "border-terminal-green text-terminal-green bg-green-950/20"
                : "border-terminal-red text-terminal-red bg-red-950/20"
                }`}
            >
              {msg}
            </div>
          )}

          {/* Past Sessions — link to dedicated page */}
          <div className="terminal-card">
            <div className="terminal-header">Past Sessions</div>
            <p className="text-terminal-muted text-xs mb-3">
              View archived leaderboards from all previous events.
            </p>
            <button
              onClick={() => router.push("/admin/past-sessions")}
              className="btn-amber w-full"
            >
              📁 View Past Sessions
            </button>
          </div>

        </div>

        {/* RIGHT: Status + Leaderboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* All Teams Status */}
          <div className="terminal-card">
            <div className="terminal-header">All Teams Status</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-terminal-border text-terminal-muted">
                    <th className="text-left px-2 py-2 font-normal">
                      Team Name
                    </th>
                    <th className="text-left px-2 py-2 font-normal">Status</th>
                    <th className="text-left px-2 py-2 font-normal">Solved</th>
                    <th className="text-left px-2 py-2 font-normal">Penalty</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr
                      key={t.teamName}
                      className="border-b border-terminal-border/30 hover:bg-terminal-border/10"
                    >
                      <td className="px-2 py-2 text-terminal-green font-bold">
                        {t.teamName}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            STATUS_COLORS[t.status] || "status-inactive"
                          }
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-terminal-text">
                        {t.solvedPuzzleIds?.length || 0} /{" "}
                        {t.assignedPuzzleIds?.length || "—"}
                      </td>
                      <td className="px-2 py-2 text-terminal-red">
                        {t.penaltySeconds
                          ? `-${Math.round(t.penaltySeconds / 60)}m`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="terminal-card">
              <div className="terminal-header">Leaderboard</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-terminal-border text-terminal-muted">
                      <th className="text-left px-2 py-2 font-normal">#</th>
                      <th className="text-left px-2 py-2 font-normal">Team</th>
                      <th className="text-left px-2 py-2 font-normal">
                        Status
                      </th>
                      <th className="text-left px-2 py-2 font-normal">
                        Solved
                      </th>
                      <th className="text-left px-2 py-2 font-normal">
                        Penalty
                      </th>
                      <th className="text-left px-2 py-2 font-normal">
                        Time / Left
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((t, idx) => (
                      <tr
                        key={t.teamName}
                        className={`border-b border-terminal-border/30 ${t.status === "success"
                          ? "bg-green-950/20"
                          : t.status === "caught"
                            ? "bg-red-950/10"
                            : ""
                          }`}
                      >
                        <td className="px-2 py-2 text-terminal-muted">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-2 text-terminal-green font-bold">
                          {t.teamName}
                        </td>
                        <td className="px-2 py-2">
                          <span
                            className={
                              STATUS_COLORS[t.status] || "status-inactive"
                            }
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-terminal-text font-bold">
                          {t.solvedCount} / {t.totalPuzzles}
                        </td>
                        <td className="px-2 py-2 text-terminal-red">
                          {t.penaltySeconds
                            ? `-${Math.round(t.penaltySeconds / 60)}m`
                            : "—"}
                        </td>
                        <td
                          className={`px-2 py-2 font-mono ${t.status === "success"
                            ? "text-terminal-green"
                            : t.timeLeft > 300
                              ? "text-terminal-green"
                              : t.timeLeft > 60
                                ? "text-terminal-amber"
                                : "text-terminal-red"
                            }`}
                        >
                          {t.status === "success" && t.timeTaken
                            ? formatTime(t.timeTaken)
                            : formatTime(t.timeLeft)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
