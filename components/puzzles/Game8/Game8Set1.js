"use client";

import React, { useState } from 'react';

const PACKETS = [
    { id: 'PKG-001', data: '8A 7B 1A 7B 1A 2D 1A 1A 5C 6A', valid: true },
    { id: 'PKG-002', data: '3A 7B 1A 7B 1A 0A 1A 1A 5C 4A', valid: true },
    { id: 'PKG-003', data: '1A 1A 5C 2A 7B 1A 7B 1A 9A 4B', valid: true },
    { id: 'PKG-004', data: '2F 7B 1A 2D 1A 7B 3A 1A 1A 5C', valid: false }, // Rule 4 violation
    { id: 'PKG-005', data: '0A 2A 1A 1A 5C 7B 1A 7B 1A 8A', valid: true },
    { id: 'PKG-006', data: '8A 7B 1A 7B 1A 2D 1A 1A 6A 5C', valid: false }, // Rule 2 violation
    { id: 'PKG-007', data: '8A 1A 1A 5C 7B 1A 7B 1A 0A 2A', valid: true },
    { id: 'PKG-008', data: '1A 7B 1A 7B 3A 4A 1A 1A 5C 9B', valid: true },
    { id: 'PKG-009', data: '8A 7B 1A 7B 1A 7B 1A 1A 5C 2D', valid: false }, // Rule 6 violation
    { id: 'PKG-010', data: '2F 1A 7B 1A 7B 1A 1A 5C 3A 4A', valid: true },
];

export default function Game8Set1({ puzzle, onSubmit, submitting }) {
    const [selected, setSelected] = useState(new Set());
    const [status, setStatus] = useState('inspecting'); // inspecting, success, error
    const [hasTriggeredPenalty, setHasTriggeredPenalty] = useState(false);

    const handleToggle = (id) => {
        if (status === 'success') return; // Cannot edit after success
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
        if (status === 'error') {
            setStatus('inspecting');
        }
    };

    const handleProcess = () => {
        const infectedIds = PACKETS.filter(p => !p.valid).map(p => p.id);
        
        // Find infected packets that were NOT quarantined
        const missedInfected = infectedIds.filter(id => !selected.has(id));
        
        // Find safe packets that WERE quarantined
        const wronglyQuarantined = PACKETS.filter(p => p.valid && selected.has(p.id));

        if (missedInfected.length > 0 || wronglyQuarantined.length > 0) {
            setStatus('error');
            if (missedInfected.length > 0 && !hasTriggeredPenalty) {
                setHasTriggeredPenalty(true);
                // Trigger 3 min penalty API
                fetch('/api/team/add-penalty', { method: 'POST' });
            }
        } else {
            setStatus('success');
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 bg-terminal-bg text-terminal-green font-mono rounded border border-terminal-border relative shadow-glow">
            
            <div className="flex justify-between items-center border-b border-terminal-border pb-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider animate-pulse-green">H.I.P.S. Interceptor</h1>
                    <div className="text-terminal-muted text-xs md:text-sm mt-1">Heuristic Intrusion Prevention System - OVERRIDE MODE</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-terminal-amber">CONNECTION SECURE</div>
                    <div className="text-[10px] opacity-70">PORT 8089 - LIVE</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Protocol Rules Panel */}
                <div className="col-span-1 md:col-span-1 border border-terminal-muted bg-[#0c160c] p-4 rounded h-fit">
                    <h2 className="text-lg font-bold border-b border-terminal-muted pb-2 mb-4 text-terminal-amber">INSPECTION PROTOCOL</h2>
                    <p className="text-xs mb-4 text-gray-400">
                        Scan the incoming packets. Quarantine (select) packets violating ANY of the firewall rules below. Click PROCESS to filter.
                    </p>

                    <div className="mt-6 pt-4 border-t border-terminal-border">
                        <div className="text-xs text-terminal-red flex items-center gap-2 animate-flicker">
                            <span className="text-lg">⚠</span>
                            WARNING: LETTING AN INFECTED PACKET PASS RESULTS IN A 5-MINUTE GRID PENALTY.
                        </div>
                    </div>
                </div>

                {/* Packet Queue Panel */}
                <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
                    <h2 className="text-lg font-bold flex justify-between">
                        <span>INCOMING PACKET QUEUE</span>
                        <span className="text-terminal-muted text-sm">10 pending</span>
                    </h2>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {PACKETS.map((pkg, idx) => {
                            const isQuarantined = selected.has(pkg.id);
                            return (
                                <div 
                                    key={pkg.id}
                                    onClick={() => handleToggle(pkg.id)}
                                    className={`
                                        p-3 relative cursor-pointer font-mono text-sm transition-all duration-200 border
                                        ${isQuarantined 
                                            ? 'bg-red-950/40 border-terminal-red text-terminal-red shadow-glow-red' 
                                            : 'bg-terminal-surface border-terminal-border hover:border-terminal-green hover:bg-green-950/20'}
                                    `}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-xs ${isQuarantined ? 'text-terminal-red' : 'text-terminal-muted'}`}>
                                            [{pkg.id}]
                                        </span>
                                        <span className={`text-[10px] uppercase border px-1 rounded ${isQuarantined ? 'border-terminal-red text-terminal-red' : 'border-terminal-muted text-terminal-muted hidden'}`}>
                                            Quarantined
                                        </span>
                                    </div>
                                    <div className="tracking-widest flex flex-wrap gap-2">
                                        {pkg.data.split(' ').map((block, bIdx) => (
                                            <span key={bIdx} className={isQuarantined ? `opacity-70` : `opacity-100`}>
                                                {block}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute top-0 right-0 bottom-0 w-1 bg-terminal-green opacity-0 hover:opacity-100 transition-opacity"></div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1">
                            {status === 'error' && (
                                <div className="text-terminal-red font-bold text-sm bg-red-950/30 border border-terminal-red p-2 rounded animate-flicker">
                                    BREACH DETECTED: Invalid processing. The system has suffered damage!
                                </div>
                            )}
                            {status === 'success' && (
                                <div className="text-terminal-green font-bold text-sm bg-green-950/30 border border-terminal-green p-2 rounded shadow-glow">
                                    GRID SECURED. All threats eliminated.
                                </div>
                            )}
                        </div>
                        
                        {!status || status === 'inspecting' || status === 'error' ? (
                            <button 
                                onClick={handleProcess}
                                className="px-6 py-3 bg-terminal-surface border-2 border-terminal-amber text-terminal-amber font-bold hover:bg-terminal-amber hover:text-black transition-colors uppercase tracking-wider whitespace-nowrap"
                            >
                                Process Selection
                            </button>
                        ) : null}

                        {status === 'success' && (
                            <button 
                                disabled={submitting}
                                onClick={() => onSubmit("Solved")}
                                className="px-6 py-3 bg-terminal-green text-black font-bold hover:bg-[#00cc00] transition-colors uppercase tracking-wider whitespace-nowrap shadow-glow"
                            >
                                {submitting ? "SUBMITTING..." : "VERIFY & SUBMIT SECONDS"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #111; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4a7a4a; 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #00ff41; 
                }
            `}</style>
        </div>
    );
}
