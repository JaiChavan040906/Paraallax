"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './Game9Chroma.module.css';

const puzzleData = {
  id: 'acetone',
  name: 'ACETONE',
  formula: 'CH₃COCH₃',
  altNames: ['acetone', 'propanone', 'ch3coch3', 'c3h6o', 'dimethyl ketone'],
  level: 'LEVEL 02',
  method: 'GC-MS + IR',
  hint1: 'The base peak at m/z 43 is characteristic of an acetyl cation (CH₃CO⁺). What common solvent has this fragment?',
  hint2: 'A sharp, very strong IR absorption near 1715 cm⁻¹ indicates a ketone carbonyl group. The MW is 58.',
  desc: 'A simple 3-carbon ketone used as a common organic solvent.',
  gcms: {
    title: 'MASS SPECTRUM — Unknown Sample #B02',
    mz: [15, 43, 58],
    intensity: [28, 100, 25],
    basePeak: 43,
  },
  ir: {
    title: 'INFRARED SPECTRUM — Sample #B02',
    peaks: [
      { wn: 2960, T: 45, label: '' },
      { wn: 1715, T: 8, label: 'Sharp' },
      { wn: 1360, T: 40, label: '' },
      { wn: 1220, T: 35, label: '' },
    ]
  },
  tableData: [
    { mz: 58, intensity: 25, note: 'Molecular ion M⁺' },
    { mz: 43, intensity: 100, note: 'Base peak (M-15, CH₃CO⁺)' },
    { mz: 15, intensity: 28, note: 'Fragment ion (CH₃⁺)' },
  ],
  clues: [
    { label: 'Molecular Weight', value: '58 g/mol' },
    { label: 'Base Peak (m/z)', value: '43' },
    { label: 'IR: Sharp ~1715 cm⁻¹', value: 'Very strong absorption' },
    { label: 'Boiling Point', value: '56.0 °C' },
  ]
};

