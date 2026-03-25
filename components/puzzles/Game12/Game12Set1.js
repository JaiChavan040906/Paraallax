"use client";

import React, { useState, useEffect, useMemo } from 'react';
import styles from './Game12Set1.module.css';

const SET_CONFIGS = {
    1: { 
        signalId: "ECHO-7", boardId: "EPSILON",
        channels: {
            A: { freq: 4, shift: 180 }, B: { freq: 1, shift: 180 }, C: { freq: 5, shift: 180 },
            D: { freq: 3, shift: 0 },   E: { freq: 2, shift: 0 },   F: { freq: 6, shift: 0 }
        },
        targetRecipe: [ { freq: 1, amp: 5, phase: 0 }, { freq: 2, amp: 3, phase: 180 }, { freq: 4, amp: 4, phase: 90 } ]
    },
    2: { 
        signalId: "NOVA-3", boardId: "OMEGA",
        channels: {
            A: { freq: 1, shift: 0 },   B: { freq: 6, shift: 0 },   C: { freq: 3, shift: 0 },
            D: { freq: 2, shift: 90 },  E: { freq: 5, shift: 90 },  F: { freq: 4, shift: 90 }
        },
        targetRecipe: [ { freq: 3, amp: 4, phase: 270 }, { freq: 5, amp: 2, phase: 90 }, { freq: 6, amp: 5, phase: 0 } ]
    },
    3: { 
        signalId: "PULSAR-9", boardId: "SIGMA",
        channels: {
            A: { freq: 2, shift: 270 }, B: { freq: 3, shift: 270 }, C: { freq: 4, shift: 270 },
            D: { freq: 5, shift: 270 }, E: { freq: 6, shift: 270 }, F: { freq: 1, shift: 270 }
        },
        targetRecipe: [ { freq: 1, amp: 3, phase: 180 }, { freq: 2, amp: 4, phase: 270 }, { freq: 3, amp: 5, phase: 90 } ]
    }
};

