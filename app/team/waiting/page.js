"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function WaitingPage() {
  const router = useRouter();
  const [dots, setDots] = useState("");
  const [teamName, setTeamName] = useState("");

  useEffect(() => {
    // Animate dots
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);

    // Fetch identity once
    fetch("/api/team/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.teamName) setTeamName(d.teamName);
      })
      .catch(() => {});

    // Poll every 10 seconds
    const poll = async () => {
      try {
        const res = await fetch("/api/team/state");
        if (res.status === 401) {
          router.push("/team/login");
          return;
        }
        const data = await res.json();
        if (data.status === "playing" || data.shouldRedirect === "/team/game") {
          router.push("/team/game");
        } else if (data.status === "success") {
          router.push("/team/success");
        } else if (data.status === "caught") {
          router.push("/team/caught");
        }
      } catch {
        /* network hiccup, retry next poll */
      }
    };

    poll(); // immediate first check
    const pollInterval = setInterval(poll, 1000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(pollInterval);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="terminal-card w-full max-w-2xl text-center">
         {/* ASCII Logo */}
         <div className="w-full flex justify-center overflow-hidden mb-6">
           <pre className="text-terminal-green text-xs leading-tight glow-text hidden sm:block inline-block">{`
██████╗  █████╗ ██████╗  █████╗  █████╗ ██╗     ██╗      █████╗ ██╗  ██╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██║     ██║     ██╔══██╗╚██╗██╔╝
██████╔╝███████║██████╔╝███████║███████║██║     ██║     ███████║ ╚███╔╝ 
██╔═══╝ ██╔══██║██╔══██╗██╔══██║██╔══██║██║     ██║     ██╔══██║ ██╔██╗ 
██║     ██║  ██║██║  ██║██║  ██║██║  ██║███████╗███████╗██║  ██║██╔╝ ██╗
╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝`}</pre>
         </div>

        <div className="text-terminal-green text-2xl font-bold glow-text mb-1 sm:hidden w-full text-center">
          PARAALLAX
        </div>

        <div className="border border-terminal-border rounded p-6 mb-6 bg-black/40">
          <div className="text-terminal-amber text-lg uppercase tracking-widest mb-3">
            ⏳ Waiting for Admin to Start Game{dots}
          </div>
          {teamName && (
            <div className="text-terminal-muted text-sm">
              TEAM: <span className="text-terminal-green font-bold">{teamName}</span>
            </div>
          )}
        </div>

        <div className="text-terminal-muted text-xs space-y-1">
          <div>► Do NOT refresh or close this tab</div>
          <div>► You will be redirected automatically when the game starts</div>
          <div>► System tracking enabled</div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-terminal-muted text-xs">
          <span className="animate-spin inline-block">◌</span>
          <span>SYSTEM MONITORING...</span>
        </div>
      </div>
    </main>
  );
}
