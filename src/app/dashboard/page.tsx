'use client';

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, RefreshCw, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { GameWithAnalysis, UserStats, AnalysisProgress } from '@/types';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { GamesList } from '@/components/dashboard/GamesList';
import { RatingChart } from '@/components/charts/RatingChart';
import { OpeningStatsChart } from '@/components/charts/OpeningStatsChart';
import { MistakeHeatmap } from '@/components/charts/MistakeHeatmap';
import { PhaseStatsChart } from '@/components/charts/PhaseStatsChart';
import { TimeTroubleChart } from '@/components/charts/TimeTroubleChart';
import { WeaknessReport } from '@/components/charts/WeaknessReport';
import { TiltChart } from '@/components/charts/TiltChart';
import { EndgameChart } from '@/components/charts/EndgameChart';
import { AnalysisRunner } from '@/components/dashboard/AnalysisRunner';
import { PuzzleTrainer } from '@/components/dashboard/PuzzleTrainer';
import { ProgressTracker } from '@/components/charts/ProgressTracker';
import { PeerBenchmark } from '@/components/charts/PeerBenchmark';

function DashboardContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get('username');

  const [games, setGames] = useState<GameWithAnalysis[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);

  // Use ref to store games for analysis to prevent re-renders
  const gamesToAnalyzeRef = useRef<GameWithAnalysis[]>([]);

  const fetchData = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    try {
      const [gamesRes, statsRes] = await Promise.all([
        fetch(`/api/games?username=${encodeURIComponent(username)}&max=20`),
        fetch(`/api/stats/${encodeURIComponent(username)}`),
      ]);

      const gamesData = await gamesRes.json();
      if (!gamesRes.ok) throw new Error(gamesData.error);

      setGames(gamesData.games);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const unanalyzedGames = games.filter((g) => !g.analysis);
  const analyzedCount = games.filter((g) => g.analysis).length;

  // Memoize callbacks to prevent re-renders
  const handleProgress = useCallback((progress: AnalysisProgress) => {
    setAnalysisProgress(progress);
  }, []);

  const handleComplete = useCallback(() => {
    setAnalyzing(false);
    setAnalysisProgress(null);
    fetchData();
  }, [fetchData]);

  const handleStartAnalysis = useCallback(() => {
    gamesToAnalyzeRef.current = unanalyzedGames;
    setAnalyzing(true);
  }, [unanalyzedGames]);

  if (!username) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">No username provided</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">{username}</h1>
              <p className="text-sm text-slate-400">
                {games.length} games ({analyzedCount} analyzed)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-8">
            {unanalyzedGames.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Game Analysis</h2>
                    <p className="text-sm text-slate-400">
                      {unanalyzedGames.length} games ready to analyze
                    </p>
                  </div>
                  {!analyzing ? (
                    <button
                      onClick={handleStartAnalysis}
                      className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-medium hover:bg-amber-600"
                    >
                      <Play className="h-4 w-4" />
                      Start Analysis
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      Analyzing...
                    </div>
                  )}
                </div>
                {analyzing && (
                  <AnalysisRunner
                    games={gamesToAnalyzeRef.current}
                    onProgress={handleProgress}
                    onComplete={handleComplete}
                  />
                )}
                {analysisProgress && (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Game {analysisProgress.current} / {analysisProgress.total}</span>
                      {analysisProgress.currentMove && analysisProgress.totalMoves && (
                        <span className="text-slate-400">
                          Move {analysisProgress.currentMove} / {analysisProgress.totalMoves}
                        </span>
                      )}
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{
                          width: `${(analysisProgress.current / analysisProgress.total) * 100}%`,
                        }}
                      />
                    </div>
                    {analysisProgress.currentMove && analysisProgress.totalMoves && (
                      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{
                            width: `${(analysisProgress.currentMove / analysisProgress.totalMoves) * 100}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {analyzedCount === games.length && games.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-4 text-green-400">
                <CheckCircle className="h-5 w-5" />
                All games have been analyzed
              </div>
            )}

            {stats && <StatsOverview stats={stats} />}

            {stats && stats.weaknessReport && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Improvement Insights</h2>
                <WeaknessReport data={stats.weaknessReport} />
              </div>
            )}

            {analyzedCount > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Progress Tracking</h2>
                <ProgressTracker username={username} />
              </div>
            )}

            {analyzedCount >= 3 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Peer Comparison</h2>
                <p className="mb-4 text-sm text-slate-400">
                  See how you compare to players at your rating level
                </p>
                <PeerBenchmark username={username} />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {stats && stats.ratingHistory.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                  <h2 className="mb-4 text-lg font-semibold">Rating History</h2>
                  <RatingChart data={stats.ratingHistory} />
                </div>
              )}

              {stats && stats.openingStats.length > 0 && (
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                  <h2 className="mb-4 text-lg font-semibold">Opening Performance</h2>
                  <OpeningStatsChart data={stats.openingStats} games={games} />
                </div>
              )}
            </div>

            {stats && stats.phaseStats && stats.phaseStats.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Performance by Phase</h2>
                <PhaseStatsChart data={stats.phaseStats} />
              </div>
            )}

            {stats && stats.timeTroubleStats && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Time Trouble Analysis</h2>
                <TimeTroubleChart data={stats.timeTroubleStats} />
              </div>
            )}

            {stats && stats.tiltStats && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Tilt Analysis</h2>
                <TiltChart data={stats.tiltStats} />
              </div>
            )}

            {stats && stats.endgameReport && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Endgame Performance</h2>
                <EndgameChart data={stats.endgameReport} />
              </div>
            )}

            {stats && stats.mostCommonMistakeSquares.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Mistake Heatmap</h2>
                <MistakeHeatmap data={stats.mostCommonMistakeSquares} />
              </div>
            )}

            {analyzedCount > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-slate-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">Practice Your Mistakes</h2>
                <p className="mb-4 text-sm text-slate-400">
                  Train on positions where you made errors to avoid repeating them
                </p>
                <PuzzleTrainer username={username} />
              </div>
            )}

            <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
              <h2 className="mb-4 text-lg font-semibold">Recent Games</h2>
              <GamesList games={games} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
