'use client';

import { EndgameReport } from '@/types';
import { Trophy, TrendingDown, Target, Crown } from 'lucide-react';
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

interface EndgameChartProps {
  data: EndgameReport;
}

const ENDGAME_ICONS: Record<string, string> = {
  pawn: '♟',
  rook: '♜',
  queen: '♛',
  bishop: '♝',
  knight: '♞',
  minor_piece: '♞♝',
  rook_minor: '♜♞',
  queen_rook: '♛♜',
  complex: '⚔️',
  mating_attack: '💥',
};

function getWinRateColor(winRate: number): string {
  if (winRate >= 60) return '#22c55e';
  if (winRate >= 45) return '#eab308';
  if (winRate >= 30) return '#f97316';
  return '#ef4444';
}

export function EndgameChart({ data }: EndgameChartProps) {
  if (data.endgameStats.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Not enough endgame data yet</p>
      </div>
    );
  }

  const chartData = data.endgameStats.slice(0, 6).map((stat) => ({
    name: stat.typeName.replace(' Endgame', '').replace(' Piece', ''),
    winRate: stat.winRate,
    games: stat.games,
    fullName: stat.typeName,
    icon: ENDGAME_ICONS[stat.type] || '♔',
  }));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-slate-700/50 p-3 text-center">
          <div className="text-2xl font-bold text-white">{data.reachedEndgameRate}%</div>
          <p className="text-xs text-slate-400">Games reaching endgame</p>
        </div>
        <div className="rounded-lg bg-green-500/10 p-3 text-center">
          {data.bestEndgame ? (
            <>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{ENDGAME_ICONS[data.bestEndgame.type] || '♔'}</span>
                <span className="text-xl font-bold text-green-400">{data.bestEndgame.winRate}%</span>
              </div>
              <p className="text-xs text-slate-400">Best: {data.bestEndgame.typeName}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No data</p>
          )}
        </div>
        <div className="rounded-lg bg-red-500/10 p-3 text-center">
          {data.worstEndgame ? (
            <>
              <div className="flex items-center justify-center gap-1">
                <span className="text-lg">{ENDGAME_ICONS[data.worstEndgame.type] || '♔'}</span>
                <span className="text-xl font-bold text-red-400">{data.worstEndgame.winRate}%</span>
              </div>
              <p className="text-xs text-slate-400">Weakest: {data.worstEndgame.typeName}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">No data</p>
          )}
        </div>
      </div>

      {/* Win Rate Chart */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-300">Win Rate by Endgame Type</h4>
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
                width={80}
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                }}
                formatter={(value, _name, props) => {
                  const payload = props.payload as typeof chartData[0];
                  return [`${value}% (${payload.games} games)`, payload.fullName];
                }}
              />
              <Bar dataKey="winRate" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getWinRateColor(entry.winRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-300">Detailed Breakdown</h4>
        <div className="space-y-2">
          {data.endgameStats.slice(0, 5).map((stat) => (
            <div
              key={stat.type}
              className="flex items-center justify-between rounded-lg bg-slate-700/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ENDGAME_ICONS[stat.type] || '♔'}</span>
                <div>
                  <p className="font-medium text-white">{stat.typeName}</p>
                  <p className="text-xs text-slate-400">{stat.games} games</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-green-400" />
                    <span className="text-green-400">{stat.wins}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-red-400" />
                    <span className="text-red-400">{stat.losses}</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1">
                    <Target className="h-3 w-3 text-slate-400" />
                    <span className="text-slate-400">{stat.draws}</span>
                  </div>
                </div>
                <div
                  className={`min-w-[60px] text-right font-bold ${
                    stat.winRate >= 50 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {stat.winRate}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {data.bestEndgame && data.worstEndgame && data.bestEndgame.type !== data.worstEndgame.type && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200">
                Your {data.worstEndgame.typeName.toLowerCase()} could use work.
                Consider studying {data.worstEndgame.typeName.toLowerCase()} techniques
                to improve your {data.worstEndgame.winRate}% win rate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
