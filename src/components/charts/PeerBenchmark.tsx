'use client';

import { useState, useEffect } from 'react';
import { Users, Trophy, Target, TrendingUp, AlertCircle, Star, ChevronUp } from 'lucide-react';

interface BenchmarkMetric {
  metric: string;
  label: string;
  yourValue: number;
  peerAverage: number;
  top10Threshold: number;
  percentile: number;
  rating: 'excellent' | 'good' | 'average' | 'below_average' | 'needs_work';
  comparison: string;
}

interface ImprovementArea {
  area: string;
  description: string;
  gap: number;
  priority: 'high' | 'medium' | 'low';
}

interface BenchmarkReport {
  username: string;
  rating: number;
  ratingBracket: string;
  gamesAnalyzed: number;
  metrics: BenchmarkMetric[];
  strengths: string[];
  improvementAreas: ImprovementArea[];
  nextLevelRequirements: {
    nextBracket: string | null;
    requirements: string[];
  };
  overallPercentile: number;
}

interface PeerBenchmarkProps {
  username: string;
}

function getRatingColor(rating: string): string {
  switch (rating) {
    case 'excellent': return 'text-green-400';
    case 'good': return 'text-blue-400';
    case 'average': return 'text-yellow-400';
    case 'below_average': return 'text-orange-400';
    case 'needs_work': return 'text-red-400';
    default: return 'text-slate-400';
  }
}

function getRatingBg(rating: string): string {
  switch (rating) {
    case 'excellent': return 'bg-green-500/20';
    case 'good': return 'bg-blue-500/20';
    case 'average': return 'bg-yellow-500/20';
    case 'below_average': return 'bg-orange-500/20';
    case 'needs_work': return 'bg-red-500/20';
    default: return 'bg-slate-500/20';
  }
}

function PercentileBar({ percentile, rating }: { percentile: number; rating: string }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-slate-700 overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full rounded-full transition-all ${
          rating === 'excellent' ? 'bg-green-500' :
          rating === 'good' ? 'bg-blue-500' :
          rating === 'average' ? 'bg-yellow-500' :
          rating === 'below_average' ? 'bg-orange-500' :
          'bg-red-500'
        }`}
        style={{ width: `${percentile}%` }}
      />
      {/* Marker at 50% */}
      <div className="absolute left-1/2 top-0 h-full w-0.5 bg-slate-500" />
    </div>
  );
}

export function PeerBenchmark({ username }: PeerBenchmarkProps) {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBenchmark = async () => {
      try {
        const res = await fetch(`/api/benchmark/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to load benchmark');
        }
      } catch (err) {
        setError('Failed to load benchmark');
      } finally {
        setLoading(false);
      }
    };

    fetchBenchmark();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>{error || 'Unable to generate benchmark'}</p>
        <p className="text-sm mt-2">Analyze more games to compare with peers</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{report.ratingBracket}</span>
            <span className="text-sm text-slate-400">Rating Bracket</span>
          </div>
          <p className="text-sm text-slate-500">
            Compared against typical {report.ratingBracket} players
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">
            {report.overallPercentile}<span className="text-lg text-slate-400">%</span>
          </div>
          <p className="text-xs text-slate-400">Overall Percentile</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="space-y-4">
        {report.metrics.map((metric) => (
          <div
            key={metric.metric}
            className="rounded-lg bg-slate-700/50 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{metric.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getRatingColor(metric.rating)}`}>
                  {metric.percentile}th percentile
                </span>
              </div>
            </div>

            <PercentileBar percentile={metric.percentile} rating={metric.rating} />

            <div className="mt-3 flex items-center justify-between text-sm">
              <div>
                <span className="text-white font-medium">{metric.yourValue}</span>
                <span className="text-slate-400 ml-1">You</span>
              </div>
              <div className="text-slate-400">
                {metric.comparison}
              </div>
              <div>
                <span className="text-slate-400">Peer avg: </span>
                <span className="text-slate-300">{metric.peerAverage}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-5 w-5 text-green-400" />
            <span className="font-medium text-green-200">Your Strengths</span>
          </div>
          <ul className="space-y-2">
            {report.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-green-100">
                <Star className="h-4 w-4 mt-0.5 text-green-400 flex-shrink-0" />
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Areas */}
      {report.improvementAreas.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-5 w-5 text-amber-400" />
            <span className="font-medium text-amber-200">Areas to Improve</span>
          </div>
          <div className="space-y-2">
            {report.improvementAreas.map((area, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-sm"
              >
                <span className={`inline-block w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                  area.priority === 'high' ? 'bg-red-400' :
                  area.priority === 'medium' ? 'bg-orange-400' :
                  'bg-yellow-400'
                }`} />
                <div>
                  <span className="text-amber-100 font-medium">{area.area}:</span>
                  <span className="text-amber-200 ml-1">{area.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Level Requirements */}
      {report.nextLevelRequirements.nextBracket && report.nextLevelRequirements.requirements.length > 0 && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ChevronUp className="h-5 w-5 text-blue-400" />
            <span className="font-medium text-blue-200">
              To reach {report.nextLevelRequirements.nextBracket}
            </span>
          </div>
          <ul className="space-y-2">
            {report.nextLevelRequirements.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-100">
                <TrendingUp className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
