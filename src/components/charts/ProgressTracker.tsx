'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Calendar,
  Award,
} from 'lucide-react';

interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  gamesPlayed: number;
  gamesAnalyzed: number;
  avgAccuracy: number;
  avgAcpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  avgRating: number;
  ratingChange: number;
}

interface ImprovementMetric {
  metric: string;
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'declining' | 'stable';
  isPositive: boolean;
}

interface ProgressReport {
  username: string;
  totalWeeks: number;
  weeklyMetrics: WeeklyMetrics[];
  improvements: ImprovementMetric[];
  overallTrend: 'improving' | 'declining' | 'stable';
  streaks: {
    currentAccuracyStreak: number;
    bestAccuracyStreak: number;
    currentWinStreak: number;
    bestWinStreak: number;
  };
  milestones: string[];
}

interface ProgressTrackerProps {
  username: string;
}

function TrendIcon({ trend, size = 'md' }: { trend: 'improving' | 'declining' | 'stable'; size?: 'sm' | 'md' }) {
  const className = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  if (trend === 'improving') return <TrendingUp className={`${className} text-green-400`} />;
  if (trend === 'declining') return <TrendingDown className={`${className} text-red-400`} />;
  return <Minus className={`${className} text-slate-400`} />;
}

function formatWeek(weekStart: string): string {
  const date = new Date(weekStart);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProgressTracker({ username }: ProgressTrackerProps) {
  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'winRate' | 'rating'>('accuracy');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await fetch(`/api/progress/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!report || report.weeklyMetrics.length < 2) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Not enough data for progress tracking</p>
        <p className="text-sm mt-2">Play and analyze more games over multiple weeks</p>
      </div>
    );
  }

  const chartData = report.weeklyMetrics.map(week => ({
    week: formatWeek(week.weekStart),
    accuracy: week.avgAccuracy,
    winRate: week.winRate,
    rating: week.avgRating,
    blunders: week.blunders,
    games: week.gamesPlayed,
  }));

  const metricConfig = {
    accuracy: { key: 'accuracy', color: '#22c55e', label: 'Accuracy %' },
    winRate: { key: 'winRate', color: '#3b82f6', label: 'Win Rate %' },
    rating: { key: 'rating', color: '#f59e0b', label: 'Rating' },
  };

  const config = metricConfig[selectedMetric];

  return (
    <div className="space-y-6">
      {/* Overall Trend Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            report.overallTrend === 'improving' ? 'bg-green-500/20' :
            report.overallTrend === 'declining' ? 'bg-red-500/20' :
            'bg-slate-700'
          }`}>
            <TrendIcon trend={report.overallTrend} />
          </div>
          <div>
            <p className="text-sm text-slate-400">Overall Trend</p>
            <p className={`font-semibold capitalize ${
              report.overallTrend === 'improving' ? 'text-green-400' :
              report.overallTrend === 'declining' ? 'text-red-400' :
              'text-slate-300'
            }`}>
              {report.overallTrend}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">{report.totalWeeks} weeks tracked</p>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="flex gap-2">
        {(['accuracy', 'winRate', 'rating'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              selectedMetric === metric
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {metricConfig[metric].label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="week"
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              domain={selectedMetric === 'rating' ? ['auto', 'auto'] : [0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [`${value}${selectedMetric !== 'rating' ? '%' : ''}`, config.label]}
            />
            <Line
              type="monotone"
              dataKey={config.key}
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Improvement Metrics */}
      {report.improvements.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-300">Week-over-Week Changes</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.improvements.slice(0, 6).map((improvement) => (
              <div
                key={improvement.metric}
                className="rounded-lg bg-slate-700/50 p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">{improvement.label}</span>
                  <TrendIcon trend={improvement.trend} size="sm" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-white">{improvement.current}</span>
                  <span className={`text-sm ${improvement.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {improvement.change >= 0 ? '+' : ''}{improvement.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streaks */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-400" />
            <span className="text-sm font-medium">Accuracy Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {report.streaks.currentAccuracyStreak}
            </span>
            <span className="text-sm text-slate-400">weeks improving</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Best: {report.streaks.bestAccuracyStreak} weeks
          </p>
        </div>

        <div className="rounded-lg bg-slate-700/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium">Winning Streak</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {report.streaks.currentWinStreak}
            </span>
            <span className="text-sm text-slate-400">weeks &gt;50% WR</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Best: {report.streaks.bestWinStreak} weeks
          </p>
        </div>
      </div>

      {/* Milestones */}
      {report.milestones.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-200">Milestones</span>
          </div>
          <ul className="space-y-2">
            {report.milestones.map((milestone, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-100">
                <span className="text-amber-400">•</span>
                {milestone}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
