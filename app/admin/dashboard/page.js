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
  const [rooms, setRooms] = useState([]);
  const [selectedTeamNames, setSelectedTeamNames] = useState([]);
  const [puzzlesPerTeam, setPuzzlesPerTeam] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [activeRoomId, setActiveRoomId] = useState("");
  const [createdRoomId, setCreatedRoomId] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchData = async () => {
    try {
      const teamsRes = await fetch("/api/admin/teams");
      if (teamsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams || []);

      if (activeRoomId) {
        const lbRes = await fetch(
          `/api/admin/leaderboard?roomId=${activeRoomId}`,
        );
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          setLeaderboard(lbData.leaderboard || []);
        }
      }
    } catch {
      /* network, retry */
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeRoomId, router]);

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

  function toggleTeamName(teamName) {
    setSelectedTeamNames((prev) =>
      prev.includes(teamName)
        ? prev.filter((t) => t !== teamName)
        : [...prev, teamName],
    );
  }

  async function createRoom() {
    if (selectedTeamNames.length === 0) {
      setMsg("Select at least one team.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamNames: selectedTeamNames,
          puzzlesPerTeam: Number(puzzlesPerTeam),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setCreatedRoomId(data.roomId);
        setMsg(`✓ Room created. ID: ${data.roomId}`);
      }
    } catch {
      setMsg("Network error");
    }
    setLoading(false);
  }

  async function startRoom() {
    const roomId = createdRoomId || activeRoomId;
    if (!roomId) {
      setMsg("Create a room first.");
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          durationMinutes: Number(durationMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("Error: " + data.error);
      } else {
        setActiveRoomId(roomId);
        setMsg(`✓ Game started! Duration: ${durationMinutes} min`);
        setCreatedRoomId("");
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
        <div className="text-terminal-muted text-xs animate-pulse">◌ LIVE</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Team Selection + Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Waiting Teams */}
          <div className="terminal-card">
            <div className="terminal-header">
              Waiting Teams ({waitingTeams.length})
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
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer border transition-all ${
                      selectedTeamNames.includes(t.teamName)
                        ? "border-terminal-green bg-green-950/30"
                        : "border-transparent hover:border-terminal-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTeamNames.includes(t.teamName)}
                      onChange={() => toggleTeamName(t.teamName)}
                      className="accent-terminal-green"
                      id={`team-${t.teamName}`}
                    />
                    <span className="text-terminal-green text-sm font-bold">
                      {t.teamName}
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() =>
                  setSelectedTeamNames(waitingTeams.map((t) => t.teamName))
                }
                className="text-xs text-terminal-green hover:underline"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedTeamNames([])}
                className="text-xs text-terminal-muted hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Create Room Controls */}
          <div className="terminal-card space-y-3">
            <div className="terminal-header">Create Room</div>
            <div>
              <label className="text-terminal-muted text-xs block mb-1">
                Puzzles per Team
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={puzzlesPerTeam}
                onChange={(e) => setPuzzlesPerTeam(e.target.value)}
                className="terminal-input"
                id="puzzles-per-team"
              />
            </div>
            <button
              onClick={createRoom}
              disabled={loading || selectedTeamNames.length === 0}
              className="btn-amber w-full disabled:opacity-30"
            >
              {loading
                ? "CREATING..."
                : `> CREATE ROOM (${selectedTeamNames.length} teams)`}
            </button>
          </div>

          {/* Start Game Controls */}
          <div className="terminal-card space-y-3">
            <div className="terminal-header">Start Game</div>
            {createdRoomId && (
              <div className="text-terminal-green text-xs border border-terminal-green/30 rounded px-2 py-1">
                Room ready:{" "}
                <span className="font-mono">{createdRoomId.slice(-8)}...</span>
              </div>
            )}
            <div>
              <label className="text-terminal-muted text-xs block mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="terminal-input"
                id="duration-minutes"
              />
            </div>
            <button
              onClick={startRoom}
              disabled={loading || (!createdRoomId && !activeRoomId)}
              className="btn-primary w-full disabled:opacity-30"
            >
              {loading ? "STARTING..." : "▶ START GAME"}
            </button>
          </div>

          {/* Message */}
          {msg && (
            <div
              className={`px-4 py-2 rounded border text-xs ${
                msg.startsWith("✓")
                  ? "border-terminal-green text-terminal-green bg-green-950/20"
                  : "border-terminal-red text-terminal-red bg-red-950/20"
              }`}
            >
              {msg}
            </div>
          )}

          {/* Active room input */}
          <div className="terminal-card">
            <div className="terminal-header">View Leaderboard</div>
            <input
              type="text"
              className="terminal-input text-xs"
              placeholder="Paste Room ID..."
              value={activeRoomId}
              onChange={(e) => setActiveRoomId(e.target.value)}
              id="room-id-input"
            />
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
              <div className="terminal-header">Leaderboard (Active Room)</div>
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
                        className={`border-b border-terminal-border/30 ${
                          t.status === "success"
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
                          className={`px-2 py-2 font-mono ${
                            t.status === "success"
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
