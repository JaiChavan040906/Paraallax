'use client';

import { useState } from 'react';

export default function HandshakePuzzle({ puzzle, onSubmit, submitting }) {
    const [selected, setSelected] = useState('');
    const actions = puzzle.uiConfig?.actions || ['A', 'S', 'IGNORE'];

    const colorMap = {
        A: 'border-terminal-green text-terminal-green hover:bg-green-950/40',
        S: 'border-terminal-amber text-terminal-amber hover:bg-amber-950/40',
        IGNORE: 'border-terminal-muted text-terminal-muted hover:bg-gray-900/40',
    };

    return (
        <div className="space-y-4">
            <div className="text-terminal-muted text-xs uppercase tracking-wider mb-3">
                Choose your response action:
            </div>
            <div className="grid grid-cols-3 gap-3">
                {actions.map((action) => (
                    <button
                        key={action}
                        onClick={() => setSelected(action)}
                        className={`p-4 rounded border text-sm font-bold uppercase tracking-wider transition-all ${selected === action
                                ? 'bg-terminal-green text-black border-terminal-green'
                                : colorMap[action] || 'border-terminal-border text-terminal-text hover:border-terminal-dimgreen'
                            }`}
                    >
                        {action}
                    </button>
                ))}
            </div>

            {selected && (
                <div className="text-terminal-muted text-xs mt-2">
                    Selected: <span className="text-terminal-green font-bold">{selected}</span>
                </div>
            )}

            <button
                onClick={() => selected && onSubmit(selected)}
                disabled={!selected || submitting}
                className="btn-primary mt-2 w-full disabled:opacity-30"
            >
                {submitting ? 'SUBMITTING...' : '> CONFIRM ACTION'}
            </button>
        </div>
    );
}
