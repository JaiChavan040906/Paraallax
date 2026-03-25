"use client";

import React, { useState } from 'react';
import styles from './Game8HIPS.module.css';

const PACKETS = [
    { id: 'PKG-001', data: '2F 7B 1A 2D 1A 7B 3A 1A 1A 5C', valid: false },
    { id: 'PKG-002', data: '8A 7B 1A 7B 1A 2D 1A 1A 6A 5C', valid: false },
    { id: 'PKG-003', data: '8A 7B 1A 7B 1A 7B 1A 1A 5C 2D', valid: false },
    { id: 'PKG-004', data: '8A 7B 1A 7B 1A 2D 1A 1A 5C 6A', valid: true },
    { id: 'PKG-005', data: '3A 7B 1A 7B 1A 0A 1A 1A 5C 4A', valid: true },
    { id: 'PKG-006', data: '1A 1A 5C 2A 7B 1A 7B 1A 9A 4B', valid: true },
    { id: 'PKG-007', data: '0A 2A 1A 1A 5C 7B 1A 7B 1A 8A', valid: true },
    { id: 'PKG-008', data: '8A 1A 1A 5C 7B 1A 7B 1A 0A 2A', valid: true },
    { id: 'PKG-009', data: '1A 7B 1A 7B 3A 4A 1A 1A 5C 9B', valid: true },
    { id: 'PKG-010', data: '2F 1A 7B 1A 7B 1A 1A 5C 3A 4A', valid: true },
];

export default function Game8Set2({ puzzle, onSubmit, submitting }) {
    const [selected, setSelected] = useState(new Set());
    const [status, setStatus] = useState('inspecting'); // inspecting, success, error

    const handleToggle = (id) => {
        if (status === 'success') return; // Cannot edit after success
        const next = new Set(selected);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelected(next);
        if (status === 'error') {
            setStatus('inspecting');
        }
    };

    const handleProcess = () => {
        const infectedIds = PACKETS.filter(p => !p.valid).map(p => p.id);

        // Find infected packets that were NOT quarantined
        const missedInfected = infectedIds.filter(id => !selected.has(id));

        // Find safe packets that WERE quarantined
        const wronglyQuarantined = PACKETS.filter(p => p.valid && selected.has(p.id));

        if (missedInfected.length > 0 || wronglyQuarantined.length > 0) {
            setStatus('error');
            if (missedInfected.length > 0) {
                // Penalty on every attempt that lets an infected packet through
                fetch('/api/team/add-penalty', { method: 'POST' });
            }
        } else {
            setStatus('success');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>

                {/* ── Header ── */}
                <header className={styles.header}>
                    <div className={styles.metaRow}>
                        <span className={styles.setBadge}>I.P.S. INTERCEPTOR</span>
                        <div className={styles.systemBadges}>
                            <span className={styles.systemChip}>PORT: 8089</span>
                            <span className={styles.systemChip}>STATUS: LIVE</span>
                        </div>
                    </div>

                    <h1 className={styles.title}>
                        Intrusion Prevention System
                    </h1>

                    <p className={styles.subtitle}>OVERRIDE MODE — Inspect incoming packets and quarantine every infected one.</p>
                    <div className={styles.headerDivider} />
                </header>


                {/* ── Warning ── */}
                <div className={styles.warningBanner}>
                    <span className={styles.warningIcon}>⚠</span>
                    WARNING: LETTING AN INFECTED PACKET PASS RESULTS IN A 5-MINUTE GRID PENALTY.
                </div>

                {/* ── Body ── */}
                <div className={styles.body}>

                    {/* Rules panel */}
                    <div className={styles.rulesPanel}>
                        <div className={styles.rulesPanelTitle}>INSPECTION PROTOCOL</div>
                        <p className={styles.rulesPanelDesc}>
                            Scan the incoming packets. Quarantine (select) packets violating <strong>ANY</strong> of the firewall rules below. Click PROCESS to filter.
                        </p>
                    </div>

                    {/* Packet queue panel */}
                    <div className={styles.queuePanel}>
                        <div className={styles.queueHeader}>
                            <span>INCOMING PACKET QUEUE</span>
                            <span className={styles.queueCount}>10 pending</span>
                        </div>

                        <div className={styles.packetList}>
                            {PACKETS.map((pkg) => {
                                const isQuarantined = selected.has(pkg.id);
                                return (
                                    <div
                                        key={pkg.id}
                                        onClick={() => handleToggle(pkg.id)}
                                        className={`${styles.packetCard} ${isQuarantined ? styles.packetCardQuarantined : ''}`}
                                    >
                                        <div className={styles.packetTop}>
                                            <span className={`${styles.packetId} ${isQuarantined ? styles.packetIdQuarantined : ''}`}>
                                                [{pkg.id}]
                                            </span>
                                            {isQuarantined && (
                                                <span className={styles.quarantineTag}>Quarantined</span>
                                            )}
                                        </div>
                                        <div className={`${styles.packetData} ${isQuarantined ? styles.packetDataQuarantined : ''}`}>
                                            {pkg.data.split(' ').map((block, bIdx) => (
                                                <span key={bIdx} className={styles.dataBlock}>{block}</span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action bar */}
                        <div className={styles.actionBar}>
                            <div className={styles.feedback}>
                                {status === 'error' && (
                                    <div className={`${styles.termMsg} ${styles.msgErr}`}>
                                        ✗ BREACH DETECTED: Invalid processing. The system has suffered damage!
                                    </div>
                                )}
                                {status === 'success' && (
                                    <div className={`${styles.termMsg} ${styles.msgOk}`}>
                                        ✓ GRID SECURED. All threats eliminated.
                                    </div>
                                )}
                            </div>

                            {(!status || status === 'inspecting' || status === 'error') && (
                                <button
                                    onClick={handleProcess}
                                    className={styles.termBtn}
                                >
                                    Process Selection
                                </button>
                            )}

                            {status === 'success' && (
                                <button
                                    disabled={submitting}
                                    onClick={() => onSubmit("Solved")}
                                    className={styles.termBtnSuccess}
                                >
                                    {submitting ? "SUBMITTING..." : "VERIFY & SUBMIT"}
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
