'use client';

import { useState } from 'react';
import Game1PowerGrid from '@/components/puzzles/Game1PowerGrid';
import Game2Handshake from '@/components/puzzles/Game2Handshake';
import Game3DatabaseSchema from '@/components/puzzles/Game3DatabaseSchema';
import Game4Firewall from '@/components/puzzles/Game4Firewall';
import Game5Decryption from '@/components/puzzles/Game5Decryption';

// Fallback for unknown/future puzzle types — plain text input
function FallbackPuzzle({ puzzle, onSubmit, submitting }) {
    const [val, setVal] = useState('');
    return (
        <div className="space-y-3">
            <div className="text-terminal-muted text-xs uppercase tracking-wider mb-2">Enter your answer:</div>
            <input
                type="text"
                className="terminal-input"
                placeholder="Type your answer..."
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && val.trim() && onSubmit(val.trim())}
            />
            <button
                onClick={() => val.trim() && onSubmit(val.trim())}
                disabled={!val.trim() || submitting}
                className="btn-primary w-full disabled:opacity-30"
            >
                {submitting ? 'SUBMITTING...' : '> SUBMIT ANSWER'}
            </button>
        </div>
    );
}

export default function PuzzleRenderer({ puzzle, onSubmit, submitting }) {
    if (!puzzle) return <div className="text-terminal-muted text-sm">No puzzle loaded.</div>;

    switch (puzzle.type) {
        case 'game1':
        case 'powergrid':
            return <Game1PowerGrid puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'game2':
        case 'handshake':
            return <Game2Handshake puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'game3':
        case 'schema':
            return <Game3DatabaseSchema puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'game4':
        case 'firewall':
            return <Game4Firewall puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'game5':
        case 'decryption':
            return <Game5Decryption puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        default:
            return <FallbackPuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
    }
}
