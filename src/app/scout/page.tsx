'use client';

import { useState } from 'react';
import { Search, ArrowLeft, Target, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Crown } from 'lucide-react';
import Link from 'next/link';

interface OpeningFrequency {
  name: string;
  eco: string;
  count: number;
  percentage: number;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ColorStats {
  games: number;
  winRate: number;
  avgRating: number;
  favoriteOpenings: OpeningFrequency[];
}

interface TimeControlStats {
  timeControl: string;
  games: number;
  winRate: number;
}

interface PerformancePattern {
  type: string;
  description: string;
  value: number;
}

interface ScoutReport {
  username: string;
  rating: number | null;
  totalGames: number;
  overallWinRate: number;
  asWhite: ColorStats;
  asBlack: ColorStats;
  timeControlStats: TimeControlStats[];
  recentForm: {
    last10WinRate: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  patterns: PerformancePattern[];
  suggestedPreparation: string[];
}

function TrendIcon({ trend }: { trend: 'improving' | 'declining' | 'stable' }) {
  if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-400" />;
  if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function OpeningsList({ openings, color }: { openings: OpeningFrequency[]; color: 'white' | 'black' }) {
  if (openings.length === 0) {
    return <p className="text-sm text-slate-500">No opening data available</p>;
  }

  return (
    <div className="space-y-2">
      {openings.map((opening, i) => (
        <div
          key={opening.eco}
          className="flex items-center justify-between rounded-lg bg-slate-700/50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-500">{opening.eco}</span>
            <span className="text-sm text-white truncate max-w-[180px]" title={opening.name}>
              {opening.name.split(':')[0]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{opening.percentage}%</span>
            <span className={opening.winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
              {opening.winRate}% WR
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ScoutPage() {
  const [searchUsername, setSearchUsername] = useState('');
  const [report, setReport] = useState<ScoutReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    setLoading(true);
    setError('');
    setReport(null);

    try {
      const res = await fetch(`/api/scout/${encodeURIComponent(searchUsername.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch scout report');
      }

      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Opponent Scout</h1>
            <p className="text-sm text-slate-400">Pre-game preparation tool</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="Enter opponent's Lichess username..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchUsername.trim()}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 font-medium hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Target className="h-5 w-5" />
                  Scout
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{report.username}</h2>
                  <p className="text-slate-400">
                    {report.rating ? `Rating: ${report.rating}` : 'Rating: Unknown'} • {report.totalGames} games analyzed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{report.overallWinRate}%</div>
                  <p className="text-sm text-slate-400">Overall Win Rate</p>
                </div>
              </div>

              {/* Recent Form */}
              <div className="mt-4 flex items-center gap-4 rounded-lg bg-slate-700/50 p-3">
                <TrendIcon trend={report.recentForm.trend} />
                <div>
                  <p className="text-sm">
                    Last 10 games: <span className="font-medium">{report.recentForm.last10WinRate}%</span> win rate
                  </p>
                  <p className="text-xs text-slate-400">
                    {report.recentForm.trend === 'improving' && 'On an upswing - be careful!'}
                    {report.recentForm.trend === 'declining' && 'Recent struggles - opportunity to exploit'}
                    {report.recentForm.trend === 'stable' && 'Consistent recent performance'}
                  </p>
                </div>
              </div>
            </div>

            {/* Color Stats */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* As White */}
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm bg-white" />
                  <h3 className="font-semibold">As White</h3>
                  <span className="ml-auto text-sm text-slate-400">{report.asWhite.games} games</span>
                </div>
                <div className="mb-4 text-center">
                  <div className={`text-2xl font-bold ${report.asWhite.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.asWhite.winRate}%
                  </div>
                  <p className="text-xs text-slate-400">Win Rate</p>
                </div>
                <h4 className="mb-2 text-sm font-medium text-slate-300">Favorite Openings</h4>
                <OpeningsList openings={report.asWhite.favoriteOpenings} color="white" />
              </div>

              {/* As Black */}
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-4 w-4 rounded-sm bg-slate-900 border border-slate-600" />
                  <h3 className="font-semibold">As Black</h3>
                  <span className="ml-auto text-sm text-slate-400">{report.asBlack.games} games</span>
                </div>
                <div className="mb-4 text-center">
                  <div className={`text-2xl font-bold ${report.asBlack.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {report.asBlack.winRate}%
                  </div>
                  <p className="text-xs text-slate-400">Win Rate</p>
                </div>
                <h4 className="mb-2 text-sm font-medium text-slate-300">Favorite Openings</h4>
                <OpeningsList openings={report.asBlack.favoriteOpenings} color="black" />
              </div>
            </div>

            {/* Patterns & Weaknesses */}
            {report.patterns.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold">Patterns & Weaknesses</h3>
                </div>
                <div className="space-y-2">
                  {report.patterns.map((pattern, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg bg-slate-700/50 px-4 py-3"
                    >
                      <div className={`h-2 w-2 rounded-full ${
                        pattern.type === 'weak_opening' ? 'bg-red-400' :
                        pattern.type === 'opening_narrow' ? 'bg-amber-400' :
                        'bg-blue-400'
                      }`} />
                      <span className="text-sm">{pattern.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preparation Suggestions */}
            {report.suggestedPreparation.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-amber-200">Preparation Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {report.suggestedPreparation.map((suggestion, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-100">
                      <Crown className="h-4 w-4 mt-0.5 text-amber-400 flex-shrink-0" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Time Control Stats */}
            {report.timeControlStats.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h3 className="mb-4 font-semibold">Performance by Time Control</h3>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {report.timeControlStats.map((tc) => (
                    <div
                      key={tc.timeControl}
                      className="rounded-lg bg-slate-700/50 p-3 text-center"
                    >
                      <div className="text-lg font-medium capitalize">{tc.timeControl}</div>
                      <div className={`text-xl font-bold ${tc.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {tc.winRate}%
                      </div>
                      <p className="text-xs text-slate-400">{tc.games} games</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!report && !loading && !error && (
          <div className="text-center py-16 text-slate-500">
            <Target className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Enter an opponent's username to scout them</p>
            <p className="text-sm mt-2">Get insights on their openings, patterns, and weaknesses</p>
          </div>
        )}
      </main>
    </div>
  );
}
