"use client";

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Game5Decryption.module.css';

interface Game5DecryptionProps {
    onComplete: () => void;
}

const TARGET_PASSPHRASE = 'SYSTEMRESET';
const BUFFER_SIZE = 11;

// Obscure symbols mapped to English letters
// Note: We include exactly what's needed for SYSTEMRESET plus some decoys.
const SYMBOL_MAP: Record<string, string> = {
    'S': 'Ψ',
    'Y': '⨂',
    'T': '∆',
    'E': '☿',
    'M': '⎈',
    'R': 'ᚱ',
    'A': 'Ω',
    'O': '✦',
    'I': '⟁',
    'N': '▱',
    'C': '❂',
    'H': '⋈',
    'L': '⛤',
    'D': '⎔',
    'P': '⍟',
    'U': '⍡'
};

// Flatten to an array of objects to render keys easily
const KEYBOARD_KEYS = Object.entries(SYMBOL_MAP).map(([letter, symbol]) => ({ letter, symbol }));

export default function Game5Decryption({ onComplete }: Game5DecryptionProps) {
    const [buffer, setBuffer] = useState<string[]>([]);
    const [status, setStatus] = useState<'idle' | 'failed' | 'success'>('idle');
    const [keysLayout, setKeysLayout] = useState<{ letter: string, symbol: string }[]>([]);

    useEffect(() => {
        // Shuffle keys once on mount to prevent repositioning on re-render
        const shuffled = [...KEYBOARD_KEYS].sort(() => Math.random() - 0.5);
        setKeysLayout(shuffled);
    }, []);

    const handleKeyPress = useCallback((symbol: string) => {
        if (status !== 'idle') return;

        setBuffer(prev => {
            if (prev.length < BUFFER_SIZE) {
                return [...prev, symbol];
            }
            return prev;
        });
    }, [status]);

    const handleBackspace = () => {
        if (status !== 'idle') return;
        setBuffer(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (status !== 'idle') return;
        if (buffer.length === 0) return;

        // Translate buffer symbols back to letters
        const enteredLetters = buffer.map(sym => {
            const entry = KEYBOARD_KEYS.find(k => k.symbol === sym);
            return entry ? entry.letter : '';
        }).join('');

        if (enteredLetters === TARGET_PASSPHRASE) {
            setStatus('success');
            // Allow animation to play before transitioning
            setTimeout(() => {
                onComplete();
            }, 3000); // 3 seconds of success particles
        } else {
            setStatus('failed');
            setTimeout(() => {
                setBuffer([]);
                setStatus('idle');
            }, 1000); // Clear fail state after 1s
        }
    };

    // Keyboard support for testing (mapping actual keyboard characters if they match our dictionary keys)
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (status !== 'idle') return;

            if (e.key === 'Backspace') {
                handleBackspace();
                return;
            }

            if (e.key === 'Enter') {
                handleSubmit();
                return;
            }

            const char = e.key.toUpperCase();
            if (SYMBOL_MAP[char]) {
                handleKeyPress(SYMBOL_MAP[char]);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [status, buffer, handleBackspace, handleSubmit, handleKeyPress]);

    return (
        <div className={styles.container}>
            {status === 'success' && <div className={styles.particlesOverlay} />}

            <div className={`${styles.glassPanel} ${status === 'failed' ? styles.panelFailed : ''} ${status === 'success' ? styles.panelSuccess : ''}`}>
                <div className={styles.header}>
                    <h2 className={styles.title}>CLASSIFIED UPLINK</h2>
                    <p className={styles.subtitle}>INPUT DECRYPTION PASSPHRASE</p>
                </div>

                <div className={styles.bufferContainer}>
                    {Array.from({ length: BUFFER_SIZE }).map((_, i) => (
                        <div key={i} className={`${styles.bufferSlot} ${buffer[i] ? styles.slotFilled : ''} ${status === 'failed' ? styles.slotError : ''} ${status === 'success' ? styles.slotSuccess : ''}`}>
                            {buffer[i] || ''}
                        </div>
                    ))}
                </div>

                {status === 'failed' && (
                    <div className={styles.errorMessage}>DECRYPTION FAILED</div>
                )}
                {status === 'success' && (
                    <div className={styles.successMessage}>ACCESS GRANTED</div>
                )}

                <div className={styles.keyboard}>
                    {keysLayout.map(({ letter, symbol }) => (
                        <button
                            key={letter}
                            className={styles.keyBtn}
                            onClick={() => handleKeyPress(symbol)}
                            disabled={status !== 'idle'}
                        >
                            {symbol}
                        </button>
                    ))}
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={handleBackspace}
                        disabled={status !== 'idle'}
                    >
                        BACKSPACE
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.submitBtn}`}
                        onClick={handleSubmit}
                        disabled={status !== 'idle'}
                    >
                        SUBMIT
                    </button>
                </div>
            </div>
        </div>
    );
}
