"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./Game7MRMAS.module.css";

const config = {
  label: "ALPHA",
  mode: "PROTECTED",
  cache: "ENABLED",
  subtitle: "Decode 3 protected memory requests in sequence.",
  finalRuleText: "1st + 3rd + 2nd",
  finalAnswer: "RAM",
  requests: [
    { id: 1, binary: "101101", answer: "R" },
    { id: 2, binary: "010010", answer: "M" },
    { id: 3, binary: "110100", answer: "A" },
  ],
};

function buildRequests(conf) {
  return conf.requests.map((req, index) => ({
    ...req,
    status: index === 0 ? "PENDING" : "LOCKED",
    output: "_",
  }));
}

export default function Game7Set1({ puzzle, onSubmit, submitting }) {
  const [requests, setRequests] = useState(() => buildRequests(config));
  const [reqInput, setReqInput] = useState("");
  const [reqMsg, setReqMsg] = useState(null);

  const [allSolved, setAllSolved] = useState(false);
  const [finalInput, setFinalInput] = useState("");
  const [finalMsg, setFinalMsg] = useState(null);
  const [granted, setGranted] = useState(false);

  const [blink, setBlink] = useState(true);

  const bottomRef = useRef(null);

  useEffect(() => {
    setRequests(buildRequests(config));
    setReqInput("");
    setReqMsg(null);
    setAllSolved(false);
    setFinalInput("");
    setFinalMsg(null);
    setGranted(false);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setBlink((prev) => !prev), 530);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [requests, allSolved, reqMsg, finalMsg, granted]);

  const activeIndex = requests.findIndex((req) => req.status === "PENDING");

  const handleReqSubmit = () => {
    if (activeIndex === -1) return;

    const trimmed = reqInput.trim().toUpperCase();
    if (!trimmed) return;

    const active = requests[activeIndex];

    if (trimmed === active.answer) {
      const updated = requests.map((req, index) => {
        if (index === activeIndex) {
          return { ...req, status: "SOLVED", output: req.answer };
        }

        if (index === activeIndex + 1) {
          return { ...req, status: "PENDING" };
        }

        return req;
      });

      setRequests(updated);
      setReqMsg({ text: `REQ ${active.id} SOLVED — OUTPUT RECORDED`, ok: true });

      if (activeIndex === requests.length - 1) {
        setAllSolved(true);
      }
    } else {
      setReqMsg({ text: "INVALID REQUEST OUTPUT", ok: false });
    }

    setReqInput("");
  };

  const handleFinalSubmit = () => {
    const trimmed = finalInput.trim().toUpperCase();
    if (!trimmed) return;

    if (trimmed === config.finalAnswer) {
      setFinalMsg({ text: "ACCESS GRANTED — FINAL ANSWER ACCEPTED", ok: true });
      setGranted(true);

      setTimeout(() => onSubmit("Solved"), 2200);
    } else {
      setFinalMsg({ text: "INVALID FINAL ASSEMBLY", ok: false });
    }

    setFinalInput("");
  };

  const onReqKey = (e) => {
    if (e.key === "Enter") handleReqSubmit();
  };

  const onFinalKey = (e) => {
    if (e.key === "Enter") handleFinalSubmit();
  };

  const statusClass = (status) => {
    if (status === "SOLVED") return styles.statusSolved;
    if (status === "PENDING") return styles.statusPending;
    return styles.statusLocked;
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.metaRow}>
            <span className={styles.setBadge}>SET: {config.label}</span>
            <div className={styles.systemBadges}>
              <span className={styles.systemChip}>MODE: {config.mode}</span>
              <span className={styles.systemChip}>CACHE: {config.cache}</span>
            </div>
          </div>

          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🧩</span>
            Multi-Request Memory Access System
          </h1>

          <p className={styles.subtitle}>{config.subtitle}</p>
          <div className={styles.headerDivider} />
        </header>

        <div className={styles.objectivePanel}>
          <div className={styles.objTitle}>🎯 OBJECTIVE</div>
          <ol className={styles.objList}>
            <li>Solve 3 binary memory requests sequentially</li>
            <li>Each request gives 1 letter</li>
            <li>Final answer = {config.finalRuleText}</li>
          </ol>
        </div>

        <div className={styles.terminal}>
          <div className={styles.termLine}>
            <span className={styles.prompt}>&gt;</span> SYSTEM INITIALIZED...
          </div>

          <div className={styles.termLine}>
            <span className={styles.prompt}>&gt;</span> MEMORY ACCESS TERMINAL
          </div>

          <div className={styles.termBlank} />

          <div className={styles.termLine}>
            <span className={styles.dim}>SET ID:</span>{" "}
            <span className={styles.accent}>{config.label}</span>
          </div>

          <div className={styles.termLine}>
            <span className={styles.dim}>MODE:</span>{" "}
            <span className={styles.accent}>{config.mode}</span>
            {"    "}
            <span className={styles.dim}>CACHE:</span>{" "}
            <span className={styles.accent}>{config.cache}</span>
          </div>

          <div className={styles.termSection}>REQUEST QUEUE</div>

          {requests.map((req) => (
            <div key={req.id} className={styles.reqRow}>
              <span className={styles.reqLabel}>REQ {req.id}</span>
              <span className={styles.reqColon}>:</span>
              <span className={styles.reqBinary}>{req.binary}</span>
              <span className={`${styles.reqStatus} ${statusClass(req.status)}`}>
                [{req.status}]
              </span>
            </div>
          ))}

          <div className={styles.termSection}>OUTPUT</div>

          {requests.map((req) => (
            <div key={req.id} className={styles.outRow}>
              <span className={styles.outLabel}>REQ {req.id} OUTPUT</span>
              <span className={styles.outColon}>:</span>
              <span className={req.status === "SOLVED" ? styles.outSolved : styles.outBlank}>
                {req.output}
              </span>
            </div>
          ))}

          {!allSolved && (
            <>
              <div className={styles.termSection}>INSTRUCTION</div>

              <div className={`${styles.termLine} ${styles.dim}`}>
                Solve requests in order. Enter the decoded letter for the active request.
              </div>

              {activeIndex !== -1 && (
                <div className={styles.termLine}>
                  <span className={styles.accent}>ACTIVE →</span> REQ{" "}
                  {requests[activeIndex].id} : {requests[activeIndex].binary}
                </div>
              )}
            </>
          )}

          {!allSolved && (
            <div className={styles.inputSection}>
              <div className={styles.inputPromptLabel}>Enter request output:</div>

              <div className={styles.inputRow}>
                <span className={styles.inputCaret}>&gt;_</span>

                <input
                  className={styles.termInput}
                  type="text"
                  maxLength={1}
                  value={reqInput}
                  onChange={(e) => {
                    setReqInput(e.target.value);
                    setReqMsg(null);
                  }}
                  onKeyDown={onReqKey}
                  placeholder="X"
                  autoFocus
                  disabled={activeIndex === -1 || granted}
                />

                <button
                  className={styles.termBtn}
                  onClick={handleReqSubmit}
                  disabled={!reqInput.trim() || activeIndex === -1}
                >
                  SUBMIT
                </button>
              </div>

              {reqMsg && (
                <div className={`${styles.termMsg} ${reqMsg.ok ? styles.msgOk : styles.msgErr}`}>
                  {reqMsg.ok ? "✓" : "✗"} {reqMsg.text}
                </div>
              )}
            </div>
          )}

          {allSolved && (
            <>
              <div className={styles.termBlank} />

              <div className={styles.allSolvedBanner}>
                ══════════════════════════════════════
              </div>

              <div className={styles.allSolvedText}>ALL REQUESTS COMPLETED</div>

              <div className={styles.allSolvedBanner}>
                ══════════════════════════════════════
              </div>

              <div className={styles.termBlank} />

              <div className={`${styles.termLine} ${styles.dim}`}>
                FINAL RULE: Arrange outputs as → {config.finalRuleText}
              </div>

              <div className={styles.termBlank} />

              {!granted ? (
                <div className={styles.inputSection}>
                  <div className={styles.inputPromptLabel}>Enter final answer:</div>

                  <div className={styles.inputRow}>
                    <span className={styles.inputCaret}>&gt;_</span>

                    <input
                      className={styles.termInput}
                      type="text"
                      maxLength={3}
                      value={finalInput}
                      onChange={(e) => {
                        setFinalInput(e.target.value);
                        setFinalMsg(null);
                      }}
                      onKeyDown={onFinalKey}
                      placeholder="XXX"
                      autoFocus
                      disabled={submitting}
                    />

                    <button
                      className={styles.termBtn}
                      onClick={handleFinalSubmit}
                      disabled={!finalInput.trim() || submitting}
                    >
                      {submitting ? 'SUBMITTING...' : 'SUBMIT'}
                    </button>
                  </div>

                  {finalMsg && (
                    <div className={`${styles.termMsg} ${finalMsg.ok ? styles.msgOk : styles.msgErr}`}>
                      {finalMsg.ok ? "✓" : "✗"} {finalMsg.text}
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.grantedPanel}>
                  <div className={styles.grantedIcon}>✅</div>
                  <div className={styles.grantedTitle}>ACCESS GRANTED</div>
                  <div className={styles.grantedSub}>FINAL ANSWER ACCEPTED</div>
                </div>
              )}
            </>
          )}

          {!granted && (
            <div className={styles.cursorLine}>
              <span className={blink ? styles.cursorOn : styles.cursorOff}>█</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
