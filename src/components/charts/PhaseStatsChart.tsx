'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { PhaseStats } from '@/types';

interface PhaseStatsChartProps {
  data: PhaseStats[];
}

export function PhaseStatsChart({ data }: PhaseStatsChartProps) {
  if (!data || data.length === 0) {
    return <p className="py-8 text-center text-slate-400">No phase data available</p>;
  }

  const chartData = data.map((phase) => ({
    name: phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1),
    accuracy: phase.accuracy,
    blunders: phase.blunders,
    mistakes: phase.mistakes,
    inaccuracies: phase.inaccuracies,
    totalMoves: phase.totalMoves,
    acpl: phase.acpl,
  }));

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return '#22c55e';
    if (accuracy >= 75) return '#f59e0b';
    return '#ef4444';
  };

  // Find the weakest phase
  const weakestPhase = [...data].sort((a, b) => a.accuracy - b.accuracy)[0];
  const strongestPhase = [...data].sort((a, b) => b.accuracy - a.accuracy)[0];

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f8fafc' }}
              formatter={(value, name, props) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const payload = (props as any).payload;
                return [
                  <span key="value">
                    {value}% ({payload.totalMoves} moves)
                  </span>,
                  'Accuracy',
                ];
              }}
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

      {/* Insights */}
      <div className="space-y-2 rounded-lg bg-slate-700/50 p-3">
        <h4 className="text-sm font-medium text-slate-300">Insights</h4>
        {weakestPhase && strongestPhase && weakestPhase.phase !== strongestPhase.phase && (
          <div className="space-y-1 text-sm">
            <p className="text-slate-400">
              <span className="text-green-400">Strongest:</span>{' '}
              {strongestPhase.phase.charAt(0).toUpperCase() + strongestPhase.phase.slice(1)}{' '}
              ({strongestPhase.accuracy}% accuracy)
            </p>
            <p className="text-slate-400">
              <span className="text-red-400">Weakest:</span>{' '}
              {weakestPhase.phase.charAt(0).toUpperCase() + weakestPhase.phase.slice(1)}{' '}
              ({weakestPhase.accuracy}% accuracy)
            </p>
            {weakestPhase.blunders > 0 && (
              <p className="text-amber-400">
                {weakestPhase.blunders} blunder{weakestPhase.blunders > 1 ? 's' : ''} in {weakestPhase.phase}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {data.map((phase) => (
          <div key={phase.phase} className="rounded-lg bg-slate-700/30 p-2">
            <p className="font-medium text-slate-300">
              {phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)}
            </p>
            <p className="text-slate-400">{phase.totalMoves} moves</p>
            <div className="mt-1 flex justify-center gap-2 text-xs">
              {phase.blunders > 0 && (
                <span className="text-red-400">{phase.blunders}B</span>
              )}
              {phase.mistakes > 0 && (
                <span className="text-amber-400">{phase.mistakes}M</span>
              )}
              {phase.inaccuracies > 0 && (
                <span className="text-yellow-400">{phase.inaccuracies}I</span>
              )}
              {phase.blunders === 0 && phase.mistakes === 0 && phase.inaccuracies === 0 && (
                <span className="text-green-400">Clean!</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
