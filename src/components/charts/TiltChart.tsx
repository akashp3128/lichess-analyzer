'use client';

import { TiltStats } from '@/types';
import { AlertTriangle, TrendingDown, TrendingUp, Flame, Snowflake, Activity } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface TiltChartProps {
  data: TiltStats;
}

function getTiltLabel(score: number): { label: string; color: string } {
  if (score >= 50) return { label: 'High Tilt', color: 'text-red-400' };
  if (score >= 25) return { label: 'Moderate Tilt', color: 'text-orange-400' };
  if (score >= 10) return { label: 'Slight Tilt', color: 'text-yellow-400' };
  return { label: 'Tilt Resistant', color: 'text-green-400' };
}

export function TiltChart({ data }: TiltChartProps) {
  const chartData = [
    {
      name: 'After Win',
      accuracy: data.afterWin.avgAccuracy,
      winRate: data.afterWin.winRate,
      games: data.afterWin.games,
    },
    {
      name: 'After Draw',
      accuracy: data.afterDraw.avgAccuracy,
      winRate: data.afterDraw.winRate,
      games: data.afterDraw.games,
    },
    {
      name: 'After Loss',
      accuracy: data.afterLoss.avgAccuracy,
      winRate: data.afterLoss.winRate,
      games: data.afterLoss.games,
    },
  ];

  const { label: tiltLabel, color: tiltColor } = getTiltLabel(data.tiltScore);

  const getBarColor = (name: string) => {
    if (name === 'After Win') return '#22c55e';
    if (name === 'After Draw') return '#94a3b8';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Tilt Score Overview */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-4">
        <div className="flex items-center gap-4">
          {data.isTilting ? (
            <div className="rounded-full bg-red-500/20 p-3">
              <Flame className="h-6 w-6 text-red-400" />
            </div>
          ) : (
            <div className="rounded-full bg-green-500/20 p-3">
              <Snowflake className="h-6 w-6 text-green-400" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${tiltColor}`}>{data.tiltScore}</span>
              <span className="text-slate-400">/100</span>
            </div>
            <p className={`text-sm font-medium ${tiltColor}`}>{tiltLabel}</p>
          </div>
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>Tilt Score</p>
          <p className="text-xs">Lower is better</p>
        </div>
      </div>

      {/* Accuracy Comparison Chart */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-300">Accuracy by Previous Result</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#94a3b8"
              />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                stroke="#94a3b8"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                }}
                formatter={(value) => [`${value}%`, 'Accuracy']}
              />
              <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-green-500/10 p-3 text-center">
          <div className="text-lg font-bold text-green-400">{data.afterWin.winRate}%</div>
          <p className="text-xs text-slate-400">Win rate after W</p>
          <p className="text-xs text-slate-500">({data.afterWin.games} games)</p>
        </div>
        <div className="rounded-lg bg-slate-500/10 p-3 text-center">
          <div className="text-lg font-bold text-slate-300">{data.afterDraw.winRate}%</div>
          <p className="text-xs text-slate-400">Win rate after D</p>
          <p className="text-xs text-slate-500">({data.afterDraw.games} games)</p>
        </div>
        <div className="rounded-lg bg-red-500/10 p-3 text-center">
          <div className="text-lg font-bold text-red-400">{data.afterLoss.winRate}%</div>
          <p className="text-xs text-slate-400">Win rate after L</p>
          <p className="text-xs text-slate-500">({data.afterLoss.games} games)</p>
        </div>
      </div>

      {/* Key Insights */}
      <div className="space-y-3">
        {data.accuracyDrop > 3 && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <TrendingDown className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400">
                {data.accuracyDrop}% accuracy drop after losses
              </p>
              <p className="text-xs text-slate-400">
                Take a break after losses to reset mentally
              </p>
            </div>
          </div>
        )}

        {data.winRateDrop > 15 && (
          <div className="flex items-start gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3">
            <AlertTriangle className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-400">
                {data.winRateDrop}% lower win rate after losses
              </p>
              <p className="text-xs text-slate-400">
                Consider stopping after 2 consecutive losses
              </p>
            </div>
          </div>
        )}

        {data.accuracyDrop <= 0 && (
          <div className="flex items-start gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
            <TrendingUp className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-400">
                Strong mental game
              </p>
              <p className="text-xs text-slate-400">
                Your play stays consistent regardless of previous results
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Streak Stats */}
      <div className="rounded-lg bg-slate-700/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-slate-400" />
          <h4 className="text-sm font-medium text-slate-300">Streak Stats</h4>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className={`text-lg font-bold ${
              data.streakStats.currentStreak > 0 ? 'text-green-400' :
              data.streakStats.currentStreak < 0 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {data.streakStats.currentStreak > 0 ? `+${data.streakStats.currentStreak}` :
               data.streakStats.currentStreak < 0 ? data.streakStats.currentStreak : '0'}
            </div>
            <p className="text-xs text-slate-400">Current</p>
          </div>
          <div>
            <div className="text-lg font-bold text-green-400">
              {data.streakStats.longestWinStreak}
            </div>
            <p className="text-xs text-slate-400">Best Win Streak</p>
          </div>
          <div>
            <div className="text-lg font-bold text-red-400">
              {data.streakStats.longestLoseStreak}
            </div>
            <p className="text-xs text-slate-400">Worst Lose Streak</p>
          </div>
        </div>
      </div>
    </div>
  );
}
