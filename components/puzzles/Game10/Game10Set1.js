"use client";

import React, { useState, useEffect } from 'react';
import styles from './Game10Set1.module.css';

// 3x3 Grid mappings (A1, B1, C1 / A2, B2, C2 / A3, B3, C3)
// 0 1 2
// 3 4 5
// 6 7 8

const RECIPES = [
    {
        // Stone Pickaxe (V-shape cobble, sticks on sides)
        pattern: [
            'Cobblestone', null, 'Cobblestone',
            'Stick', 'Cobblestone', 'Stick',
            null, null, null
        ],
        tempReq: 20,
        result: 'Stone Pickaxe'
    },
    {
        // Iron Ingot (Smelt internal slot 4 / B2)
        pattern: [
            null, null, null,
            null, 'Iron Ore', null,
            null, null, null
        ],
        tempReq: 1500,
        result: 'Iron Ingot'
    },
    {
        // Bucket (Diagonal)
        pattern: [
            'Iron Ingot', null, null,
            null, 'Iron Ingot', null,
            null, null, 'Iron Ingot'
        ],
        tempReq: 20,
        result: 'Bucket'
    },
    {
        // Iron Pickaxe
        // Bottom Row (A3, B3, C3) = [6, 7, 8]
        // Center Column (B1, B2) = [1, 4]
        pattern: [
            null, 'Stick', null,
            null, 'Stick', null,
            'Iron Ingot', 'Iron Ingot', 'Iron Ingot'
        ],
        tempReq: 20,
        result: 'Iron Pickaxe'
    },
    {
        // Diamond Pickaxe: Diamond: A1, A2, A3 (Left Column); Stick: B3, C3 (Bottom Right)
        pattern: [
            'Diamond', null, null,
            'Diamond', null, null,
            'Diamond', 'Stick', 'Stick'
        ],
        tempReq: 20,
        result: 'Diamond Pickaxe'
    }
];

const ITEM_IMAGES = {
    'Cobblestone': '/crafting/cobble.png',
    'Stick': '/crafting/stick.png',
    'Iron Ore': '/crafting/ironore.png',
    'Diamond Ore': '/crafting/diamond.png', 
    'Diamond': '/crafting/diamond.png',
    'Iron Ingot': '/crafting/ironingot.png',
    'Bucket': '/crafting/bucket.png',
    'Iron Pickaxe': '/crafting/ironpick.png',
    'Stone Pickaxe': '/crafting/stonepick.png',
    'Diamond Pickaxe': '/crafting/diamondpick.png',
    'Lava Bucket': '/crafting/lavabucket.png',
    'Water Bucket': '/crafting/waterbucket.png',
    'Lava Source': '/crafting/lava.png',
    'Water Source': '/crafting/water.png',
    'Obsidian': '/crafting/obsidian.png',
    'Empty': null
};

