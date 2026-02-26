'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
    const searchParams = useSearchParams();
    const tid = (searchParams.get('tid') || '').toUpperCase();
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!tid) { setError('No Team ID in URL. Open /team/login?tid=T01'); return; }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/team/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tid, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
            router.push('/team/waiting');
        } catch {
            setError('Network error. Try again.');
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="terminal-card w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-terminal-green text-3xl font-bold glow-text tracking-widest">PARAALLAX</div>
                    <div className="text-terminal-muted text-xs mt-1 uppercase tracking-widest">CSI Event — Team Login</div>
                </div>

                {/* Blinking cursor bar */}
                <div className="flex items-center gap-2 mb-6 text-terminal-muted text-xs">
                    <span className="animate-blink text-terminal-green">█</span>
                    <span>SYSTEM READY — AUTHENTICATE TO PROCEED</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* TID — locked */}
                    <div>
                        <label className="terminal-header block mb-1">TEAM ID</label>
                        <div className="terminal-input bg-black/80 opacity-70 cursor-not-allowed select-none text-terminal-green">
                            {tid || <span className="text-terminal-red">NO TID IN URL</span>}
                        </div>
                        <p className="text-terminal-muted text-xs mt-1">Pre-assigned. Cannot be changed.</p>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="terminal-header block mb-1" htmlFor="password">ACCESS CODE</label>
                        <input
                            id="password"
                            type="password"
                            className="terminal-input"
                            placeholder="Enter your team password..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="border border-terminal-red text-terminal-red text-sm px-4 py-2 rounded bg-red-950/20">
                            ⚠ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !tid}
                        className="btn-primary w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'AUTHENTICATING...' : '> AUTHENTICATE'}
                    </button>
                </form>

                <div className="mt-6 text-terminal-muted text-xs text-center">
                    URL: <code>/team/login?tid={tid || 'Txx'}</code>
                </div>
            </div>
        </main>
    );
}

export default function TeamLoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-terminal-green">Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
