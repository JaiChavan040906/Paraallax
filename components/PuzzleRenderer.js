'use client';

import { useState } from 'react';
import LogicPuzzle from '@/components/puzzles/LogicPuzzle';
import HandshakePuzzle from '@/components/puzzles/HandshakePuzzle';
import SchemaPuzzle from '@/components/puzzles/SchemaPuzzle';

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
        case 'logic':
            return <LogicPuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'handshake':
            return <HandshakePuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        case 'schema':
            return <SchemaPuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
        default:
            // Extensible: add new types here as new cases
            return <FallbackPuzzle puzzle={puzzle} onSubmit={onSubmit} submitting={submitting} />;
    }
}
