"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Game2Handshake.module.css';

// Function to dynamically generate codes that satisfy exactly 0 or 1 conditions.
const generateCodeForSet = () => {
    let hexVal;
    let codeStr;
    let actionA = false;
    let actionS = false;

    do {
        hexVal = Math.floor(Math.random() * 256);
        codeStr = '0x' + hexVal.toString(16).toUpperCase().padStart(2, '0');
        actionA = false;
        actionS = false;

        // Set 1 (Alpha):
        // A: Decimal is multiple of 7
        // S: Hex string contains 'C' or 'D'
        if (hexVal % 7 === 0) actionA = true;
        if (codeStr.includes('C') || codeStr.includes('D')) actionS = true;
    } while (actionA && actionS);

    let correctAction = 'IGNORE';
    if (actionA) correctAction = 'A';
    if (actionS) correctAction = 'S';

    return { code: codeStr, correctAction };
};


const TARGET_SCORE = 10;
const CYCLE_TIME_MS = 2500;

export default function Game2Set1({ puzzle, onSubmit, submitting }) {
    
    const [logs, setLogs] = useState([]);
    const [progress, setProgress] = useState(0);
    const [flashState, setFlashState] = useState('none');
    const [isGameActive, setIsGameActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const logsRef = useRef(logs);
    const progressRef = useRef(progress);
    const isGameActiveRef = useRef(isGameActive);
    const currentEntryIdRef = useRef(0);
    const timerRef = useRef(null);

    // Sync refs
    useEffect(() => { logsRef.current = logs; }, [logs]);
    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { isGameActiveRef.current = isGameActive; }, [isGameActive]);

    const triggerFlash = (type) => {
        setFlashState(type);
        setTimeout(() => setFlashState('none'), 300);
    };

    const handleFailure = useCallback(() => {
        triggerFlash('error');
        setProgress(Math.max(0, progressRef.current - 2)); // Punish by -2 instead of full reset
        // Mark the active one as missed if it was pending
        setLogs(prev => prev.map((log, idx) =>
            idx === prev.length - 1 && log.status === 'pending'
                ? { ...log, status: 'missed' }
                : log
        ));
    }, []);

    const spawnNewCode = useCallback(() => {
        if (!isGameActiveRef.current) return;

        const currentLogs = logsRef.current;
        if (currentLogs.length > 0) {
            const lastLog = currentLogs[currentLogs.length - 1];
            if (lastLog.status === 'pending') {
                // User did not act in time — always a failure, even for IGNORE codes
                handleFailure();
            }
        }

        const newDef = generateCodeForSet();
        const newEntry = {
            id: currentEntryIdRef.current++,
            codeDef: newDef,
            status: 'pending'
        };

        setLogs(prev => {
            const maxLogs = 5;
            const newLogs = [...prev, newEntry];
            if (newLogs.length > maxLogs) return newLogs.slice(newLogs.length - maxLogs);
            return newLogs;
        });

    }, [handleFailure]);

    const startGame = () => {
        setIsGameActive(true);
        setIsComplete(false);
        setProgress(0);
        setLogs([]);
        currentEntryIdRef.current = 0;
        setFlashState('none');
    };

    useEffect(() => {
        if (isGameActive) {
            spawnNewCode(); // initial spawn
            timerRef.current = setInterval(spawnNewCode, CYCLE_TIME_MS);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isGameActive, spawnNewCode]);

    const handleAction = useCallback((action) => {
        if (!isGameActive) return;

        const currentLogs = logsRef.current;
        if (currentLogs.length === 0) return;

        const lastLog = currentLogs[currentLogs.length - 1];

        // Prevent double actions
        if (lastLog.status !== 'pending') return;

        if (action === lastLog.codeDef.correctAction) {
            const newProgress = progressRef.current + 1;
            setProgress(newProgress);
            triggerFlash('success');
            setLogs(prev => prev.map(l => l.id === lastLog.id ? { ...l, status: 'correct' } : l));

            if (newProgress >= TARGET_SCORE) {
                setIsGameActive(false);
                setIsComplete(true);
            }
        } else {
            handleFailure();
            setLogs(prev => prev.map(l => l.id === lastLog.id ? { ...l, status: 'incorrect' } : l));
        }
    }, [isGameActive, handleFailure]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isGameActive) return;
            const key = e.key.toLowerCase();
            if (key === 'a') handleAction('A');
            if (key === 's') handleAction('S');
            if (key === 'i') handleAction('IGNORE');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGameActive, handleAction]);

    
    return (
        <div className={`${styles.container} ${flashState === 'error' ? styles.shakeError : ''}`}>

            <div className={`${styles.screenBorder} ${styles[flashState]}`}>
                <div className={styles.terminalHeader}>
                    <h2>THE HANDSHAKE PROXY</h2>
                    <div className={styles.status}>
                        PROTOCOL ALPHA | STATUS: {isComplete ? <span className={styles.statusSuccess}>VERIFIED</span> : isGameActive ? <span className={styles.statusActive}>INTERCEPTING</span> : <span className={styles.statusIdle}>STANDBY</span>}
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
                            <button className={styles.successBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>{submitting ? 'SUBMITTING...' : 'PROCEED TO SECTOR 3'}</button>
                        </div>
                    )}

                    <div className={styles.logContainer}>
                        {logs.map((log, index) => {
                            const isOldest = index === 0 && logs.length > 4;
                            const isLatest = index === logs.length - 1;

                            let statusIcon = '...';
                            let rowClass = '';

                            if (log.status === 'correct') { statusIcon = '[OK]'; rowClass = styles.logSuccess; }
                            if (log.status === 'incorrect' || log.status === 'missed') { statusIcon = '[ERR]'; rowClass = styles.logError; }

                            return (
                                <div
                                    key={log.id}
                                    className={`${styles.logEntry} ${isOldest ? styles.fadeOut : ''} ${rowClass} ${isLatest && log.status === 'pending' ? styles.activeLog : ''}`}
                                >
                                    <span className={styles.logTimestamp}>{'>'} SYNC_{log.id.toString().padStart(4, '0')}</span>
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
