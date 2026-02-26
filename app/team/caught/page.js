export default function CaughtPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="terminal-card w-full max-w-2xl text-center border-terminal-red">
                <pre className="text-terminal-red text-xs leading-tight mb-6 overflow-x-auto" style={{ textShadow: '0 0 10px #ff3131' }}>{`
  ██████╗ ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗████████╗
 ██╔════╝██╔═══██╗██║   ██║██╔════╝ ██║  ██║╚══██╔══╝
 ██║     ███████║██║   ██║██║  ███╗███████║   ██║   
 ██║     ██╔══██║██║   ██║██║   ██║██╔══██║   ██║   
 ╚██████╗██║  ██║╚██████╔╝╚██████╔╝██║  ██║   ██║   
  ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝   ╚═╝  `}</pre>

                <div className="border border-terminal-red rounded p-6 mb-6 bg-red-950/20">
                    <div className="text-terminal-red text-3xl font-bold mb-3" style={{ textShadow: '0 0 10px #ff3131' }}>
                        ✗ TIME EXPIRED — CAUGHT
                    </div>
                    <div className="text-terminal-text text-sm leading-relaxed">
                        Your time ran out before all puzzles were solved.<br />
                        The system has flagged your team. Await further instructions.
                    </div>
                </div>

                <div className="text-terminal-muted text-xs space-y-1">
                    <div>► Do NOT close this tab</div>
                    <div>► Wait for the invigilator</div>
                    <div>► Game over</div>
                </div>

                <div className="mt-6 text-terminal-red text-xs animate-pulse">
                    ▸ ACCESS TERMINATED ◂
                </div>
            </div>
        </main>
    );
}
