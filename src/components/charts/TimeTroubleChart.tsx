'use client';

import { TimeTroubleStats } from '@/types';
import { Clock, AlertTriangle, TrendingDown } from 'lucide-react';
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

interface TimeTroubleChartProps {
  data: TimeTroubleStats;
}

export function TimeTroubleChart({ data }: TimeTroubleChartProps) {
  const chartData = [
    {
      name: 'Normal',
      accuracy: data.normalAccuracy,
      moves: data.normalMoves,
      blunders: data.normalBlunders,
    },
    {
      name: 'Time Trouble',
      accuracy: data.timeTroubleAccuracy,
      moves: data.timeTroubleMoves,
      blunders: data.timeTroubleBlunders,
    },
  ];

  const blunderRate = {
    normal: data.normalMoves > 0
      ? ((data.normalBlunders / data.normalMoves) * 100).toFixed(1)
      : '0',
    timeTrouble: data.timeTroubleMoves > 0
      ? ((data.timeTroubleBlunders / data.timeTroubleMoves) * 100).toFixed(1)
      : '0',
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#22c55e'; // green
    if (accuracy >= 80) return '#84cc16'; // lime
    if (accuracy >= 70) return '#eab308'; // yellow
    if (accuracy >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="space-y-6">
      {/* Accuracy Comparison Chart */}
      <div className="h-48">
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
              width={100}
              stroke="#94a3b8"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
              }}
              formatter={(value, name) => [
                `${value}%`,
                name === 'accuracy' ? 'Accuracy' : String(name),
              ]}
            />
            <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getAccuracyColor(entry.accuracy)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Normal Play */}
        <div className="rounded-lg bg-slate-700/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Clock className="h-4 w-4 text-green-400" />
            Normal Play
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Moves</span>
              <span>{data.normalMoves}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Accuracy</span>
              <span className="text-green-400">{data.normalAccuracy}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Blunders</span>
              <span>{data.normalBlunders} ({blunderRate.normal}%)</span>
            </div>
          </div>
        </div>

        {/* Time Trouble */}
        <div className="rounded-lg bg-slate-700/50 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Time Trouble
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Moves</span>
              <span>{data.timeTroubleMoves}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Accuracy</span>
              <span className="text-red-400">{data.timeTroubleAccuracy}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Blunders</span>
              <span>{data.timeTroubleBlunders} ({blunderRate.timeTrouble}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Drop Insight */}
      {data.accuracyDrop > 0 && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <TrendingDown className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">
                {data.accuracyDrop}% accuracy drop in time trouble
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Your play suffers when you have less than {Math.round(data.timeTroubleThreshold)} seconds remaining.
                Consider managing your clock better in critical positions.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.accuracyDrop <= 0 && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <p className="font-medium text-green-400">
                Good time management!
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Your accuracy stays consistent even under time pressure.
                Keep up the solid clock discipline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Threshold Info */}
      <p className="text-xs text-slate-500 text-center">
        Time trouble defined as &lt;10% of initial time remaining (~{Math.round(data.timeTroubleThreshold)}s for your games)
      </p>
    </div>
  );
}
