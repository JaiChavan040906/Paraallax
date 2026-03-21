"use client";

import React, { useState, useRef, useLayoutEffect } from 'react';
import styles from './Game1PowerGrid.module.css';


const GATE_NAMES = ['Δ', 'Σ', 'Φ', 'Ψ'];

const computeGate = (gate, a, b) => {
    switch (gate) {
        case 'Δ': return a && b; // AND
        case 'Σ': return a || b; // OR
        case 'Φ': return a !== b; // XOR
        case 'Ψ': return !(a && b); // NAND
        default: return false;
    }
}

export default function Game1Set3({ puzzle, onSubmit, submitting }) {
    const inputs = [false, true, true, false, false, false, true, true, true, false];
    const boardRef = useRef(null);
    const nodeRefs = useRef({});
    const [coords, setCoords] = useState({});

    // Z1, Z2, Z3, Z4 maps
    const [z1, setZ1] = useState(null);
    const [z2, setZ2] = useState(null);
    const [z3, setZ3] = useState(null);
    const [z4, setZ4] = useState(null);

    useLayoutEffect(() => {
        const updateCoords = () => {
            if (!boardRef.current) return;
            const boardRect = boardRef.current.getBoundingClientRect();
            const newCoords = {};

            Object.entries(nodeRefs.current).forEach(([key, el]) => {
                if (el) {
                    const rect = el.getBoundingClientRect();
                    newCoords[key] = {
                        x: rect.left - boardRect.left + rect.width / 2,
                        y: rect.top - boardRect.top + rect.height / 2
                    };
                }
            });
            setCoords(newCoords);
        };

        updateCoords();
        window.addEventListener('resize', updateCoords);
        return () => window.removeEventListener('resize', updateCoords);
    }, []);

    // Compute active state
    const z1Out = computeGate(z1, inputs[0], inputs[1]);
    const z2Out = computeGate(z2, inputs[2], inputs[3]);
    const z3Out = computeGate(z3, inputs[4], inputs[5]);
    const z4Out = computeGate(z4, inputs[6], inputs[7]);

    const fixedA = inputs[8] !== inputs[9]; // XOR(I8, I9)
    const fixedB = z1Out !== z2Out; // XOR(Z1, Z2)
    const fixedC = z3Out !== z4Out; // XOR(Z3, Z4)
    const zFinalOut = fixedA && fixedB && fixedC; // AND(FixedA, FixedB, FixedC)

    const isAllPlaced = z1 !== null && z2 !== null && z3 !== null && z4 !== null;
    const isSuccess = isAllPlaced && zFinalOut;
    const hasError = isAllPlaced && !zFinalOut;

    const handleDrop = (zone, gate) => {
        if (z1 === gate) setZ1(null);
        if (z2 === gate) setZ2(null);
        if (z3 === gate) setZ3(null);
        if (z4 === gate) setZ4(null);

        if (zone === 1) setZ1(gate);
        if (zone === 2) setZ2(gate);
        if (zone === 3) setZ3(gate);
        if (zone === 4) setZ4(gate);
    };

    const handleClear = (zone) => {
        if (zone === 1) setZ1(null);
        if (zone === 2) setZ2(null);
        if (zone === 3) setZ3(null);
        if (zone === 4) setZ4(null);
    }

    
    const getPath = (startId, endId) => {
        const start = coords[startId];
        const end = coords[endId];
        if (!start || !end) return "";
        const midX = (start.x + end.x) / 2;
        return `M ${start.x} ${start.y} C ${midX} ${start.y}, ${midX} ${end.y}, ${end.x} ${end.y}`;
    };

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>The Power Grid</h2>
                <div className={styles.badge}>GRID Gamma</div>
            </div>

            <p className={styles.subtitle}>Route inputs through proprietary logic nodes to restore main power.</p>

            <div className={styles.circuitBoard} ref={boardRef}>
                <svg className={styles.wiresContainer}>
                    {/* Layer 1: Inputs -> Z */}
                    <path d={getPath('in0', 'z1')} className={`${styles.wire} ${inputs[0] ? styles.active : ''}`} />
                    <path d={getPath('in1', 'z1')} className={`${styles.wire} ${inputs[1] ? styles.active : ''}`} />
                    <path d={getPath('in2', 'z2')} className={`${styles.wire} ${inputs[2] ? styles.active : ''}`} />
                    <path d={getPath('in3', 'z2')} className={`${styles.wire} ${inputs[3] ? styles.active : ''}`} />
                    <path d={getPath('in4', 'z3')} className={`${styles.wire} ${inputs[4] ? styles.active : ''}`} />
                    <path d={getPath('in5', 'z3')} className={`${styles.wire} ${inputs[5] ? styles.active : ''}`} />
                    <path d={getPath('in6', 'z4')} className={`${styles.wire} ${inputs[6] ? styles.active : ''}`} />
                    <path d={getPath('in7', 'z4')} className={`${styles.wire} ${inputs[7] ? styles.active : ''}`} />

                    {/* Inputs 8,9 -> Fixed A */}
                    <path d={getPath('in8', 'fA')} className={`${styles.wire} ${inputs[8] ? styles.active : ''}`} />
                    <path d={getPath('in9', 'fA')} className={`${styles.wire} ${inputs[9] ? styles.active : ''}`} />

                    {/* Z -> Fixed B/C */}
                    <path d={getPath('z1', 'fB')} className={`${styles.wire} ${z1Out ? styles.active : ''}`} />
                    <path d={getPath('z2', 'fB')} className={`${styles.wire} ${z2Out ? styles.active : ''}`} />
                    <path d={getPath('z3', 'fC')} className={`${styles.wire} ${z3Out ? styles.active : ''}`} />
                    <path d={getPath('z4', 'fC')} className={`${styles.wire} ${z4Out ? styles.active : ''}`} />

                    {/* Fixed -> Output */}
                    <path d={getPath('fB', 'out')} className={`${styles.wire} ${fixedB ? styles.active : ''}`} />
                    <path d={getPath('fC', 'out')} className={`${styles.wire} ${fixedC ? styles.active : ''}`} />
                    <path d={getPath('fA', 'out')} className={`${styles.wire} ${fixedA ? styles.active : ''}`} />
                </svg>

                <div className={styles.inputNodesCol}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                        <div
                            key={i}
                            ref={el => { nodeRefs.current[`in${i}`] = el; }}
                            className={`${styles.staticInput} ${inputs[i] ? styles.on : ''}`}
                        >
                            IN {i}
                        </div>
                    ))}
                </div>

                <div className={styles.zNodesCol}>
                    <DropZone ref={(el) => { nodeRefs.current['z1'] = el; }} value={z1} onDrop={(g) => handleDrop(1, g)} onClear={() => handleClear(1)} label="Z1" />
                    <DropZone ref={(el) => { nodeRefs.current['z2'] = el; }} value={z2} onDrop={(g) => handleDrop(2, g)} onClear={() => handleClear(2)} label="Z2" />
                    <DropZone ref={(el) => { nodeRefs.current['z3'] = el; }} value={z3} onDrop={(g) => handleDrop(3, g)} onClear={() => handleClear(3)} label="Z3" />
                    <DropZone ref={(el) => { nodeRefs.current['z4'] = el; }} value={z4} onDrop={(g) => handleDrop(4, g)} onClear={() => handleClear(4)} label="Z4" />
                </div>

                <div className={styles.fixedCol}>
                    <div ref={el => { nodeRefs.current['fB'] = el; }} className={styles.fixedGate} title="XOR Node">Φ_B</div>
                    <div ref={el => { nodeRefs.current['fC'] = el; }} className={styles.fixedGate} title="XOR Node">Φ_C</div>
                    <div ref={el => { nodeRefs.current['fA'] = el; }} className={styles.fixedGate} title="XOR Node">Φ_A</div>
                </div>

                <div className={styles.outputCol}>
                    <OutputNode ref={el => { nodeRefs.current['out'] = el; }} success={isSuccess} error={hasError} />
                </div>
            </div>

            <div className={styles.statusSection}>
                <div className={`${styles.statusMessage} ${isSuccess ? styles.successMsg : hasError ? styles.errorMsg : ''}`}>
                    {isSuccess ? "POWER RESTORED" : hasError ? "SYSTEM FAILURE" : "AWAITING ROUTING..."}
                </div>
            </div>

            <div className={styles.palette}>
                {GATE_NAMES.map(g => {
                    const isPlaced = z1 === g || z2 === g || z3 === g || z4 === g;
                    return (
                        <div
                            key={g}
                            className={`${styles.gateBtn} ${isPlaced ? styles.gatePlaced : ''}`}
                            draggable={!isPlaced}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('gate', g);
                            }}
                        >
                            {g}
                        </div>
                    );
                })}
            </div>

            {isSuccess && (
                <button className={styles.completeBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>
                    {submitting ? "SUBMITTING..." : "Proceed to Sector 2"}
                </button>
            )}
        </div>
    );
}

const DropZone = React.forwardRef((props, ref) => (
    <div className={styles.dropZoneWrapper}>
        <div
            ref={ref}
            className={`${styles.dropZone} ${props.value ? styles.filled : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                props.onDrop(e.dataTransfer.getData('gate'));
            }}
            onClick={props.value ? props.onClear : undefined}
            title={props.value ? "Click to remove gate" : "Drag a gate here"}
        >
            {props.value || props.label}
        </div>
        {props.value && <div className={styles.removeHint}>Remove</div>}
    </div>
));
DropZone.displayName = 'DropZone';

const OutputNode = React.forwardRef((props, ref) => (
    <div className={styles.outputWrapper}>
        <div ref={ref} className={`${styles.outputBulb} ${props.success ? styles.success : ''} ${props.error ? styles.error : ''}`} />
        <div className={`${styles.nodeLabel} ${props.success ? styles.successText : props.error ? styles.errorText : ''}`}>OUTPUT</div>
    </div>
));
OutputNode.displayName = 'OutputNode';
