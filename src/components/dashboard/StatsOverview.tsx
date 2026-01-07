'use client';

import { UserStats } from '@/types';
import { Target, TrendingDown, AlertTriangle, XCircle } from 'lucide-react';

interface StatsOverviewProps {
  stats: UserStats;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  glowColor: string;
  delay: number;
}

function StatCard({ label, value, icon: Icon, color, glowColor, delay }: StatCardProps) {
  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/80 p-6 transition-all duration-300 hover:border-slate-600 hover:shadow-lg hover:-translate-y-1"
      style={{
        animationDelay: `${delay}ms`,
        // Add subtle glow on hover
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div
        className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${glowColor}`}
        style={{ background: `radial-gradient(circle at 30% 30%, var(--glow-color, rgba(255,255,255,0.05)), transparent 70%)` }}
      />

      <div className="relative flex items-center gap-4">
        <div className={`rounded-xl p-3 ${color} bg-opacity-15 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white stat-number">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      label: 'Average Accuracy',
      value: `${stats.avgAccuracy}%`,
      icon: Target,
      color: 'text-emerald-400 bg-emerald-500',
      glowColor: 'hover:shadow-emerald-500/10',
    },
    {
      label: 'Avg Centipawn Loss',
      value: stats.avgAcpl.toFixed(1),
      icon: TrendingDown,
      color: 'text-blue-400 bg-blue-500',
      glowColor: 'hover:shadow-blue-500/10',
    },
    {
      label: 'Total Mistakes',
      value: stats.totalMistakes,
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500',
      glowColor: 'hover:shadow-amber-500/10',
    },
    {
      label: 'Total Blunders',
      value: stats.totalBlunders,
      icon: XCircle,
      color: 'text-rose-400 bg-rose-500',
      glowColor: 'hover:shadow-rose-500/10',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          icon={card.icon}
          color={card.color}
          glowColor={card.glowColor}
          delay={index * 100}
        />
      ))}
    </div>
  );
}
