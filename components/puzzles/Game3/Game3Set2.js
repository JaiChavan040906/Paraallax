"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Game3DatabaseSchema.module.css';


export default function Game3Set2({ puzzle, onSubmit, submitting }) {
    const narrative = {
        prompt: "Maintenance drone routing error on Floor 4. Need maintenance protocol ID.",
        expectedQuery: "select protocol_id from maintenance_logs where floor = 4;",
        successData: ["1 ROW(S) RETURNED:", "PROTOCOL_ID: MX-880-BETA"]
    };

    const [lines, setLines] = useState([
        { id: 1, text: "PARALLAX MAINFRAME OS v3.11", type: "system" },
        { id: 2, text: "LOGIN FAILED. DATABASE CORRUPTION DETECTED.", type: "error" },
        { id: 3, text: "EMERGENCY OVERRIDE CONSOLE ACTIVE.", type: "system" },
        { id: 4, text: `INCIDENT REPORT: ${narrative.prompt}`, type: "system" },
    ]);
    const [currentInput, setCurrentInput] = useState('');
    const [isComplete, setIsComplete] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const lineIdRef = useRef(5);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    // Keep focus on input
    useEffect(() => {
        const handleGlobalClick = () => {
            if (!isComplete && window.getSelection()?.toString() === '') {
                inputRef.current?.focus();
            }
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [isComplete]);

    const printLine = (text, type = 'output') => {
        setLines(prev => [...prev, { id: lineIdRef.current++, text, type }]);
    };

    const handleQuery = (query) => {
        const q = query.trim();
        if (!q) return;

        printLine(`> ${q}`, 'input');

        // Normalize spaces and quotes for matching
        const normalizedInput = q.toLowerCase().replace(/\s+/g, ' ').replace(/'/g, '"').trim();
        const expected = narrative.expectedQuery.toLowerCase().replace(/\s+/g, ' ').replace(/'/g, '"').trim();

        // Exact match checking
        if (normalizedInput === expected) {
            printLine("Executing query...", "system");
            setTimeout(() => {
                narrative.successData.forEach(line => printLine(line, "output"));
                printLine("DATA RETRIEVED. ACCESS GRANTED", "success");
                setIsComplete(true);
            }, 800);
            return;
        }

        // Basic generic feedback
        if (!normalizedInput.includes("select ") || !normalizedInput.includes("from ")) {
            printLine("ERROR 1064: You have an error in your SQL syntax.", "error");
            fetch("/api/team/add-penalty", { method: "POST" });
            return;
        }

        if (!normalizedInput.endsWith(";")) {
            printLine(`ERROR: Syntax error near '${q.substring(0, 10)}...'`, "error");
            fetch("/api/team/add-penalty", { method: "POST" });
            return;
        }

        printLine("ERROR 0000: QUERY EXECUTED BUT RETURNED NO MATCHING INCIDENT DATA.", "error");
        fetch("/api/team/add-penalty", { method: "POST" });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isComplete) return;
        handleQuery(currentInput);
        setCurrentInput('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.crtOverlay} />
            <div className={styles.scanlines} />

            <div className={`${styles.terminalContent} ${isComplete ? styles.successGlow : ''}`}>
                <div className={styles.outputArea}>
                    {lines.map(line => (
                        <div key={line.id} className={`${styles.line} ${styles[line.type]}`}>
                            {line.type === 'success' && (
                                <pre className={styles.asciiArt}>
                                    {`
    ___   ____________  ______________
   /   | / ____/ ____/ / ____/ ___/ ___/
  / /| |/ /   / /     / __/  \\__ \\\\__ \\
 / ___ / /___/ /___  / /___ ___/ /__/ /
/_/  |_\\____/\\____/ /_____//____/____/
`}
                                </pre>
                            )}
                            {line.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {!isComplete ? (
                    <form className={styles.inputArea} onSubmit={handleSubmit}>
                        <span className={styles.prompt}>{'>'}</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentInput}
                            onChange={(e) => setCurrentInput(e.target.value)}
                            className={styles.textInput}
                            autoFocus
                            spellCheck={false}
                            autoComplete="off"
                        />
                        <div className={styles.cursor} />
                    </form>
                ) : (
                    <div className={styles.completeActions}>
                        <button className={styles.proceedBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>
                            {submitting ? 'SUBMITTING...' : 'SUBMIT DATABASE LOGS'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
