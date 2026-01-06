'use client';

import { WeaknessReport as WeaknessReportType } from '@/types';
import { AlertTriangle, TrendingUp, Target, Lightbulb, ChevronRight } from 'lucide-react';

interface WeaknessReportProps {
  data: WeaknessReportType;
}

const CATEGORY_ICONS: Record<string, string> = {
  phase_weakness: '📊',
  phase_strength: '📊',
  time_management: '⏱️',
  opening_theory: '📖',
  piece_handling: '♟️',
  tactical_awareness: '⚔️',
  positional_play: '🎯',
};

const CATEGORY_COLORS: Record<string, string> = {
  phase_weakness: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  time_management: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  opening_theory: 'from-green-500/20 to-green-600/10 border-green-500/30',
  piece_handling: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
  tactical_awareness: 'from-red-500/20 to-red-600/10 border-red-500/30',
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 60) return 'Average';
  if (score >= 50) return 'Below Average';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

export function WeaknessReport({ data }: WeaknessReportProps) {
  if (data.gamesAnalyzed === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Analyze some games to see your weakness report</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-6">
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-1">Overall Performance Score</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-bold ${getScoreColor(data.overallScore)}`}>
              {data.overallScore}
            </span>
            <span className="text-slate-400">/100</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {getScoreLabel(data.overallScore)} • Based on {data.gamesAnalyzed} games
          </p>
        </div>
        <div className="hidden sm:block">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${data.overallScore * 2.51} 251`}
                className={getScoreColor(data.overallScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Target className={`h-8 w-8 ${getScoreColor(data.overallScore)}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Weaknesses */}
      {data.topWeaknesses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold">Areas to Improve</h3>
          </div>
          <div className="space-y-3">
            {data.topWeaknesses.map((weakness, index) => (
              <div
                key={index}
                className={`rounded-xl border bg-gradient-to-r p-4 ${
                  CATEGORY_COLORS[weakness.category] || 'from-slate-700/50 to-slate-800/50 border-slate-600/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{CATEGORY_ICONS[weakness.category] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-white">{weakness.title}</h4>
                      <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                        Impact: {weakness.impact}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1">{weakness.description}</p>
                    <div className="flex items-start gap-2 mt-3 rounded-lg bg-black/20 p-3">
                      <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-200">{weakness.suggestion}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {data.strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold">Your Strengths</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.strengths.map((strength, index) => (
              <div
                key={index}
                className="rounded-xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-green-600/5 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{CATEGORY_ICONS[strength.category] || '✨'}</span>
                  <h4 className="font-medium text-green-400">{strength.title}</h4>
                </div>
                <p className="text-sm text-slate-300">{strength.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No weaknesses found */}
      {data.topWeaknesses.length === 0 && data.strengths.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Not enough data to generate insights. Play more analyzed games!</p>
        </div>
      )}

      {/* Call to Action */}
      {data.topWeaknesses.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <ChevronRight className="h-5 w-5 text-amber-400" />
            <div>
              <p className="font-medium text-amber-300">Focus on your #1 weakness</p>
              <p className="text-sm text-slate-400">
                Improving "{data.topWeaknesses[0]?.title}" could significantly boost your results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
