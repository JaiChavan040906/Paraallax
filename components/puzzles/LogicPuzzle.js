'use client';

import { useState } from 'react';

export default function LogicPuzzle({ puzzle, onSubmit, submitting }) {
    const [selected, setSelected] = useState('');

    const options = puzzle.uiConfig?.options || [];

    return (
        <div className="space-y-3">
            <div className="text-terminal-muted text-xs uppercase tracking-wider mb-3">
                Select the correct answer:
            </div>
            {options.map((opt, idx) => (
                <label
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition-all ${selected === opt.value
                            ? 'border-terminal-green bg-green-950/30 text-terminal-green'
                            : 'border-terminal-border text-terminal-text hover:border-terminal-dimgreen'
                        }`}
                >
                    <input
                        type="radio"
                        name="logic-option"
                        value={opt.value}
                        checked={selected === opt.value}
                        onChange={() => setSelected(opt.value)}
                        className="accent-terminal-green"
                    />
                    <span className="text-sm">{opt.label}</span>
                </label>
            ))}
            <button
                onClick={() => selected && onSubmit(selected)}
                disabled={!selected || submitting}
                className="btn-primary mt-4 w-full disabled:opacity-30"
            >
                {submitting ? 'SUBMITTING...' : '> SUBMIT ANSWER'}
            </button>
        </div>
    );
}
