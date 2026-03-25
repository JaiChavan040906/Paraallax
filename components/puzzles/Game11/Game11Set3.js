"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Game11Set1.module.css';

// Set 3: QF-4 (0, -10). G-B-G on Ring 5 = Offset 14, Inverted. TL (Sub Pitch, Add Roll).
// Raw Pitch = 0 - 14 = -14. Raw Roll = -10 + 14 = 4. Inverted swap -> Pitch: 4, Roll: -14.
const CONFIG = {
    droneModel: 'QF-4',
    ring: 5, 
    quadrant: 2, // Top-Left
    ledPattern: ['#4ade80', '#3b82f6', '#4ade80'], // Green-Blue-Green
    requiredPolarity: true,
    requiredPitch: 4,
    requiredRoll: -14
};

export default function Game11Set3({ puzzle, onSubmit, submitting }) {
    // Calculate visual X/Y based on ring (radius 20px per ring) and quadrant (45 degree angle)
    const radius = CONFIG.ring * 20;
    const angle = 45 * (Math.PI / 180);
    let initX = 0;
    let initY = 0;
    
    // Quadrant 2: Top-Left
    initX = -(radius * Math.cos(angle)); 
    initY = -(radius * Math.sin(angle));

    const [pitch, setPitch] = useState(0);
    const [roll, setRoll] = useState(0);
    const [polarityInverted, setPolarityInverted] = useState(false);
    
    const [isSyncing, setIsSyncing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const syncTimeoutRef = useRef(null);

    const [dronePos, setDronePos] = useState({ x: initX, y: initY });

    const handleSyncStart = () => {
        setIsSyncing(true);
        syncTimeoutRef.current = setTimeout(() => {
            if (pitch === CONFIG.requiredPitch && roll === CONFIG.requiredRoll && polarityInverted === CONFIG.requiredPolarity) {
                setIsSuccess(true);
                setDronePos({ x: 0, y: 0 }); 
            } else {
                setDronePos({ 
                    x: initX + (Math.random() * 20 - 10), 
                    y: initY + (Math.random() * 20 - 10) 
                });
            }
            setIsSyncing(false);
        }, 3000);
    };

    const handleSyncEnd = () => {
        if (syncTimeoutRef.current && isSyncing) {
            clearTimeout(syncTimeoutRef.current);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
        };
    }, []);

    const DroneGraphic = ({ className = "" }) => (
        <svg viewBox="0 0 100 100" className={className}>
            <rect x="35" y="35" width="30" height="30" rx="5" fill="#555" stroke="#222" strokeWidth="2" />
            <circle cx="50" cy="50" r="10" fill="#0ff" className={styles.led} />
            <line x1="15" y1="15" x2="35" y2="35" stroke="#777" strokeWidth="4" />
            <line x1="85" y1="15" x2="65" y2="35" stroke="#777" strokeWidth="4" />
            <line x1="15" y1="85" x2="35" y2="65" stroke="#777" strokeWidth="4" />
            <line x1="85" y1="85" x2="65" y2="65" stroke="#777" strokeWidth="4" />
            <g className={styles.propeller} style={{ transformOrigin: '15px 15px' }}>
                <circle cx="15" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="10 5" />
            </g>
            <g className={styles.propeller} style={{ transformOrigin: '85px 15px' }}>
                <circle cx="85" cy="15" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="10 5" />
            </g>
            <g className={styles.propeller} style={{ transformOrigin: '15px 85px' }}>
                <circle cx="15" cy="85" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="10 5" />
            </g>
            <g className={styles.propeller} style={{ transformOrigin: '85px 85px' }}>
                <circle cx="85" cy="85" r="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="10 5" />
            </g>
        </svg>
    );

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>{puzzle?.title || "Broken Drone Calibration"}</h2>
                <div className={styles.badge}>UAV TELEMETRY 3</div>
            </div>

            <p className={styles.subtitle}>The drone is drifting erratically. Consult the UAV Field Repair Schematic to decode the LED errors and apply offset values. HOLD Sync for 3 seconds.</p>

            <div className={styles.hudContainer}>
                
                <div className={styles.droneRadar}>
                    <svg className={styles.crosshair} viewBox="0 0 200 200">
                        {[20, 40, 60, 80, 100].map((r, idx) => (
                            <React.Fragment key={r}>
                                <circle 
                                    cx="100" 
                                    cy="100" 
                                    r={r} 
                                    fill="none" 
                                    className={styles.crosshairLine} 
                                    strokeOpacity={(idx + 1) === CONFIG.ring ? 0.8 : 0.3}
                                    strokeWidth={(idx + 1) === CONFIG.ring ? 1.5 : 1}
                                />
                                <text x="105" y={100 - r + 5} fontSize="8" fill={(idx + 1) === CONFIG.ring ? "rgba(0, 255, 255, 0.8)" : "rgba(0, 255, 255, 0.3)"} fontFamily="monospace">{idx + 1}</text>
                            </React.Fragment>
                        ))}
                        <line x1="100" y1="0" x2="100" y2="200" className={styles.crosshairLine} />
                        <line x1="0" y1="100" x2="200" y2="100" className={styles.crosshairLine} />

                        <text x="180" y="20" fontSize="10" fill="rgba(0, 255, 255, 0.2)" fontFamily="monospace" textAnchor="middle">Q1</text>
                        <text x="20" y="20" fontSize="10" fill="rgba(0, 255, 255, 0.2)" fontFamily="monospace" textAnchor="middle">Q2</text>
                        <text x="20" y="180" fontSize="10" fill="rgba(0, 255, 255, 0.2)" fontFamily="monospace" textAnchor="middle">Q3</text>
                        <text x="180" y="180" fontSize="10" fill="rgba(0, 255, 255, 0.2)" fontFamily="monospace" textAnchor="middle">Q4</text>
                    </svg>
                    
                    <div 
                        className={styles.droneIcon} 
                        style={{ 
                            transform: `translate(calc(-50% + ${dronePos.x}px), calc(-50% + ${dronePos.y}px))` 
                        }}
                    >
                        <DroneGraphic />
                    </div>
                </div>

                <div className={styles.telemetryPanel}>
                    <div className={styles.telemetryHeader}>WARNING: DRFT DETECTED</div>
                    
                    <div className={styles.modelDisplay} style={{ marginBottom: '10px', fontWeight: 'bold', color: '#0ff' }}>
                        UAV MODEL: {CONFIG.droneModel}
                    </div>

                    <div className={styles.ringDisplay} style={{ marginBottom: '10px', color: 'rgba(0, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                        RADAR RING: {CONFIG.ring}
                    </div>

                    <div className={styles.ledStrip}>
                        DIAGNOSTIC LEDS:
                        {CONFIG.ledPattern.map((color, i) => (
                            <div key={i} className={styles.led} style={{ color, background: color, margin: '0 5px' }} />
                        ))}
                    </div>

                    <div className={styles.controlsGroup}>
                        <div className={styles.inputRow}>
                            <span>GYRO POLARITY</span>
                            <div 
                                className={`${styles.polaritySwitch} ${polarityInverted ? styles.inverted : ''}`}
                                onClick={() => setPolarityInverted(!polarityInverted)}
                            >
                                <div className={styles.polarityKnob} />
                            </div>
                        </div>
                        
                        <div className={styles.inputRow}>
                            <span>PITCH OFFSET</span>
                            <input 
                                type="number" 
                                className={styles.numberInput} 
                                value={pitch} 
                                onChange={(e) => setPitch(parseInt(e.target.value) || 0)} 
                            />
                        </div>

                        <div className={styles.inputRow}>
                            <span>ROLL OFFSET</span>
                            <input 
                                type="number" 
                                className={styles.numberInput} 
                                value={roll} 
                                onChange={(e) => setRoll(parseInt(e.target.value) || 0)} 
                            />
                        </div>
                    </div>

                    <button 
                        className={`${styles.syncBtn} ${isSyncing ? styles.syncing : ''}`}
                        onMouseDown={handleSyncStart}
                        onMouseUp={handleSyncEnd}
                        onMouseLeave={handleSyncEnd}
                        onTouchStart={handleSyncStart}
                        onTouchEnd={handleSyncEnd}
                        disabled={submitting}
                    >
                        {isSyncing && <div className={styles.syncProgress} />}
                        <span style={{ position: 'relative', zIndex: 1 }}>
                            {isSyncing ? "SYNCING..." : "HOLD TO SYNC"}
                        </span>
                    </button>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '-0.5rem', textAlign: 'center' }}>
                        Must hold for 3 seconds
                    </div>
                </div>
            </div>

            <div className={styles.statusSection}>
                <div className={`${styles.statusMessage} ${isSuccess ? styles.successMsg : ''}`}>
                    {isSuccess ? "STABILIZATION COMPLETE... UAV READY" : "ERR: GYROSCOPE MISALIGNED"}
                </div>
            </div>

            {isSuccess && (
                <button className={styles.completeBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>
                    {submitting ? "SUBMITTING..." : "Proceed to Next Sector"}
                </button>
            )}
        </div>
    );
}