export default function Game9Set2({ puzzle, onSubmit, submitting }) {
  const [timeLeft, setTimeLeft] = useState(300);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [answer, setAnswer] = useState('');
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState('');

  const msCanvasRef = useRef(null);
  const irCanvasRef = useRef(null);

  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameStatus('lost');
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameStatus]);

  useEffect(() => {
    drawMassSpectrum();
    drawIRSpectrum();
  }, [puzzleData]);

  const drawMassSpectrum = () => {
    const canvas = msCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const W = parent.clientWidth || 500;
    const H = 160;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { l: 40, r: 20, t: 10, b: 25 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;
    const maxMZ = Math.max(...puzzleData.gcms.mz) + 15;
    const minMZ = Math.max(0, Math.min(...puzzleData.gcms.mz) - 10);

    ctx.fillStyle = '#04080f'; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(0,200,255,0.06)'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (ch / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
      ctx.fillStyle = 'rgba(0,200,255,0.3)'; ctx.font = `9px Share Tech Mono, monospace`;
      ctx.fillText(String(100 - i * 25) + '%', 2, y + 3);
    }

    ctx.strokeStyle = 'rgba(0,200,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();

    const baseMax = Math.max(...puzzleData.gcms.intensity);
    puzzleData.gcms.mz.forEach((mz, i) => {
      const x = pad.l + ((mz - minMZ) / (maxMZ - minMZ)) * cw;
      const relH = puzzleData.gcms.intensity[i] / baseMax;
      const y = pad.t + ch - relH * ch;

      const grad = ctx.createLinearGradient(x, y, x, pad.t + ch);
      const isBase = mz === puzzleData.gcms.basePeak;
      const col = isBase ? '#00ffe7' : '#00c8ff';
      grad.addColorStop(0, col + 'cc');
      grad.addColorStop(1, col + '11');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 2, y, 4, pad.t + ch - y);
      ctx.fillStyle = col;
      ctx.fillRect(x - 2, y, 4, 2);

      ctx.fillStyle = isBase ? '#00ffe7' : 'rgba(0,200,255,0.7)';
      ctx.font = `${isBase ? 'bold ' : ''}10px Share Tech Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(mz, x, y - 4);
    });
  };

  const drawIRSpectrum = () => {
    const canvas = irCanvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const W = parent.clientWidth || 500;
    const H = 140;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const pad = { l: 40, r: 20, t: 10, b: 25 };
    const cw = W - pad.l - pad.r, ch = H - pad.t - pad.b;

    ctx.fillStyle = '#04080f'; ctx.fillRect(0, 0, W, H);

    const wMax = 4000, wMin = 500;

    ctx.strokeStyle = 'rgba(0,200,255,0.06)'; ctx.lineWidth = 1;
    [100, 75, 50, 25, 0].forEach(pct => {
      const y = pad.t + (1 - pct / 100) * ch;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + cw, y); ctx.stroke();
      ctx.fillStyle = 'rgba(0,200,255,0.3)'; ctx.font = '9px Share Tech Mono, monospace';
      ctx.fillText(pct + '%', 2, y + 3);
    });

    [4000, 3000, 2000, 1500, 1000, 500].forEach(wn => {
      const x = pad.l + ((wMax - wn) / (wMax - wMin)) * cw;
      ctx.strokeStyle = 'rgba(0,200,255,0.08)';
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, pad.t + ch); ctx.stroke();
      if (wn > 500) {
        ctx.fillStyle = 'rgba(0,200,255,0.25)'; ctx.textAlign = 'center';
        ctx.fillText(wn, x, pad.t + ch + 12);
      }
    });

    ctx.strokeStyle = 'rgba(0,200,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ch); ctx.lineTo(pad.l + cw, pad.t + ch); ctx.stroke();

    const numPts = 300;
    const pts = [];
    for (let i = 0; i < numPts; i++) {
      const wn = wMax - (i / (numPts - 1)) * (wMax - wMin);
      let T = 95;
      puzzleData.ir.peaks.forEach(pk => {
        const width = pk.T < 20 ? 120 : 80;
        const depth = 95 - pk.T;
        const gauss = depth * Math.exp(-Math.pow(wn - pk.wn, 2) / (2 * width * width));
        T -= gauss;
      });
      T = Math.max(5, Math.min(99, T));
      pts.push({ wn, T });
    }

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = pad.l + ((wMax - pt.wn) / (wMax - wMin)) * cw;
      const y = pad.t + (1 - pt.T / 100) * ch;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.l + cw, pad.t + ch);
    ctx.lineTo(pad.l, pad.t + ch);
    ctx.closePath();
    const fillGrad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    fillGrad.addColorStop(0, 'rgba(0,200,255,0.08)');
    fillGrad.addColorStop(1, 'rgba(0,200,255,0.02)');
    ctx.fillStyle = fillGrad; ctx.fill();

    ctx.beginPath();
    pts.forEach((pt, i) => {
      const x = pad.l + ((wMax - pt.wn) / (wMax - wMin)) * cw;
      const y = pad.t + (1 - pt.T / 100) * ch;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#00c8ff'; ctx.lineWidth = 1.5; ctx.stroke();

    puzzleData.ir.peaks.forEach(pk => {
      if (!pk.label) return;
      const x = pad.l + ((wMax - pk.wn) / (wMax - wMin)) * cw;
      const y = pad.t + (1 - pk.T / 100) * ch;
      ctx.strokeStyle = 'rgba(255,225,86,0.4)'; ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, pad.t + 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffe156'; ctx.font = 'bold 9px Share Tech Mono, monospace';
      ctx.textAlign = 'center'; ctx.fillText(pk.wn, x, pad.t - 2);
    });
  };

  const handleResize = () => {
    drawMassSpectrum();
    drawIRSpectrum();
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAnswer = () => {
    if (gameStatus !== 'playing') return;
    const raw = answer.trim().toLowerCase()
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, d => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)])
      .replace(/\s+/g, '');

    const accepted = puzzleData.altNames.some(a => a.replace(/\s+/g, '') === raw);

    if (accepted) {
      setStatusType('success');
      setStatusMsg(`✓ CORRECT — ${puzzleData.name} (${puzzleData.formula}) confirmed.`);
      setTimeout(() => setGameStatus('won'), 900);
    } else {
      setStatusType('error');
      setStatusMsg(`Incorrect. Review the spectral data and consult the manual.`);
      // Shake effect could be handled via class
    }
  };

  const giveHint = () => {
    if (gameStatus !== 'playing') return;
    const hints = [puzzleData.hint1, puzzleData.hint2];
    const h = hints[Math.min(hintsUsed, hints.length - 1)];
    setHintsUsed(prev => Math.min(prev + 1, hints.length));
    setStatusType('hint');
    setStatusMsg(`HINT: ${h}`);
    setTimeLeft(prev => Math.max(0, prev - 30));
  };

  const pad0 = n => String(n).padStart(2, '0');

  const manualTabs = ['MS THEORY', 'IR THEORY', 'FRAGMENTS', 'DEDUCTION'];

  return (
    <div className={styles.page}>
      
      {/* ── GAME SCREEN ──────────────────────────────────────────────────────── */}
      <div className={styles.gameScreen}>
        <div className={styles.topbar}>
          <div className={styles.topbarTitle}>UNKNOWN SAMPLE · {puzzleData.level}</div>
          <div className={`${styles.timer} ${timeLeft < 60 ? styles.danger : ''}`}>
            {pad0(Math.floor(timeLeft / 60))}:{pad0(timeLeft % 60)}
          </div>
        </div>

        <div className={styles.split}>
          
          {/* GRAPH PANEL */}
          <div className={styles.graphPanel}>
            <div className={styles.panelHeader}>
              <span>OPERATOR CONSOLE · SPECTRAL DATA</span>
              <span style={{ color: 'var(--cyan)', fontSize: '0.58rem', letterSpacing: '0.15em' }}>{puzzleData.method}</span>
            </div>
            
            <div className={styles.panelBody}>
              <div className={styles.dataSectionTitle}>GAS CHROMATOGRAPHY / MASS SPECTROMETRY</div>

              {/* MASS SPECTRUM */}
              <div className={styles.chromaContainer}>
                <div className={styles.chromaTitle}>
                  <span>{puzzleData.gcms.title}</span>
                  <span style={{ color: 'var(--blue-dim)' }}>m/z vs. Relative Intensity (%)</span>
                </div>
                <div className={styles.canvasContainer}>
                  <canvas ref={msCanvasRef} className={styles.chromaCanvas} />
                </div>
                <div className={styles.axisLabels}>
                  <span>0</span><span>m/z →</span><span>{Math.max(...puzzleData.gcms.mz) + 10}</span>
                </div>
                <div className={styles.peakAnnotations}>
                  {puzzleData.gcms.mz.map((mz) => (
                    <div key={mz} className={styles.peakTag} style={{ borderColor: mz === puzzleData.gcms.basePeak ? 'rgba(0,255,231,0.4)' : 'var(--border)' }}>
                      <span className={styles.peakTagLabel}>m/z</span>
                      <span className={styles.peakTagVal} style={{ color: mz === puzzleData.gcms.basePeak ? 'var(--cyan)' : 'var(--blue)' }}>
                        {mz}{mz === puzzleData.gcms.basePeak ? ' ★' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* IR SPECTRUM */}
              <div className={styles.chromaContainer}>
                <div className={styles.chromaTitle}>
                  <span>{puzzleData.ir.title}</span>
                  <span style={{ color: 'var(--blue-dim)' }}>Wavenumber (cm⁻¹) vs. %Transmittance</span>
                </div>
                <div className={styles.canvasContainer}>
                  <canvas ref={irCanvasRef} className={styles.chromaCanvas} />
                </div>
                <div className={styles.axisLabels}>
                  <span>4000 cm⁻¹</span><span>← Wavenumber</span><span>500 cm⁻¹</span>
                </div>
                <div className={styles.peakAnnotations}>
                  {puzzleData.ir.peaks.filter(pk => pk.label).map(pk => (
                    <div key={pk.wn} className={styles.peakTag} style={{ borderColor: 'rgba(255,225,86,0.35)' }}>
                      <span className={styles.peakTagLabel}>cm⁻¹</span>
                      <span className={styles.peakTagVal} style={{ color: 'var(--yellow)' }}>{pk.wn} · {pk.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATA TABLE */}
              <div className={styles.dataSection}>
                <div className={styles.dataSectionTitle}>MASS SPECTRUM — PEAK TABLE</div>
                <table className={styles.table}>
                  <thead>
                    <tr><th className={styles.th}>m/z</th><th className={styles.th}>REL. INT. (%)</th><th className={styles.th}>ASSIGNMENT</th></tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {puzzleData.tableData.map(r => (
                      <tr key={r.mz}>
                        <td className={styles.td}>{r.mz}</td>
                        <td className={styles.td}>{r.intensity}</td>
                        <td className={styles.td} style={{ color: 'rgba(0,200,255,0.5)' }}>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* INSTRUMENTAL CLUES */}
              <div className={styles.dataSection}>
                <div className={styles.dataSectionTitle}>INSTRUMENTAL DATA SUMMARY</div>
                <table className={styles.table}>
                  <thead>
                    <tr><th className={styles.th}>PARAMETER</th><th className={styles.th}>VALUE</th></tr>
                  </thead>
                  <tbody className={styles.tbody}>
                    {puzzleData.clues.map(c => (
                      <tr key={c.label}>
                        <td className={styles.td}>{c.label}</td>
                        <td className={styles.td} style={{ color: 'var(--cyan)' }}>{c.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ANSWER */}
              <div className={styles.answerSection}>
                <div className={styles.answerLabel}>COMPOUND IDENTIFICATION</div>
                <div className={styles.answerRow}>
                  <input 
                    className={`${styles.answerInput} ${statusType === 'success' ? styles.correct : ''} ${statusType === 'error' ? styles.wrong : ''}`}
                    type="text" 
                    placeholder="Enter molecular formula (e.g. CH₃OH)" 
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') checkAnswer(); }}
                    disabled={gameStatus !== 'playing'}
                  />
                  <button className={styles.submitBtn} onClick={checkAnswer} disabled={gameStatus !== 'playing'}>IDENTIFY ►</button>
                </div>
                {statusMsg && (
                  <div className={`${styles.statusMsg} ${styles[statusType]}`}>
                    {statusMsg}
                  </div>
                )}
                <button className={styles.hintBtn} onClick={giveHint} disabled={gameStatus !== 'playing'}>⚑ REQUEST HINT FROM MANUAL</button>
                <div className={styles.hintsUsed}>Hints used: {hintsUsed}/2</div>
              </div>

            </div>
          </div>

          {/* MANUAL PANEL */}
          <div className={styles.manualPanel}>
            <div className={styles.manualTitleBlock}>
              <div className={styles.manualTitle}>ANALYTICAL MANUAL</div>
              <div className={styles.manualSubtitle}>SPECTROSCOPY REFERENCE · PLAYER 2 ONLY</div>
            </div>
            
            <div className={styles.manualTabs}>
              {manualTabs.map((tab, i) => (
                <div key={i} className={`${styles.manualTab} ${activeTab === i ? styles.active : ''}`} onClick={() => setActiveTab(i)}>
                  {tab}
                </div>
              ))}
            </div>

            <div className={styles.manualContent}>
              {activeTab === 0 && (
                <div className={`${styles.tabPage} ${styles.active}`}>
                  <div className={styles.mSection}>MASS SPECTROMETRY BASICS</div>
                  <div className={styles.mRule}>In MS, the molecule is ionised and fragmented. The instrument measures the <strong>mass-to-charge ratio (m/z)</strong> of each fragment and its relative abundance.</div>
                  <div className={styles.mRule}><strong>Molecular Ion (M⁺)</strong> — the peak at the highest significant m/z gives the <span className={styles.hl}>molecular weight</span> of the compound. It is the intact molecule minus one electron.</div>
                  <div className={styles.mRule}><strong>Base Peak</strong> — the most abundant fragment (100% relative intensity, marked ★). It is the most stable fragment the molecule can produce.</div>
                  <div className={styles.mRule}><strong>Fragment Ions</strong> — smaller peaks from bonds breaking. Their mass differences from M⁺ reveal what groups were lost.</div>
              
                  <div className={styles.mSection}>COMMON NEUTRAL LOSSES FROM M⁺</div>
                  <table className={styles.table}>
                    <thead><tr><th className={styles.th}>LOSS (Δm)</th><th className={styles.th}>FRAGMENT LOST</th><th className={styles.th}>INDICATES</th></tr></thead>
                    <tbody className={styles.tbody}>
                      <tr><td className={styles.td}>1</td><td className={styles.td}>H•</td><td className={styles.td}>Common from any C-H</td></tr>
                      <tr><td className={styles.td}>15</td><td className={styles.td}>CH₃</td><td className={styles.td}>Methyl group present</td></tr>
                      <tr><td className={styles.td}>17</td><td className={styles.td}>OH</td><td className={styles.td}>Alcohol or acid</td></tr>
                      <tr><td className={styles.td}>18</td><td className={styles.td}>H₂O</td><td className={styles.td}>Alcohol or acid</td></tr>
                      <tr><td className={styles.td}>28</td><td className={styles.td}>CO or C₂H₄</td><td className={styles.td}>Carbonyl or ethyl</td></tr>
                      <tr><td className={styles.td}>29</td><td className={styles.td}>CHO or C₂H₅</td><td className={styles.td}>Aldehyde or ethyl</td></tr>
                      <tr><td className={styles.td}>31</td><td className={styles.td}>OCH₃ or CH₂OH</td><td className={styles.td}>Methoxy or hydroxymethyl</td></tr>
                      <tr><td className={styles.td}>45</td><td className={styles.td}>OC₂H₅ or COOH</td><td className={styles.td}>Ethoxy or carboxyl</td></tr>
                    </tbody>
                  </table>
              
                  <div className={styles.mSection}>ISOTOPE PATTERNS</div>
                  <div className={styles.mRule}><strong>Chlorine pattern:</strong> ³⁵Cl:³⁷Cl = 3:1 ratio. One Cl gives M⁺ and M+2 peaks in ~3:1 ratio. Two Cl atoms give a 9:6:1 triplet. Three Cl give a <span className={styles.hl}>1:3:3:1 quartet</span>.</div>
                  <div className={styles.mRule}><strong>Bromine pattern:</strong> ⁷⁹Br:⁸¹Br ≈ 1:1. One Br gives equal-height M⁺ and M+2 peaks.</div>
                  <div className={styles.mNote}>⚠ If you see pairs of peaks separated by 2 mass units with unusual ratios, suspect a halogen.</div>
              
                  <div className={styles.mSection}>MOLECULAR FORMULA FROM MW</div>
                  <div className={styles.mFormula}>Degree of Unsaturation (DoU) = (2C + 2 + N - H - X) / 2
DoU = 0 → saturated (no rings, no double bonds)
DoU = 1 → one ring OR one double bond (C=O, C=C)
DoU = 4 → benzene ring (3 double bonds + 1 ring)</div>
                  <div className={styles.mNote}>⚠ Benzene ring = DoU of 4. If MW ≈ 78+14n and base peak = M-1 or tropylium (m/z=91), think aromatic.</div>
                </div>
              )}

              {activeTab === 1 && (
                <div className={`${styles.tabPage} ${styles.active}`}>
                  <div className={styles.mSection}>INFRARED SPECTROSCOPY BASICS</div>
                  <div className={styles.mRule}>IR measures how bonds <strong>absorb infrared light</strong>. Each type of bond vibrates at a characteristic frequency (wavenumber, cm⁻¹). Lower transmittance = stronger absorption = that bond is <span className={styles.hl}>present</span>.</div>
                  <div className={styles.mRule}>The spectrum runs from <strong>4000 cm⁻¹ (left) to ~500 cm⁻¹ (right)</strong>. High wavenumber = stretching of lighter atoms (H). Low wavenumber = bending, heavier atoms (C-C, C-Cl).</div>
              
                  <div className={styles.mSection}>KEY ABSORPTION REGIONS</div>
                  <table className={styles.table}>
                    <thead><tr><th className={styles.th}>WAVENUMBER (cm⁻¹)</th><th className={styles.th}>BOND</th><th className={styles.th}>NOTES</th></tr></thead>
                    <tbody className={styles.tbody}>
                      <tr><td className={styles.td}><span className={styles.hl}>3200–3550</span></td><td className={styles.td}>O-H (alcohol)</td><td className={styles.td}>Broad, strong</td></tr>
                      <tr><td className={styles.td}><span className={styles.hlOrange}>2500–3300</span></td><td className={styles.td}>O-H (acid)</td><td className={styles.td}>Very broad, overlaps C-H</td></tr>
                      <tr><td className={styles.td}>3300</td><td className={styles.td}>N-H or ≡C-H</td><td className={styles.td}>Medium, sharp</td></tr>
                      <tr><td className={styles.td}>3000–3100</td><td className={styles.td}>Aromatic C-H</td><td className={styles.td}>Above 3000 cm⁻¹</td></tr>
                      <tr><td className={styles.td}>2850–2960</td><td className={styles.td}>Aliphatic C-H</td><td className={styles.td}>Below 3000, medium</td></tr>
                      <tr><td className={styles.td}><span className={styles.hlGreen}>1700–1750</span></td><td className={styles.td}>C=O ketone</td><td className={styles.td}>Sharp, very strong</td></tr>
                      <tr><td className={styles.td}><span className={styles.hlGreen}>1700–1725</span></td><td className={styles.td}>C=O acid</td><td className={styles.td}>Sharp, very strong</td></tr>
                      <tr><td className={styles.td}><span className={styles.hlGreen}>1720–1740</span></td><td className={styles.td}>C=O ester</td><td className={styles.td}>Sharp, very strong</td></tr>
                      <tr><td className={styles.td}>1600, 1500</td><td className={styles.td}>C=C aromatic</td><td className={styles.td}>Two bands</td></tr>
                      <tr><td className={styles.td}>1620–1680</td><td className={styles.td}>C=C alkene</td><td className={styles.td}>Medium</td></tr>
                      <tr><td className={styles.td}>1000–1260</td><td className={styles.td}>C-O stretch</td><td className={styles.td}>Alcohol, ether, ester</td></tr>
                      <tr><td className={styles.td}><span className={styles.hlPurple}>600–800</span></td><td className={styles.td}>C-Cl stretch</td><td className={styles.td}>Strong</td></tr>
                      <tr><td className={styles.td}>690–750</td><td className={styles.td}>Aromatic C-H</td><td className={styles.td}>Out-of-plane bend</td></tr>
                    </tbody>
                  </table>
              
                  <div className={styles.mSection}>FUNCTIONAL GROUP DECISION TREE</div>
                  <div className={styles.mRule}>
                    <strong>1.</strong> Is there a <span className={styles.hl}>broad 3200-3550 cm⁻¹</span>? → <strong>alcohol (O-H)</strong><br/>
                    <strong>2.</strong> Is there a <span className={styles.hlOrange}>very broad 2500-3300 cm⁻¹</span>? → <strong>carboxylic acid</strong><br/>
                    <strong>3.</strong> Is there a <span className={styles.hlGreen}>sharp strong ~1715 cm⁻¹</span> but NO broad O-H? → <strong>ketone or aldehyde</strong><br/>
                    <strong>4.</strong> Are there two bands at <span className={styles.hlBlue}>1500 and 1600 cm⁻¹</span>? → <strong>aromatic ring</strong><br/>
                    <strong>5.</strong> Are there strong bands near <span className={styles.hlPurple}>600-800 cm⁻¹</span> with isotope pattern in MS? → <strong>halogen (Cl, Br)</strong>
                  </div>
                  <div className={styles.mDanger}>✗ ABSENCE of a band is as informative as PRESENCE. No O-H means no alcohol or acid.</div>
                  <div className={styles.mNote}>⚠ The fingerprint region (500–1500 cm⁻¹) is complex and unique per compound — use it for confirmation after identifying the functional group.</div>
                </div>
              )}

              {activeTab === 2 && (
                <div className={`${styles.tabPage} ${styles.active}`}>
                  <div className={styles.mSection}>COMMON FRAGMENT IONS</div>
                  <div className={styles.fragGrid}>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 15</div><div className={styles.fragLabel}>CH₃⁺ — methyl cation. Means a methyl group was present.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 29</div><div className={styles.fragLabel}>C₂H₅⁺ or CHO⁺ — ethyl or formyl.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 31</div><div className={styles.fragLabel}>CH₂OH⁺ — hydroxymethyl. Key for primary alcohols.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 43</div><div className={styles.fragLabel}>CH₃CO⁺ — acetyl cation. Indicates methyl ketone or acetate.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 45</div><div className={styles.fragLabel}>CHO₂⁺ or C₂H₅O⁺ — carboxyl or ethoxy.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 77</div><div className={styles.fragLabel}>C₆H₅⁺ — phenyl cation. Benzene ring present.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 91</div><div className={styles.fragLabel}>C₇H₇⁺ — tropylium. Very stable. Means toluene or benzyl group.</div></div>
                    <div className={styles.fragCard}><div className={styles.fragMz}>m/z 83/85</div><div className={styles.fragLabel}>CHCl₂⁺ — dichloromethyl. Two chlorines. Δ2 pattern.</div></div>
                  </div>
              
                  <div className={styles.mSection}>ALCOHOL FRAGMENTATION PATTERN</div>
                  <div className={styles.mRule}>Primary alcohols (R-CH₂-OH) show base peak at <strong>m/z = 31</strong> (CH₂OH⁺).<br/>
                  Secondary alcohols fragment α to OH giving (M-OH)⁺ and (M-H₂O)⁺.<br/>
                  Loss of 18 (water) from M⁺ is common for all alcohols.</div>
              
                  <div className={styles.mSection}>KETONE FRAGMENTATION</div>
                  <div className={styles.mRule}>Ketones undergo α-cleavage — the bond next to C=O breaks. Both resulting acylium ions (R-CO⁺) appear.<br/>
                  For CH₃-CO-CH₃: α-cleavage gives <strong>m/z=43 (CH₃CO⁺)</strong> and m/z=15 (CH₃⁺).</div>
              
                  <div className={styles.mSection}>AROMATIC FRAGMENTATION</div>
                  <div className={styles.mRule}>Monosubstituted benzenes: M⁺ is strong and stable. The benzyl/tropylium ion at <strong>m/z=91</strong> is extremely stable (aromatic 6π system). Series of ring fragments: m/z = 65, 63, 51, 39.</div>
              
                  <div className={styles.mSection}>CARBOXYLIC ACID FRAGMENTATION</div>
                  <div className={styles.mRule}>Acids show M⁺ often as base peak (stable). Characteristic losses:<br/>
                  • M-17 = loss of OH → (M-17) peak<br/>
                  • M-45 = loss of COOH → acyl cation<br/>
                  • Acetic acid: m/z=45 (COOH⁺), m/z=43 (CH₃CO⁺)</div>
              
                  <div className={styles.mSection}>CHLORINE ISOTOPE CLUSTERS</div>
                  <div className={styles.mFormula}>1 Cl atom: M⁺ : M+2 ≈ 3:1{'\n'}2 Cl atoms: M⁺ : M+2 : M+4 ≈ 9:6:1{'\n'}3 Cl atoms: M⁺ : M+2 : M+4 : M+6 ≈ 27:27:9:1{'\n'}  → effectively looks like 1:1:1 for first 3 peaks</div>
                  <div className={styles.mNote}>⚠ CHCl₃ (3 Cl): The molecular ion appears at m/z≈117-122 as a cluster. The base peak is CHCl₂⁺ at m/z 83/85 (also a Cl doublet).</div>
                </div>
              )}

              {activeTab === 3 && (
                <div className={`${styles.tabPage} ${styles.active}`}>
                  <div className={styles.mSection}>SYSTEMATIC DEDUCTION STRATEGY</div>
                  <div className={styles.mRule}><strong>Step 1 — Molecular Weight</strong><br/>Find M⁺ (highest significant peak in MS). This is the molecular weight. Odd MW → nitrogen present (nitrogen rule).</div>
                  <div className={styles.mRule}><strong>Step 2 — Degree of Unsaturation</strong><br/>Calculate DoU = (2C+2-H)/2 (ignore O, add N). DoU=0: saturated. DoU=4: benzene ring.</div>
                  <div className={styles.mRule}><strong>Step 3 — Functional Groups via IR</strong><br/>Work through the IR decision tree (IR Theory tab). Identify any O-H, C=O, aromatic ring, C-Cl bands.</div>
                  <div className={styles.mRule}><strong>Step 4 — Fragment Analysis</strong><br/>Calculate differences between M⁺ and major fragments. Match to neutral loss table (MS Theory tab).</div>
                  <div className={styles.mRule}><strong>Step 5 — Confirm with Boiling Point / Properties</strong><br/>Use the instrumental data table to cross-check physical properties.</div>
              
                  <div className={styles.mSection}>WORKED EXAMPLE — METHANOL (CH₃OH, MW=32)</div>
                  <div className={styles.mRule}>
                    MS: M⁺=32, base peak m/z=31 (CH₂OH⁺, loss of H), m/z=29 (CHO⁺)<br/>
                    IR: Broad O-H at 3350 cm⁻¹, C-O stretch at 1030 cm⁻¹, C-H ~2900 cm⁻¹<br/>
                    DoU = (2×1+2-4)/2 = 0 → saturated<br/>
                    Conclusion: <span className={styles.hlGreen}>primary alcohol, 1 carbon → CH₃OH</span>
                  </div>
              
                  <div className={styles.mSection}>COMMON COMPOUND MOLECULAR WEIGHTS</div>
                  <table className={styles.table}>
                    <thead><tr><th className={styles.th}>MW</th><th className={styles.th}>POSSIBLE FORMULA</th><th className={styles.th}>HINT</th></tr></thead>
                    <tbody className={styles.tbody}>
                      <tr><td className={styles.td}>32</td><td className={styles.td}>CH₄O</td><td className={styles.td}>Methanol</td></tr>
                      <tr><td className={styles.td}>46</td><td className={styles.td}>C₂H₆O</td><td className={styles.td}>Ethanol or dimethyl ether</td></tr>
                      <tr><td className={styles.td}>58</td><td className={styles.td}>C₃H₆O or C₄H₁₀</td><td className={styles.td}>Ketone or butane</td></tr>
                      <tr><td className={styles.td}>60</td><td className={styles.td}>C₂H₄O₂</td><td className={styles.td}>Acetic acid or methyl formate</td></tr>
                      <tr><td className={styles.td}>78</td><td className={styles.td}>C₆H₆</td><td className={styles.td}>Benzene</td></tr>
                      <tr><td className={styles.td}>92</td><td className={styles.td}>C₇H₈</td><td className={styles.td}>Toluene (DoU=4)</td></tr>
                      <tr><td className={styles.td}>117-122</td><td className={styles.td}>CHCl₃</td><td className={styles.td}>Chloroform (isotope cluster)</td></tr>
                    </tbody>
                  </table>
              
                  <div className={styles.mSection}>ELIMINATION CHECKLIST</div>
                  <div className={styles.mRule}>
                    ✓ <strong>Alcohol:</strong> Broad O-H ~3300, m/z=31 or M-18 (water loss), C-O ~1050<br/>
                    ✓ <strong>Ketone:</strong> Sharp C=O ~1715, no O-H, α-cleavage fragments (m/z=43 for CH₃CO)<br/>
                    ✓ <strong>Aromatic:</strong> C-H {'>'}3000, ring at 1500+1600, DoU=4, tropylium m/z=91<br/>
                    ✓ <strong>Acid:</strong> Very broad O-H 2500-3300, C=O ~1710, COOH⁺ at m/z=45<br/>
                    ✓ <strong>Halogen:</strong> Isotope cluster in MS, strong C-X bands {'<'}800 cm⁻¹
                  </div>
                  <div className={styles.mDanger}>✗ Do not guess before checking ALL three: MW, IR functional group, fragment ions.</div>
                  <div className={styles.mNote}>⚠ Player 1 reads the spectra. Player 2 interprets via this manual. Communicate clearly — describe peak positions and heights exactly.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {gameStatus === 'won' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>⬡</div>
          <div className={styles.overlayTitle} style={{ color: 'var(--green)' }}>COMPOUND IDENTIFIED</div>
          <div className={styles.overlaySub}>{puzzleData.name} — {puzzleData.method}</div>
          <div className={styles.overlayCompound}>{puzzleData.formula}</div>
          <button 
            className={styles.overlayBtn} 
            disabled={submitting}
            onClick={() => onSubmit("Solved")}
          >
            {submitting ? "SUBMITTING..." : "VERIFY & SUBMIT"}
          </button>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className={styles.overlay}>
          <div className={styles.overlayIcon}>✗</div>
          <div className={styles.overlayTitle} style={{ color: 'var(--red)' }}>SAMPLE DEGRADED</div>
          <div className={styles.overlaySub}>TIME EXPIRED — COMPOUND UNIDENTIFIED</div>
          <div className={styles.overlayCompound}>Answer: {puzzleData.formula} ({puzzleData.name})</div>
          <button className={styles.overlayBtn} style={{ background: 'var(--red)' }} onClick={() => {
            setGameStatus('playing');
            setTimeLeft(300);
            setHintsUsed(0);
            setStatusMsg('');
            setStatusType('');
            setAnswer('');
          }}>RETRY ANALYSIS</button>
        </div>
      )}
    </div>
  );
}
