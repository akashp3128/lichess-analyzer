'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { X, Trophy, Target, TrendingDown, Minus } from 'lucide-react';
import { OpeningStats, GameWithAnalysis } from '@/types';
import { format } from 'date-fns';

interface OpeningStatsChartProps {
  data: OpeningStats[];
  games?: GameWithAnalysis[];
}

export function OpeningStatsChart({ data, games = [] }: OpeningStatsChartProps) {
  const [selectedOpening, setSelectedOpening] = useState<OpeningStats | null>(null);

  if (data.length === 0) {
    return <p className="py-8 text-center text-slate-400">No opening data</p>;
  }

  const chartData = data.slice(0, 8).map((o) => ({
    name: o.eco || o.name.split(':')[0],
    fullName: o.name,
    eco: o.eco,
    winRate: o.winRate,
    games: o.games,
    wins: o.wins,
    losses: o.losses,
    draws: o.draws,
  }));

  const handleBarClick = (index: number) => {
    const entry = chartData[index];
    if (entry) {
      const opening = data.find(o => o.eco === entry.eco || o.name === entry.fullName);
      if (opening) {
        setSelectedOpening(opening);
      }
    }
  };

  const openingGames = selectedOpening
    ? games.filter(g =>
        g.opening?.includes(selectedOpening.name.split(':')[0]) ||
        g.openingEco === selectedOpening.eco
      )
    : [];

  return (
    <>
      <div className="h-64">
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
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(value, _name, props) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const payload = (props as any).payload;
                return [`${value}% (${payload.games} games)`, payload.fullName];
              }}
            />
            <Bar
              dataKey="winRate"
              radius={[0, 4, 4, 0]}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.winRate >= 60
                      ? '#22c55e'
                      : entry.winRate >= 45
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  onClick={() => handleBarClick(index)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">Click on a bar to see games</p>

      {/* Opening Details Modal */}
      {selectedOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedOpening.name}</h3>
                <p className="text-sm text-slate-400">{selectedOpening.eco}</p>
              </div>
              <button
                onClick={() => setSelectedOpening(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-4 border-b border-slate-700 p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-white">
                  <Target className="h-5 w-5 text-slate-400" />
                  {selectedOpening.games}
                </div>
                <p className="text-xs text-slate-400">Games</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-green-400">
                  <Trophy className="h-5 w-5" />
                  {selectedOpening.wins}
                </div>
                <p className="text-xs text-slate-400">Wins</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-400">
                  <TrendingDown className="h-5 w-5" />
                  {selectedOpening.losses}
                </div>
                <p className="text-xs text-slate-400">Losses</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-slate-300">
                  <Minus className="h-5 w-5" />
                  {selectedOpening.draws}
                </div>
                <p className="text-xs text-slate-400">Draws</p>
              </div>
            </div>

            {/* Win Rate Bar */}
            <div className="border-b border-slate-700 p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-slate-400">Win Rate</span>
                <span className={`font-medium ${
                  selectedOpening.winRate >= 60 ? 'text-green-400' :
                  selectedOpening.winRate >= 45 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {selectedOpening.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-700">
                <div
                  className="bg-green-500"
                  style={{ width: `${(selectedOpening.wins / selectedOpening.games) * 100}%` }}
                />
                <div
                  className="bg-slate-400"
                  style={{ width: `${(selectedOpening.draws / selectedOpening.games) * 100}%` }}
                />
                <div
                  className="bg-red-500"
                  style={{ width: `${(selectedOpening.losses / selectedOpening.games) * 100}%` }}
                />
              </div>
            </div>

            {/* Games List */}
            <div className="max-h-64 overflow-y-auto p-4">
              <h4 className="mb-3 text-sm font-medium text-slate-300">Games with this opening</h4>
              {openingGames.length > 0 ? (
                <div className="space-y-2">
                  {openingGames.map((game) => (
                    <a
                      key={game.id}
                      href={`https://lichess.org/${game.lichessId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg bg-slate-700/50 p-3 hover:bg-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${
                          game.result === 'win' ? 'bg-green-400' :
                          game.result === 'loss' ? 'bg-red-400' : 'bg-slate-400'
                        }`} />
                        <div>
                          <p className="text-sm text-white">
                            vs {game.playerColor === 'white' ? game.black : game.white}
                            {game.opponentRating && (
                              <span className="ml-1 text-slate-400">({game.opponentRating})</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">
                            {format(new Date(game.playedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          game.result === 'win' ? 'text-green-400' :
                          game.result === 'loss' ? 'text-red-400' : 'text-slate-400'
                        }`}>
                          {game.result.charAt(0).toUpperCase() + game.result.slice(1)}
                        </p>
                        {game.analysis && (
                          <p className="text-xs text-slate-400">
                            {game.analysis.accuracy}% accuracy
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-400">No games found for this opening</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
