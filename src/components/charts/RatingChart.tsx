'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { RatingHistoryPoint } from '@/types';

interface RatingChartProps {
  data: RatingHistoryPoint[];
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/95 backdrop-blur-sm px-4 py-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-amber-400">{payload[0].value}</p>
    </div>
  );
}

export function RatingChart({ data }: RatingChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2 opacity-20">📈</div>
          <p className="text-slate-400">No rating data available</p>
        </div>
      </div>
    );
  }

  const minRating = Math.min(...data.map((d) => d.rating)) - 50;
  const maxRating = Math.max(...data.map((d) => d.rating)) + 50;

  // Calculate rating change
  const firstRating = data[0]?.rating || 0;
  const lastRating = data[data.length - 1]?.rating || 0;
  const ratingChange = lastRating - firstRating;

  return (
    <div className="space-y-4">
      {/* Rating change indicator */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-slate-400">Current Rating</span>
          <p className="text-2xl font-bold text-white">{lastRating}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          ratingChange >= 0
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {ratingChange >= 0 ? '+' : ''}{ratingChange} pts
        </div>
      </div>

      {/* Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              domain={[minRating, maxRating]}
              stroke="#475569"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-10}
              tickFormatter={(value) => value.toString()}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="rating"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fill="url(#ratingGradient)"
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