export default function Game10Set1({ puzzle, onSubmit, submitting }) {
    const [inventory, setInventory] = useState([
        { item: 'Cobblestone', count: 5 },
        { item: 'Stick', count: 10 },
        { item: 'Iron Ore', count: 10 },
        { item: 'Diamond Ore', count: 3 } 
    ]);
    
    const [envLava, setEnvLava] = useState('Lava Source');
    const [envWater, setEnvWater] = useState('Water Source');
    const [envObsidian, setEnvObsidian] = useState('Empty');

    const [crucible, setCrucible] = useState(Array(9).fill(null));
    const [temperature, setTemperature] = useState(20);
    const [selectedInv, setSelectedInv] = useState(null);

    const [isSuccess, setIsSuccess] = useState(false);
    const [message, setMessage] = useState("AWAITING CRAFTING INPUT...");
    const [isCrafting, setIsCrafting] = useState(false);

    const getItemImage = (item) => ITEM_IMAGES[item] || null;

    const checkRecipe = () => {
        setIsCrafting(true);
        setMessage("FORGING...");
        
        setTimeout(() => {
            const matched = RECIPES.find(r => {
                const patternMatch = r.pattern.every((val, i) => crucible[i] === val);
                const tempMatch = (r.tempReq === 20 && temperature < 100) || (r.tempReq === 1500 && temperature >= 1450 && temperature <= 1550);
                return patternMatch && tempMatch;
            });

            if (matched) {
                addToInventory(matched.result, 1);
                setCrucible(Array(9).fill(null));
                setMessage(`CRAFTED: ${matched.result}`);
            } else {
                setMessage("ERR: INVALID PATTERN OR TEMPERATURE");
            }
            setIsCrafting(false);
        }, 800);
    };

    const addToInventory = (item, amount) => {
        setInventory(prev => {
            const existing = prev.find(i => i.item === item);
            if (existing) {
                return prev.map(i => i.item === item ? { ...i, count: i.count + amount } : i);
            }
            return [...prev, { item, count: amount }];
        });
    };

    const takeFromInventory = (item, amount) => {
        setInventory(prev => {
            return prev.map(i => i.item === item ? { ...i, count: Math.max(0, i.count - amount) } : i).filter(i => i.count > 0);
        });
    };

    const handleCrucibleClick = (idx) => {
        if (selectedInv) {
            setCrucible(prev => {
                const next = [...prev];
                if (next[idx]) addToInventory(next[idx], 1); 
                next[idx] = selectedInv;
                return next;
            });
            takeFromInventory(selectedInv, 1);
            setSelectedInv(null);
        } else if (crucible[idx]) {
            addToInventory(crucible[idx], 1);
            setCrucible(prev => {
                const next = [...prev];
                next[idx] = null;
                return next;
            });
        }
    };

    const handleInvClick = (item) => {
        if (selectedInv === item) {
            setSelectedInv(null);
        } else {
            if (item === 'Diamond Ore' && selectedInv === 'Iron Pickaxe') {
                takeFromInventory('Diamond Ore', 1);
                addToInventory('Diamond', 1);
                setMessage("DIAMOND ORE SHATTERED!");
                setSelectedInv(null);
                return;
            }
            setSelectedInv(item);
        }
    };

    const handleEnvClick = (slot) => {
        if (slot === 'Lava' && envLava === 'Lava Source' && selectedInv === 'Bucket') {
            takeFromInventory('Bucket', 1);
            addToInventory('Lava Bucket', 1);
            setEnvLava('Empty');
            setMessage("LAVA COLLECTED");
            setSelectedInv(null);
        }
        else if (slot === 'Water' && envWater === 'Water Source' && selectedInv === 'Bucket') {
            takeFromInventory('Bucket', 1);
            addToInventory('Water Bucket', 1);
            setEnvWater('Empty');
            setMessage("WATER COLLECTED");
            setSelectedInv(null);
        }
        else if (slot === 'Lava' && envLava === 'Lava Source' && selectedInv === 'Water Bucket') {
            takeFromInventory('Water Bucket', 1);
            addToInventory('Bucket', 1);
            setEnvLava('Empty');
            setEnvObsidian('Cobblestone');
            setMessage("ERR: PHYSICS INVERTED. LAVA COOLED INTO USELESS COBBLESTONE.");
            setSelectedInv(null);
        }
        else if (slot === 'Water' && envWater === 'Water Source' && selectedInv === 'Lava Bucket') {
            takeFromInventory('Lava Bucket', 1);
            addToInventory('Bucket', 1);
            setEnvWater('Empty');
            setEnvObsidian('Obsidian');
            setMessage("SUCCESS: MAGMA SHOCK-COOLED INTO OBSIDIAN");
            setSelectedInv(null);
        }
        else if (slot === 'ObsidianArea' || slot === 'Water' || slot === 'Lava') {
            if (envObsidian === 'Obsidian' && selectedInv === 'Diamond Pickaxe') {
                setIsSuccess(true);
                setMessage("OBSIDIAN FRACTURED... LEVEL CLEARED.");
                setSelectedInv(null);
            }
        }
    };

    const crucibleBgColor = temperature < 100 ? '#18181b' : 
                            temperature < 1000 ? '#450a0a' : 
                            temperature >= 1450 && temperature <= 1550 ? '#ea580c' : '#7f1d1d';

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <h2 className={styles.title}>{puzzle?.title || "Anomalous Crafting Protocol"}</h2>
                <div className={styles.badge}>CRUCIBLE 10</div>
            </div>

            <div className={styles.gameArea}>
                <div className={styles.leftPanel}>
                    <div>
                        <div className={styles.sectionTitle}>ENVIRONMENT</div>
                        <div className={styles.envGrid}>
                            <div className={`${styles.envSlot} ${styles['env-' + envLava.replace(' ', '')]}`} onClick={() => handleEnvClick('Lava')}>
                                {envLava === 'Empty' && envObsidian === 'Cobblestone' ? (
                                    <img src={getItemImage('Cobblestone')} alt="Cobblestone" className={styles.envImg} />
                                ) : (
                                    getItemImage(envLava) ? <img src={getItemImage(envLava)} alt={envLava} className={styles.envImg} /> : envLava
                                )}
                            </div>
                            <div className={`${styles.envSlot} ${styles['env-' + envWater.replace(' ', '')]}`} onClick={() => handleEnvClick('Water')}>
                                {envWater === 'Empty' && envObsidian === 'Obsidian' ? (
                                    <img src={getItemImage('Obsidian')} alt="Obsidian" className={styles.envImg} />
                                ) : (
                                    getItemImage(envWater) ? <img src={getItemImage(envWater)} alt={envWater} className={styles.envImg} /> : envWater
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className={styles.sectionTitle}>INVENTORY BAG</div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.5rem' }}>Select item, then click target.</p>
                        <div className={styles.inventoryGrid}>
                            {inventory.map((inv, i) => (
                                <div 
                                    key={i} 
                                    className={`${styles.invItem} ${selectedInv === inv.item ? styles.selected : ''}`}
                                    onClick={() => handleInvClick(inv.item)}
                                >
                                    <div className={styles.itemSprite}>
                                        <img src={getItemImage(inv.item)} alt={inv.item} />
                                    </div>
                                    <span>{inv.item} <span style={{color: '#eab308'}}>x{inv.count}</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <div className={styles.sectionTitle}>CRAFTING CRUCIBLE</div>
                    
                    <div className={styles.crucibleContainer} style={{ backgroundColor: crucibleBgColor }}>
                        <div className={styles.gridLabelsTop}>
                            <span>A</span><span>B</span><span>C</span>
                        </div>
                        
                        <div style={{display: 'flex'}}>
                            <div className={styles.gridLabelsSide}>
                                <span>1</span><span>2</span><span>3</span>
                            </div>
                            
                            <div className={styles.crucibleGrid}>
                                {crucible.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`${styles.crucibleSlot} ${item ? styles.filled : ''}`}
                                        onClick={() => handleCrucibleClick(idx)}
                                    >
                                        {item ? <img src={getItemImage(item)} alt={item} className={styles.slotImg} /> : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={styles.controlsPanel}>
                        <div className={styles.temperatureControl}>
                            <span style={{fontWeight: 'bold', color: temperature >= 1450 && temperature <= 1550 ? '#fde047' : '#fff'}}>
                                FURNACE TEMP: {temperature}°C
                            </span>
                            <input 
                                type="range" 
                                min="20" max="2000" step="10" 
                                value={temperature} 
                                onChange={e => setTemperature(parseInt(e.target.value))}
                                className={styles.tempSlider}
                            />
                        </div>

                        <button 
                            className={`${styles.craftBtn} ${isCrafting ? styles.craftingActive : ''}`} 
                            onClick={checkRecipe}
                            disabled={isCrafting}
                        >
                            {isCrafting ? 'FORGING...' : 'CRAFT / SMELT'}
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.statusSection}>
                <div className={`${styles.statusMessage} ${isSuccess ? styles.successMsg : ''}`}>
                    {message}
                </div>
            </div>

            {isSuccess && (
                <button className={styles.completeBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>
                    {submitting ? "SUBMITTING..." : "PROCEED TO NEXT SECTOR"}
                </button>
            )}
        </div>
    );
}
