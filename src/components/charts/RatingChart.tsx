'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RatingHistoryPoint } from '@/types';

interface RatingChartProps {
  data: RatingHistoryPoint[];
}

export function RatingChart({ data }: RatingChartProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-slate-400">No rating data</p>;
  }

  const minRating = Math.min(...data.map((d) => d.rating)) - 50;
  const maxRating = Math.max(...data.map((d) => d.rating)) + 50;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minRating, maxRating]}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#f59e0b' }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
