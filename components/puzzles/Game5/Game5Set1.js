"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./Game5OS.module.css";

const currentSet = {
    answer: "kill 344",
    processes: [
        { pid: "121", user: "root",    state: "R", cmd: "kernel_task" },
        { pid: "233", user: "api",     state: "W", cmd: "worker_pool" },
        { pid: "344", user: "cache",   state: "S", cmd: "redis_svr"  },
        { pid: "455", user: "sync",    state: "W", cmd: "db_sync"    },
        { pid: "566", user: "logger",  state: "S", cmd: "log_agent"  },
        { pid: "677", user: "worker",  state: "W", cmd: "sys_cron"   },
        { pid: "788", user: "backup",  state: "R", cmd: "tar_gzip"   },
        { pid: "899", user: "monitor", state: "S", cmd: "health_chk" },
    ],
    resources: [
        { name: "DB_LOCK",    pid: "455", usage: "88%"  },
        { name: "CACHE_LOCK", pid: "344", usage: "95%"  },
        { name: "LOG_FILE",   pid: "566", usage: "42%"  },
        { name: "THREAD_Q",   pid: "233", usage: "100%" },
        { name: "TEMP_BUF",   pid: "899", usage: "67%"  },
    ],
    waiting: [
        { pid: "233", resource: "DB_LOCK",    time: "04:12" },
        { pid: "455", resource: "CACHE_LOCK", time: "03:55" },
        { pid: "677", resource: "THREAD_Q",   time: "01:30" },
        { pid: "788", resource: "LOG_FILE",   time: "00:45" },
    ],
    releaseLogs: [
        "CACHE_LOCK released",
        "455 → RUNNING",
        "233 → RUNNING",
        "677 → RUNNING",
    ],
};

export default function Game5Set1({ puzzle, onSubmit, submitting }) {

    const idRef = useRef(1);
    const bottomRef = useRef(null);

    const buildInitialLines = () => {
        let id = 1;
        const arr = [];

        arr.push({ id: id++, text: "PARALLAX OS v5.0", type: "system" });
        arr.push({ id: id++, text: "⚠ CRITICAL: PROCESS DEADLOCK DETECTED", type: "error" });

        // ── ps ──────────────────────────────────────────────
        arr.push({ id: id++, text: "$ ps", type: "input" });
        arr.push({
            id: id++, text: "",
            type: "tableHeader",
            columns: ["PID", "USER", "STATE", "COMMAND"],
            tableType: "ps",
        });
        currentSet.processes.forEach(p => {
            arr.push({
                id: id++, text: "",
                type: "tableRow",
                columns: [p.pid, p.user, p.state, p.cmd],
                tableType: "ps",
            });
        });

        arr.push({ id: id++, text: "", type: "output" });

        // ── resource-map ─────────────────────────────────────
        arr.push({ id: id++, text: "$ resource-map", type: "input" });
        arr.push({
            id: id++, text: "",
            type: "tableHeader",
            columns: ["RESOURCE", "LOCKED_BY", "USAGE_PCT"],
            tableType: "resource",
        });
        currentSet.resources.forEach(r => {
            arr.push({
                id: id++, text: "",
                type: "tableRow",
                columns: [r.name, r.pid, r.usage],
                tableType: "resource",
            });
        });

        arr.push({ id: id++, text: "", type: "output" });

        // ── waiting-list ──────────────────────────────────────
        arr.push({ id: id++, text: "$ waiting-list", type: "input" });
        arr.push({
            id: id++, text: "",
            type: "tableHeader",
            columns: ["PID", "WAITING_FOR", "TIME_WAIT"],
            tableType: "waiting",
        });
        currentSet.waiting.forEach(w => {
            arr.push({
                id: id++, text: "",
                type: "tableRow",
                columns: [w.pid, w.resource, w.time],
                tableType: "waiting",
            });
        });

        arr.push({ id: id++, text: "", type: "output" });
        arr.push({ id: id++, text: "Identify root blocker. Use command: kill <PID>", type: "system" });

        idRef.current = id;
        return arr;
    };

    const [lines, setLines] = useState(buildInitialLines);
    const [input, setInput] = useState("");
    const [complete, setComplete] = useState(false);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [lines]);

    const print = (text, type = "output") => {
        setLines(prev => [...prev, { id: idRef.current++, text, type }]);
    };

    const handleCommand = (cmd) => {
        if (complete) return;

        const clean = cmd.trim().toLowerCase();
        print(`> ${cmd}`, "input");

        if (clean === currentSet.answer) {
            print(`Terminating process ${clean.split(" ")[1]}...`, "system");

            setTimeout(() => {
                print("Releasing locked resources...", "system");
                currentSet.releaseLogs.forEach(log => print(log, "output"));
                print("SYSTEM STABLE ✅", "success");
                setComplete(true);
            }, 800);

            return;
        }

        if (clean.startsWith("kill")) {
            print("Incorrect process terminated ❌", "error");
            print("Deadlock persists...", "error");
            fetch("/api/team/add-penalty", { method: "POST" });
            return;
        }

        print("Invalid command", "error");
        fetch("/api/team/add-penalty", { method: "POST" });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleCommand(input);
        setInput("");
    };

    const getGridClass = (tableType) => {
        if (tableType === "ps")       return styles.psRow;
        if (tableType === "resource") return styles.resourceRow;
        if (tableType === "waiting")  return styles.waitingRow;
        return "";
    };

    return (
        <div className={styles.container}>
            <div className={styles.outputArea}>
                {lines.map(line => {
                    if (line.type === "tableHeader" || line.type === "tableRow") {
                        return (
                            <div
                                key={line.id}
                                className={[
                                    styles.tableRowBase,
                                    getGridClass(line.tableType),
                                    line.type === "tableHeader" ? styles.tableHeader : styles.tableDataRow,
                                ].join(" ")}
                            >
                                {line.columns.map((col, i) => (
                                    <span key={i}>{col}</span>
                                ))}
                            </div>
                        );
                    }
                    return (
                        <div key={line.id} className={`${styles.line} ${styles[line.type]}`}>
                            {line.text}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {!complete ? (
                <form className={styles.inputArea} onSubmit={handleSubmit}>
                    <span className={styles.prompt}>{">"}</span>
                    <input
                        className={styles.textInput}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoFocus
                    />
                </form>
            ) : (
                <div className={styles.inputArea}>
                    <span className={styles.success}>
                        <button className={styles.proceedBtn} disabled={submitting} onClick={() => onSubmit("Solved")}>
                            {submitting ? 'SUBMITTING...' : 'SUBMIT PROCESS LOGS'}
                        </button>
                    </span>
                </div>
            )}
        </div>
    );
}
