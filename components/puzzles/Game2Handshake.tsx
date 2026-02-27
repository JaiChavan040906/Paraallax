"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Game2Handshake.module.css';

interface Game2HandshakeProps {
    onComplete: () => void;
}

type ActionType = 'A' | 'S' | 'IGNORE';

interface HexCodeDef {
    code: string;
    correctAction: ActionType;
}

const HEX_POOL: HexCodeDef[] = [
    // Ends in a letter -> Action A
    { code: '0x4A', correctAction: 'A' },
    { code: '0x9C', correctAction: 'A' },
    { code: '0x8E', correctAction: 'A' },
    { code: '0x2B', correctAction: 'A' },

    // Is a prime number (7, 11, 13, 83) -> Action S
    { code: '0x07', correctAction: 'S' },
    { code: '0x11', correctAction: 'S' },
    { code: '0x13', correctAction: 'S' },
    { code: '0x83', correctAction: 'S' },

    // Neither -> Ignore
    { code: '0x24', correctAction: 'IGNORE' },
    { code: '0x88', correctAction: 'IGNORE' },
    { code: '0x40', correctAction: 'IGNORE' },
    { code: '0x18', correctAction: 'IGNORE' },
];

interface LogEntry {
    id: number;
    codeDef: HexCodeDef;
    status: 'pending' | 'correct' | 'incorrect' | 'missed';
}

const TARGET_SCORE = 5;
const CYCLE_TIME_MS = 1500;

export default function Game2Handshake({ onComplete }: Game2HandshakeProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [progress, setProgress] = useState(0);
    const [flashState, setFlashState] = useState<'none' | 'success' | 'error'>('none');
    const [isGameActive, setIsGameActive] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

    const logsRef = useRef(logs);
    const progressRef = useRef(progress);
    const isGameActiveRef = useRef(isGameActive);
    const currentEntryIdRef = useRef<number>(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Sync refs
    useEffect(() => { logsRef.current = logs; }, [logs]);
    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { isGameActiveRef.current = isGameActive; }, [isGameActive]);

    const triggerFlash = (type: 'success' | 'error') => {
        setFlashState(type);
        setTimeout(() => setFlashState('none'), 300);
    };

    const handleFailure = useCallback(() => {
        triggerFlash('error');
        setProgress(0);
        // Mark the active one as missed if it was pending
        setLogs(prev => prev.map((log, idx) =>
            idx === prev.length - 1 && log.status === 'pending'
                ? { ...log, status: 'missed' }
                : log
        ));
    }, []);

    const spawnNewCode = useCallback(() => {
        if (!isGameActiveRef.current) return;

        // Check if previous was ignored correctly
        const currentLogs = logsRef.current;
        if (currentLogs.length > 0) {
            const lastLog = currentLogs[currentLogs.length - 1];
            if (lastLog.status === 'pending') {
                if (lastLog.codeDef.correctAction === 'IGNORE') {
                    // Successfully ignored
                    const newProgress = progressRef.current + 1;
                    setProgress(newProgress);
                    triggerFlash('success');
                    setLogs(prev => prev.map(l => l.id === lastLog.id ? { ...l, status: 'correct' } : l));
                    if (newProgress >= TARGET_SCORE) {
                        setIsGameActive(false);
                        setIsComplete(true);
                        return; // Stop spawning
                    }
                } else {
                    // Failed to act when action was required
                    handleFailure();
                }
            }
        }

        const randomDef = HEX_POOL[Math.floor(Math.random() * HEX_POOL.length)];
        const newEntry: LogEntry = {
            id: currentEntryIdRef.current++,
            codeDef: randomDef,
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

    const handleAction = useCallback((action: ActionType) => {
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isGameActive) return;
            const key = e.key.toLowerCase();
            if (key === 'a') handleAction('A');
            if (key === 's') handleAction('S');
            // optionally bind 'd' or space to ignore, though ignoring is passive. Let's bind 'space' to explicitly ignore to force next turn early (optional, but requested passive ignore is better). 
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
                        STATUS: {isComplete ? <span className={styles.statusSuccess}>VERIFIED</span> : isGameActive ? <span className={styles.statusActive}>INTERCEPTING</span> : <span className={styles.statusIdle}>STANDBY</span>}
                    </div>
                </div>

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarBg}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${(progress / TARGET_SCORE) * 100}%` }}
                        />
                    </div>
                    <div className={styles.progressText}>{progress} / {TARGET_SCORE} SIGNATURES</div>
                </div>

                <div className={styles.terminalWindow}>
                    {!isGameActive && !isComplete && (
                        <div className={styles.startOverlay}>
                            <p>Intercept incoming hex sequences.</p>
                            <ul className={styles.rulesList}>
                                <li>Ends in Letter: <strong>ACTION A</strong> [Key A]</li>
                                <li>Is Prime / Ends in Digit: <strong>ACTION S</strong> [Key S]</li>
                                <li>Otherwise: <strong>IGNORE</strong> (Wait 1.5s)</li>
                            </ul>
                            <button className={styles.startBtn} onClick={startGame}>INITIATE HANDSHAKE</button>
                        </div>
                    )}

                    {isComplete && (
                        <div className={styles.completeOverlay}>
                            <h3>ACCESS GRANTED</h3>
                            <button className={styles.successBtn} onClick={onComplete}>PROCEED TO SECTOR 3</button>
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
                <div className={styles.ignoreIndicator}>
                    <div className={styles.ignoreLabel}>IGNORE</div>
                    <div className={styles.ignoreDesc}>(Do nothing)</div>
                </div>
            </div>

        </div>
    );
}
