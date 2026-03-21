"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Game2Handshake.module.css';

// Generate a code that satisfies exactly 0 or 1 conditions.
const generateCodeForSet = () => {
    let hexVal, codeStr, actionA, actionS;
    do {
        hexVal  = Math.floor(Math.random() * 256);
        codeStr = '0x' + hexVal.toString(16).toUpperCase().padStart(2, '0');
        actionA = hexVal % 7 === 0;
        actionS = codeStr.includes('C') || codeStr.includes('D');
    } while (actionA && actionS);

    let correctAction = 'IGNORE';
    if (actionA) correctAction = 'A';
    if (actionS) correctAction = 'S';

    return { code: codeStr, correctAction };
};

const TARGET_SCORE   = 10;
const CYCLE_TIME_MS  = 2500;

export default function Game2Set1({ puzzle, onSubmit, submitting }) {

    const [logs,         setLogs]         = useState([]);
    const [progress,     setProgress]     = useState(0);
    const [flashState,   setFlashState]   = useState('none');
    const [isGameActive, setIsGameActive] = useState(false);
    const [isComplete,   setIsComplete]   = useState(false);

    // ── Stable refs so callbacks never become stale ───────────────────────────
    const logsRef          = useRef([]);
    const progressRef      = useRef(0);
    const isGameActiveRef  = useRef(false);
    const isCompleteRef    = useRef(false);
    const currentEntryIdRef = useRef(0);
    const timerRef         = useRef(null);
    const penaltyCountRef  = useRef(0);   // replaces zeroScoreCount state

    // Keep refs in sync with state
    useEffect(() => { logsRef.current = logs; },               [logs]);
    useEffect(() => { progressRef.current = progress; },       [progress]);
    useEffect(() => { isGameActiveRef.current = isGameActive; }, [isGameActive]);
    useEffect(() => { isCompleteRef.current = isComplete; },   [isComplete]);

    // ── Stable flash helper ───────────────────────────────────────────────────
    const triggerFlash = useCallback((type) => {
        setFlashState(type);
        setTimeout(() => setFlashState('none'), 300);
    }, []);

    // ── Failure handler — reads refs so it never goes stale ──────────────────
    const handleFailure = useCallback(() => {
        triggerFlash('error');

        const prev     = progressRef.current;
        const newProg  = Math.max(0, prev - 2);
        progressRef.current = newProg;
        setProgress(newProg);

        if (prev > 0 && newProg === 0) {
            penaltyCountRef.current += 1;
            if (penaltyCountRef.current % 2 === 0) {
                fetch("/api/team/add-penalty", { method: "POST" });
            }
        }

        // Mark last pending log as missed
        setLogs(prev => prev.map((log, idx) =>
            idx === prev.length - 1 && log.status === 'pending'
                ? { ...log, status: 'missed' }
                : log
        ));
    }, [triggerFlash]);

    // ── Spawn a new code entry ────────────────────────────────────────────────
    const spawnNewCode = useCallback(() => {
        if (!isGameActiveRef.current) return;

        // If last code is still pending, the player missed it → failure
        const currentLogs = logsRef.current;
        if (currentLogs.length > 0) {
            const last = currentLogs[currentLogs.length - 1];
            if (last.status === 'pending') {
                handleFailure();
            }
        }

        const newDef   = generateCodeForSet();
        const newEntry = {
            id:      currentEntryIdRef.current++,
            codeDef: newDef,
            status:  'pending',
        };

        setLogs(prev => {
            const maxLogs = 5;
            const next    = [...prev, newEntry];
            return next.length > maxLogs ? next.slice(next.length - maxLogs) : next;
        });
    }, [handleFailure]);

    // ── Keep a stable ref to spawnNewCode for the interval ───────────────────
    const spawnRef = useRef(spawnNewCode);
    useEffect(() => { spawnRef.current = spawnNewCode; }, [spawnNewCode]);

    // ── Start / stop the spawn interval ──────────────────────────────────────
    useEffect(() => {
        if (isGameActive) {
            // Call immediately so first code shows at once
            spawnRef.current();
            timerRef.current = setInterval(() => spawnRef.current(), CYCLE_TIME_MS);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [isGameActive]); // only depends on isGameActive — stable

    // ── Start game ───────────────────────────────────────────────────────────
    const startGame = () => {
        penaltyCountRef.current     = 0;
        progressRef.current         = 0;
        logsRef.current             = [];
        currentEntryIdRef.current   = 0;
        setProgress(0);
        setLogs([]);
        setFlashState('none');
        setIsComplete(false);
        setIsGameActive(true);
    };

    // ── Player action ────────────────────────────────────────────────────────
    const handleAction = useCallback((action) => {
        if (!isGameActiveRef.current) return;

        const currentLogs = logsRef.current;
        if (currentLogs.length === 0) return;

        const lastLog = currentLogs[currentLogs.length - 1];
        if (lastLog.status !== 'pending') return;   // already actioned

        if (action === lastLog.codeDef.correctAction) {
            const newProgress = progressRef.current + 1;
            progressRef.current = newProgress;
            setProgress(newProgress);
            triggerFlash('success');
            setLogs(prev => prev.map(l =>
                l.id === lastLog.id ? { ...l, status: 'correct' } : l
            ));

            if (newProgress >= TARGET_SCORE) {
                isGameActiveRef.current = false;
                setIsGameActive(false);
                setIsComplete(true);
                setTimeout(() => onSubmit("Solved"), 2000);
            }
        } else {
            handleFailure();
            setLogs(prev => prev.map(l =>
                l.id === lastLog.id ? { ...l, status: 'incorrect' } : l
            ));
        }
    }, [triggerFlash, handleFailure, onSubmit]);

    // ── Keyboard controls ────────────────────────────────────────────────────
    useEffect(() => {
        const onKey = (e) => {
            if (!isGameActiveRef.current) return;
            const k = e.key.toLowerCase();
            if (k === 'a') handleAction('A');
            if (k === 's') handleAction('S');
            if (k === 'i') handleAction('IGNORE');
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleAction]);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className={`${styles.container} ${flashState === 'error' ? styles.shakeError : ''}`}>

            <div className={`${styles.screenBorder} ${styles[flashState]}`}>
                <div className={styles.terminalHeader}>
                    <h2>THE HANDSHAKE PROXY</h2>
                    <div className={styles.status}>
                        PROTOCOL ALPHA | STATUS:{' '}
                        {isComplete
                            ? <span className={styles.statusSuccess}>VERIFIED</span>
                            : isGameActive
                                ? <span className={styles.statusActive}>INTERCEPTING</span>
                                : <span className={styles.statusIdle}>STANDBY</span>}
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarBg}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${Math.max(0, (progress / TARGET_SCORE) * 100)}%` }}
                        />
                    </div>
                    <div className={styles.progressText}>{progress} / {TARGET_SCORE} SIGNATURES</div>
                </div>

                <div className={styles.terminalWindow}>
                    {!isGameActive && !isComplete && (
                        <div className={styles.startOverlay}>
                            <p>Intercept incoming hex sequences.</p>
                            <ul className={styles.rulesList}>
                                <li><strong>ACTION A</strong> [Key A]</li>
                                <li><strong>ACTION S</strong> [Key S]</li>
                                <li><strong>IGNORE</strong> — Press Ignore button [Key I]</li>
                            </ul>
                            <p className={styles.hint}>Consult Guide Manual for Protocol ALPHA logic.</p>
                            <button className={styles.startBtn} onClick={startGame}>INITIATE HANDSHAKE</button>
                        </div>
                    )}

                    {isComplete && (
                        <div className={styles.completeOverlay}>
                            <h3>ACCESS GRANTED</h3>
                            <div className="text-terminal-green animate-pulse mt-4">SUBMITTING INTERCEPT DATA...</div>
                        </div>
                    )}

                    <div className={styles.logContainer}>
                        {logs.map((log, index) => {
                            const isOldest = index === 0 && logs.length > 4;
                            const isLatest = index === logs.length - 1;

                            let statusIcon = '...';
                            let rowClass   = '';

                            if (log.status === 'correct') {
                                statusIcon = '[OK]';
                                rowClass   = styles.logSuccess;
                            }
                            if (log.status === 'incorrect' || log.status === 'missed') {
                                statusIcon = '[ERR]';
                                rowClass   = styles.logError;
                            }

                            return (
                                <div
                                    key={log.id}
                                    className={`${styles.logEntry} ${isOldest ? styles.fadeOut : ''} ${rowClass} ${isLatest && log.status === 'pending' ? styles.activeLog : ''}`}
                                >
                                    <span className={styles.logTimestamp}>{`> SYNC_${log.id.toString().padStart(4, '0')}`}</span>
                                    <span className={styles.logCode}>{log.codeDef.code}</span>
                                    <span className={styles.logStatus}>{statusIcon}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className={styles.controlsPanel}>
                <button
                    className={`${styles.arcadeBtn} ${styles.actionABtn}`}
                    onClick={() => handleAction('A')}
                    disabled={!isGameActive}
                >
                    <span className={styles.btnLabel}>ACTION A</span>
                    <span className={styles.btnShortcut}>[ A ]</span>
                </button>
                <button
                    className={`${styles.arcadeBtn} ${styles.actionSBtn}`}
                    onClick={() => handleAction('S')}
                    disabled={!isGameActive}
                >
                    <span className={styles.btnLabel}>ACTION S</span>
                    <span className={styles.btnShortcut}>[ S ]</span>
                </button>
                <button
                    className={`${styles.arcadeBtn} ${styles.ignoreBtn}`}
                    onClick={() => handleAction('IGNORE')}
                    disabled={!isGameActive}
                >
                    <span className={styles.btnLabel}>IGNORE</span>
                    <span className={styles.btnShortcut}>[ I ]</span>
                </button>
            </div>

        </div>
    );
}
