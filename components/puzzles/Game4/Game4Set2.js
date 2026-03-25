"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styles from "./Game4Firewall.module.css";

const GRID_SIZE = 7;
const START_TIME = 120;
const THROTTLE_MS = 150;
const COLLISION_PENALTY = 15;
const COLLISION_RESET_DELAY = 800;

const MOVE_VECTORS = {
  UP: { dx: 0, dy: 1 },
  DOWN: { dx: 0, dy: -1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

function getCorrectMove(x, y) {
  const sum = x + y;

  if (sum % 2 === 0) {
    return x < y ? "UP" : "RIGHT";
  }

  return x < y ? "LEFT" : "DOWN";
}

function isWithinGrid(x, y) {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

export default function Game4Set2({ puzzle, onSubmit, submitting }) {
  const currentSet = {
    label: "SECTOR BETA",
    start: [3, 4],
    target: [0, 6],
  };

  const [pos, setPos] = useState({
    x: currentSet.start[0],
    y: currentSet.start[1],
  });
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [status, setStatus] = useState("idle");
  const [lastMoveLabel, setLastMoveLabel] = useState(null);

  const statusRef = useRef(status);
  const posRef = useRef(pos);
  const lastMoveTimeRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    setPos({ x: currentSet.start[0], y: currentSet.start[1] });
    setTimeLeft(START_TIME);
    setStatus("idle");
    setLastMoveLabel(null);
  }, [currentSet.start[0], currentSet.start[1]]);

  const startGame = () => {
    setPos({ x: currentSet.start[0], y: currentSet.start[1] });
    setTimeLeft(START_TIME);
    setStatus("playing");
    setLastMoveLabel(null);
  };

  const triggerCollision = useCallback(() => {
    setStatus("hit");
    setTimeLeft((prev) => Math.max(0, prev - COLLISION_PENALTY));

    setTimeout(() => {
      if (statusRef.current === "hit") {
        setPos({ x: currentSet.start[0], y: currentSet.start[1] });
        setLastMoveLabel(null);
        setStatus("playing");
      }
    }, COLLISION_RESET_DELAY);
  }, [currentSet.start[0], currentSet.start[1]]);

  const handleMove = useCallback(
    (attemptedMove) => {
      if (statusRef.current !== "playing") return;

      const now = Date.now();
      if (now - lastMoveTimeRef.current < THROTTLE_MS) return;
      lastMoveTimeRef.current = now;

      const { x, y } = posRef.current;
      const correctMove = getCorrectMove(x, y);
      const vector = MOVE_VECTORS[attemptedMove];
      const nextX = x + vector.dx;
      const nextY = y + vector.dy;

      setLastMoveLabel(attemptedMove);

      if (attemptedMove !== correctMove || !isWithinGrid(nextX, nextY)) {
        triggerCollision();
        return;
      }

      setPos({ x: nextX, y: nextY });

      if (nextX === currentSet.target[0] && nextY === currentSet.target[1]) {
        setStatus("success");
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeout(() => onSubmit("Solved"), 2000);
      }
    },
    [currentSet.target[0], currentSet.target[1], triggerCollision]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (statusRef.current !== "playing") return;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          handleMove("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          handleMove("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          handleMove("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          handleMove("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  useEffect(() => {
    if (status === "playing") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setStatus("failed");
            fetch("/api/team/add-penalty", { method: "POST" });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatTime = (time) => {
    const m = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const s = (time % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (status === "idle") {
    return (
      <div className={styles.container}>
        <div className={styles.hudWrapper}>
          <div className={styles.setBadge}>{currentSet.label}</div>
          <h2 className={styles.title}>COORDINATION DECISION SYSTEM</h2>
          <p className={styles.brief}>
            Movement is validated by protocol logic only.
            <br />
            The operator may move in four directions, but only one move is valid
            at any position.
            <br />
            Start: {currentSet.start[0]}, {currentSet.start[1]} | Target:{" "}
            {currentSet.target[0]}, {currentSet.target[1]} | Grid: {GRID_SIZE}x
            {GRID_SIZE} | Time Limit: 2:00
          </p>
          <button className={styles.initBtn} onClick={startGame}>
            BREACH FIREWALL
          </button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className={styles.container}>
        <div className={styles.hudWrapper}>
          <div className={styles.setBadge}>{currentSet.label}</div>
          <h2 className={styles.failedTitle}>CONNECTION TERMINATED</h2>
          <p className={styles.brief}>
            Time expired. COORDINATION DECISION SYSTEM has locked the route.
          </p>
          <button className={styles.initBtn} onClick={startGame}>
            RETRY BREACH
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={styles.container}>
        <div className={styles.hudWrapper}>
          <div className={styles.setBadge}>{currentSet.label}</div>
          <h2 className={styles.successTitle}>FIREWALL BYPASSED</h2>
          <p className={styles.brief}>
            Target reached. Decision protocol executed successfully.
          </p>
          <div className="text-terminal-green animate-pulse">SUBMITTING FIREWALL COMPLETION...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${status === "hit" ? styles.shakeRed : ""}`}>
      <div className={styles.topHud}>
        <div className={styles.hudText}>
          UPLINK ESTABLISHED | {currentSet.label}
        </div>
        <div className={`${styles.timer} ${timeLeft <= 30 ? styles.timerAlert : ""}`}>
          TIME: {formatTime(timeLeft)}
        </div>
      </div>

      <div className={styles.radarLayout}>
        {status === "hit" ? (
          <div className={styles.criticalErrorBox}>
            <h1>INVALID MOVE</h1>
            <p>PROTOCOL BREACH DETECTED</p>
            <span>-{COLLISION_PENALTY}s PENALTY</span>
          </div>
        ) : (
          <div className={styles.sensorGrid}>
            <div className={styles.centerPos}>
              <div className={styles.posLabel}>POS</div>
              <div className={styles.posValue}>
                X:{pos.x} Y:{pos.y}
              </div>
            </div>
          </div>
        )}

        <div className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>TARGET</div>
            <div className={styles.infoValue}>
              X:{currentSet.target[0]} Y:{currentSet.target[1]}
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoLabel}>LAST INPUT</div>
            <div className={styles.infoValue}>{lastMoveLabel ?? "--"}</div>
          </div>
        </div>

        <div className={styles.dpad}>
          <div className={styles.emptyKey} />
          <button className={styles.keyBtn} onClick={() => handleMove("UP")}>
            ▲
          </button>
          <div className={styles.emptyKey} />

          <button className={styles.keyBtn} onClick={() => handleMove("LEFT")}>
            ◀
          </button>
          <div className={styles.keyBtnCenter}></div>
          <button className={styles.keyBtn} onClick={() => handleMove("RIGHT")}>
            ▶
          </button>

          <div className={styles.emptyKey} />
          <button className={styles.keyBtn} onClick={() => handleMove("DOWN")}>
            ▼
          </button>
          <div className={styles.emptyKey} />
        </div>
      </div>

      <div className={styles.bottomHud}>
        <div className={styles.hudText}>RULE ENGINE ACTIVE</div>
        <div className={styles.hudText}>GRID: {GRID_SIZE}x{GRID_SIZE}</div>
      </div>
    </div>
  );
}