export default function Game12Set1({ puzzle, onSubmit, submitting }) {
    const activeSet = puzzle?.activeSet || 1;
    const config = SET_CONFIGS[activeSet] || SET_CONFIGS[1];

    const [channels, setChannels] = useState({
        A: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.A.freq, phaseInterference: config.channels.A.shift },
        B: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.B.freq, phaseInterference: config.channels.B.shift },
        C: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.C.freq, phaseInterference: config.channels.C.shift },
        D: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.D.freq, phaseInterference: config.channels.D.shift },
        E: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.E.freq, phaseInterference: config.channels.E.shift },
        F: { on: false, amp: 1, phaseInput: 0, freqMultiplier: config.channels.F.freq, phaseInterference: config.channels.F.shift },
    });

    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        let match = true;
        const currentMix = {};
        
        Object.values(channels).forEach(ch => {
            if (ch.on) {
                const finalPhase = (ch.phaseInput + ch.phaseInterference) % 360;
                currentMix[ch.freqMultiplier] = { amp: ch.amp, phase: finalPhase };
            }
        });

        if (Object.keys(currentMix).length !== config.targetRecipe.length) {
            match = false;
        } else {
            config.targetRecipe.forEach(target => {
                const mixComp = currentMix[target.freq];
                if (!mixComp || mixComp.amp !== target.amp || mixComp.phase !== target.phase) {
                    match = false;
                }
            });
        }
        setIsSuccess(match);
    }, [channels, config]);

    const toggleChannel = (id) => {
        setChannels(prev => ({ ...prev, [id]: { ...prev[id], on: !prev[id].on } }));
    };

    const setChannelAmp = (id, amp) => {
        setChannels(prev => ({ ...prev, [id]: { ...prev[id], amp } }));
    };

    const cyclePhase = (id) => {
        setChannels(prev => ({ 
            ...prev, 
            [id]: { ...prev[id], phaseInput: (prev[id].phaseInput + 90) % 360 } 
        }));
    };

    const generateWavePath = (mixFunc) => {
        const width = 800;
        const height = 150;
        const midY = height / 2;
        const points = [];
        const resolution = 4; 
        const xScaling = (Math.PI * 4) / width;
        const yScaling = 6; 

        for (let x = 0; x <= width; x += resolution) {
            const logicalX = x * xScaling;
            const y = mixFunc(logicalX) * yScaling;
            points.push(`${Math.round(x)},${Math.round(midY - y)}`);
        }
        return `M ${points.join(' L ')}`;
    };

    const targetWaveFunc = (x) => {
        let val = 0;
        config.targetRecipe.forEach(t => {
            const phaseRad = t.phase * (Math.PI / 180);
            val += t.amp * Math.sin((x * t.freq) + phaseRad);
        });
        return val;
    };

    const mixWaveFunc = (x) => {
        let val = 0;
        Object.values(channels).forEach(ch => {
            if (ch.on) {
                const finalPhaseRad = ((ch.phaseInput + ch.phaseInterference) % 360) * (Math.PI / 180);
                val += ch.amp * Math.sin((x * ch.freqMultiplier) + finalPhaseRad);
            }
        });
        return val;
    };

    const targetPath = useMemo(() => generateWavePath(targetWaveFunc), [config]);
    const mixPath = useMemo(() => generateWavePath(mixWaveFunc), [channels]);

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>{puzzle?.title || "Harmonic Synthesizer"}</h2>
                <div className={styles.badge}>SIGNAL: {config.signalId}</div>
                <div className={styles.badge} style={{background: '#5b21b6'}}>BOARD: {config.boardId}</div>
            </div>

            <p className={styles.subtitle}>Reconstruct the shattered transmission. Match Target Trace.</p>

            <div className={styles.oscilloscope}>
                <div className={styles.screenLabel}>OSCILLOSCOPE - TRACE AND MIX</div>
                <svg className={styles.svgContainer} viewBox="0 0 800 150" preserveAspectRatio="none">
                    <path className={styles.gridLine} d="M 0 75 L 800 75" />
                    <path className={styles.targetWave} d={targetPath} stroke="#ef4444" strokeWidth="3" fill="none" opacity="0.6"/>
                    <path className={styles.mixWave} d={mixPath} stroke="#0ff" strokeWidth="3" fill="none"/>
                </svg>
            </div>

            <div className={styles.channelsGrid}>
                {['A', 'B', 'C', 'D', 'E', 'F'].map(chId => {
                    const ch = channels[chId];
                    return (
                        <div key={chId} className={styles.channel}>
                            <div className={styles.channelTitleRow} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>CH {chId}</span>
                                <div className={`${styles.toggleSwitch} ${ch.on ? styles.on : ''}`} onClick={() => toggleChannel(chId)}>
                                    {ch.on ? 'ON' : 'OFF'}
                                </div>
                            </div>
                            
                            <div className={styles.sliderContainer}>
                                <div>AMP: {ch.amp}</div>
                                <input 
                                    type="range" min="1" max="5" step="1" 
                                    value={ch.amp} 
                                    onChange={(e) => setChannelAmp(chId, parseInt(e.target.value))}
                                    className={styles.slider}
                                />
                            </div>

                            <div className={styles.phaseContainer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>PHASE:</span>
                                <button 
                                    onClick={() => cyclePhase(chId)}
                                    style={{ padding: '5px 10px', background: '#222', color: '#0ff', border: '1px solid #0ff', cursor: 'pointer' }}
                                >
                                    {ch.phaseInput}°
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.statusSection}>
                <div className={`${styles.statusMessage} ${isSuccess ? styles.successMsg : ''}`} style={{ textAlign: 'center', fontWeight: 'bold' }}>
                    {isSuccess ? "SIGNAL DECRYPTED... TARGET MATCH VERIFIED" : "SIGNAL MISMATCH... PHASE/AMP INCORRECT"}
                </div>
            </div>

            {isSuccess && (
                <button className={styles.completeBtn} disabled={submitting} onClick={() => onSubmit("Solved")} style={{ width: '100%', padding: '15px', marginTop: '15px' }}>
                    {submitting ? "SUBMITTING..." : "Proceed to Next Sector"}
                </button>
            )}
        </div>
    );
}
