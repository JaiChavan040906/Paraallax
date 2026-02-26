'use client';

import { useState } from 'react';

export default function SchemaPuzzle({ puzzle, onSubmit, submitting }) {
    const [answer, setAnswer] = useState('');
    const tables = puzzle.uiConfig?.tables || [];
    const inputType = puzzle.uiConfig?.inputType || 'text'; // 'text' or 'select'
    const selectOptions = puzzle.uiConfig?.options || [];

    return (
        <div className="space-y-4">
            {/* Render tables */}
            {tables.map((table, tIdx) => (
                <div key={tIdx} className="border border-terminal-border rounded overflow-hidden">
                    <div className="bg-terminal-border/30 px-3 py-1 text-terminal-amber text-xs font-bold uppercase tracking-wider">
                        TABLE: {table.name}
                    </div>
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-terminal-border">
                                <th className="px-3 py-2 text-left text-terminal-muted font-normal">Column</th>
                                <th className="px-3 py-2 text-left text-terminal-muted font-normal">Type</th>
                                <th className="px-3 py-2 text-left text-terminal-muted font-normal">Constraints</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(table.columns || []).map((col, cIdx) => (
                                <tr key={cIdx} className="border-b border-terminal-border/40 hover:bg-terminal-border/10">
                                    <td className="px-3 py-2 text-terminal-green font-mono">{col.name}</td>
                                    <td className="px-3 py-2 text-terminal-text">{col.type}</td>
                                    <td className="px-3 py-2 text-terminal-amber text-xs">{col.constraints || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* Answer input */}
            <div className="mt-4">
                <div className="text-terminal-muted text-xs uppercase tracking-wider mb-2">
                    {puzzle.uiConfig?.question || 'Enter your answer:'}
                </div>
                {inputType === 'select' ? (
                    <select
                        className="terminal-input"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    >
                        <option value="">-- Select --</option>
                        {selectOptions.map((opt, i) => (
                            <option key={i} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type="text"
                        className="terminal-input"
                        placeholder="Type your answer..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && answer.trim() && onSubmit(answer.trim())}
                    />
                )}
            </div>

            <button
                onClick={() => answer.trim() && onSubmit(answer.trim())}
                disabled={!answer.trim() || submitting}
                className="btn-primary w-full disabled:opacity-30"
            >
                {submitting ? 'SUBMITTING...' : '> SUBMIT ANSWER'}
            </button>
        </div>
    );
}
