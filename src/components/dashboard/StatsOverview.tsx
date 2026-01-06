'use client';

import { UserStats } from '@/types';
import { Target, TrendingDown, AlertTriangle, XCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: UserStats;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      label: 'Average Accuracy',
      value: `${stats.avgAccuracy}%`,
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Avg Centipawn Loss',
      value: stats.avgAcpl.toFixed(1),
      icon: TrendingDown,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Total Mistakes',
      value: stats.totalMistakes,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
    },
    {
      label: 'Total Blunders',
      value: stats.totalBlunders,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-700 bg-slate-800 p-6"
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
