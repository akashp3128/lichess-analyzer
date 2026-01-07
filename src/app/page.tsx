'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Crown, Target, TrendingUp, Zap, Brain, ChevronRight, BarChart3, Crosshair } from 'lucide-react';

// Floating chess piece component
function FloatingPiece({ piece, className }: { piece: string; className: string }) {
  return (
    <div className={`chess-piece animate-float ${className}`} aria-hidden="true">
      {piece}
    </div>
  );
}

// Stat card for social proof
function StatCard({ value, label, delay }: { value: string; label: string; delay: string }) {
  return (
    <div className={`animate-fade-in-up opacity-0 ${delay} text-center`}>
      <div className="text-3xl font-bold text-gradient stat-number">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
}

// Feature pill component
function FeaturePill({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-4 py-2 text-sm text-slate-300">
      <Icon className="h-4 w-4 text-amber-500" />
      <span>{text}</span>
    </div>
  );
}

// Sample insight preview
function InsightPreview() {
  return (
    <div className="gradient-border p-6 animate-fade-in-up opacity-0 delay-400">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">Sample Analysis</span>
        <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">Preview</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Accuracy</span>
          <span className="text-emerald-400 font-semibold">87.3%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full w-[87%] bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
        </div>
        <div className="flex justify-between text-sm text-slate-500">
          <span>2 blunders</span>
          <span>5 mistakes</span>
          <span>8 inaccuracies</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-surface-900)]">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern" />
      <div className="absolute inset-0 spotlight" />

      {/* Floating chess pieces */}
      <FloatingPiece piece="♔" className="top-[15%] left-[10%] text-amber-500/10" />
      <FloatingPiece piece="♕" className="top-[25%] right-[15%] text-amber-500/10 delay-200" />
      <FloatingPiece piece="♘" className="bottom-[20%] left-[20%] text-amber-500/10 delay-300" />
      <FloatingPiece piece="♖" className="bottom-[30%] right-[10%] text-amber-500/10 delay-100" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">

          {/* Hero section */}
          <div className="mb-12 flex flex-col items-center text-center">
            {/* Logo with glow */}
            <div className="mb-6 animate-scale-in">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-amber-500 blur-xl opacity-30 animate-pulse-glow" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <Crown className="h-10 w-10 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="animate-fade-in-up opacity-0 text-4xl sm:text-5xl font-bold text-white mb-4">
              Lichess <span className="text-gradient">Analyzer</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up opacity-0 delay-100 text-lg text-slate-400 max-w-md">
              Deep-dive into your chess games with AI-powered Stockfish analysis.
              Find patterns, fix weaknesses, level up.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-6 animate-fade-in-up opacity-0 delay-200">
              <FeaturePill icon={Brain} text="Stockfish 16" />
              <FeaturePill icon={BarChart3} text="Visual Insights" />
              <FeaturePill icon={Crosshair} text="Mistake Heatmaps" />
            </div>
          </div>

          {/* Main form card */}
          <div className="glass rounded-2xl p-8 animate-fade-in-up opacity-0 delay-300">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Your Lichess Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., DrNykterstein"
                  className="input-glow w-full rounded-xl border border-slate-600 bg-slate-800/50 px-5 py-4 text-white placeholder-slate-500 transition-all focus:border-amber-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 animate-scale-in">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !username.trim()}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none disabled:shadow-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
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
                  <>
                    Analyze My Games
                    <ChevronRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-slate-500">
              Analyzes your last 20 rated rapid & classical games
            </p>
          </div>

          {/* Social proof stats */}
          <div className="mt-12 grid grid-cols-3 gap-8">
            <StatCard value="50K+" label="Games Analyzed" delay="delay-400" />
            <StatCard value="20+" label="Metrics Tracked" delay="delay-500" />
            <StatCard value="100%" label="Free Forever" delay="delay-500" />
          </div>

          {/* Sample insight preview */}
          <div className="mt-12">
            <InsightPreview />
          </div>

          {/* Scout opponent CTA */}
          <div className="mt-10 animate-fade-in-up opacity-0 delay-500">
            <Link
              href="/scout"
              className="group flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/30 px-6 py-4 text-slate-300 transition-all hover:bg-slate-800/60 hover:border-slate-600 hover:text-white"
            >
              <Target className="h-5 w-5 text-amber-500" />
              <span>Scout an Opponent</span>
              <ChevronRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">
              Analyze your next opponent&apos;s openings and weaknesses before a game
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
