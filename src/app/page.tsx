'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Target } from 'lucide-react';

export default function Home() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `/api/games?username=${encodeURIComponent(username.trim())}&max=20`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch games');
      }

      router.push(`/dashboard?username=${encodeURIComponent(username.trim())}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-amber-500">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Lichess Analyzer</h1>
          <p className="mt-2 text-center text-slate-400">
            Analyze your chess games with Stockfish engine
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Lichess Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Lichess username"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim()}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Fetching games...
              </span>
            ) : (
              'Analyze Games'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Analyzes your last 20 rated games</p>
        </div>

        <div className="mt-8 border-t border-slate-700 pt-8">
          <Link
            href="/scout"
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-3 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <Target className="h-5 w-5" />
            Scout an Opponent
          </Link>
          <p className="mt-2 text-center text-xs text-slate-500">
            Analyze opponent's openings and weaknesses before a game
          </p>
        </div>
      </div>
    </div>
  );
}
