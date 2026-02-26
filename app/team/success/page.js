export default function SuccessPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="terminal-card w-full max-w-2xl text-center">
                <pre className="text-terminal-green text-xs leading-tight mb-6 glow-text overflow-x-auto">{`
  ██████╗ ██████╗ ███╗   ███╗██████╗ ██╗     ███████╗████████╗███████╗
 ██╔════╝██╔═══██╗████╗ ████║██╔══██╗██║     ██╔════╝╚══██╔══╝██╔════╝
 ██║     ██║   ██║██╔████╔██║██████╔╝██║     █████╗     ██║   █████╗  
 ██║     ██║   ██║██║╚██╔╝██║██╔═══╝ ██║     ██╔══╝     ██║   ██╔══╝  
 ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║     ███████╗███████╗   ██║   ███████╗
  ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚══════╝╚══════╝   ╚═╝   ╚══════╝`}</pre>

                <div className="border border-terminal-green rounded p-6 mb-6 bg-green-950/20">
                    <div className="text-terminal-green text-3xl font-bold glow-text mb-3">
                        ✓ MISSION ACCOMPLISHED
                    </div>
                    <div className="text-terminal-text text-sm leading-relaxed">
                        All puzzles solved. Your team has breached the system.<br />
                        Report to the admin desk immediately.
                    </div>
                </div>

                <div className="text-terminal-muted text-xs space-y-1">
                    <div>► Notify the invigilator at once</div>
                    <div>► Do NOT close this tab</div>
                    <div>► Time has been recorded</div>
                </div>

                <div className="mt-6 flex justify-center gap-2 text-terminal-green text-xs animate-pulse">
                    <span>▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓</span>
                    <span>100%</span>
                </div>
            </div>
        </main>
    );
}
