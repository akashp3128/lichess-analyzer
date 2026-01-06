import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Estimated benchmarks based on typical chess statistics by rating range
// These are approximations based on general chess research
const RATING_BENCHMARKS: Record<string, {
  accuracy: { avg: number; top10: number; bottom10: number };
  acpl: { avg: number; top10: number; bottom10: number };
  blundersPerGame: { avg: number; top10: number; bottom10: number };
  mistakesPerGame: { avg: number; top10: number; bottom10: number };
  winRate: { avg: number; top10: number; bottom10: number };
}> = {
  '0-800': {
    accuracy: { avg: 55, top10: 65, bottom10: 45 },
    acpl: { avg: 180, top10: 120, bottom10: 250 },
    blundersPerGame: { avg: 4.5, top10: 2.5, bottom10: 7.0 },
    mistakesPerGame: { avg: 5.0, top10: 3.0, bottom10: 8.0 },
    winRate: { avg: 50, top10: 65, bottom10: 35 },
  },
  '800-1000': {
    accuracy: { avg: 60, top10: 70, bottom10: 50 },
    acpl: { avg: 150, top10: 100, bottom10: 200 },
    blundersPerGame: { avg: 3.5, top10: 2.0, bottom10: 5.5 },
    mistakesPerGame: { avg: 4.0, top10: 2.5, bottom10: 6.0 },
    winRate: { avg: 50, top10: 62, bottom10: 38 },
  },
  '1000-1200': {
    accuracy: { avg: 65, top10: 75, bottom10: 55 },
    acpl: { avg: 120, top10: 80, bottom10: 160 },
    blundersPerGame: { avg: 2.8, top10: 1.5, bottom10: 4.5 },
    mistakesPerGame: { avg: 3.5, top10: 2.0, bottom10: 5.0 },
    winRate: { avg: 50, top10: 60, bottom10: 40 },
  },
  '1200-1400': {
    accuracy: { avg: 70, top10: 80, bottom10: 60 },
    acpl: { avg: 100, top10: 65, bottom10: 140 },
    blundersPerGame: { avg: 2.2, top10: 1.0, bottom10: 3.5 },
    mistakesPerGame: { avg: 3.0, top10: 1.8, bottom10: 4.5 },
    winRate: { avg: 50, top10: 58, bottom10: 42 },
  },
  '1400-1600': {
    accuracy: { avg: 75, top10: 84, bottom10: 66 },
    acpl: { avg: 80, top10: 50, bottom10: 115 },
    blundersPerGame: { avg: 1.8, top10: 0.8, bottom10: 3.0 },
    mistakesPerGame: { avg: 2.5, top10: 1.5, bottom10: 4.0 },
    winRate: { avg: 50, top10: 57, bottom10: 43 },
  },
  '1600-1800': {
    accuracy: { avg: 78, top10: 87, bottom10: 70 },
    acpl: { avg: 65, top10: 40, bottom10: 95 },
    blundersPerGame: { avg: 1.4, top10: 0.6, bottom10: 2.5 },
    mistakesPerGame: { avg: 2.0, top10: 1.2, bottom10: 3.2 },
    winRate: { avg: 50, top10: 56, bottom10: 44 },
  },
  '1800-2000': {
    accuracy: { avg: 82, top10: 90, bottom10: 74 },
    acpl: { avg: 50, top10: 30, bottom10: 75 },
    blundersPerGame: { avg: 1.0, top10: 0.4, bottom10: 1.8 },
    mistakesPerGame: { avg: 1.6, top10: 0.9, bottom10: 2.5 },
    winRate: { avg: 50, top10: 55, bottom10: 45 },
  },
  '2000-2200': {
    accuracy: { avg: 85, top10: 92, bottom10: 78 },
    acpl: { avg: 40, top10: 25, bottom10: 60 },
    blundersPerGame: { avg: 0.7, top10: 0.3, bottom10: 1.3 },
    mistakesPerGame: { avg: 1.2, top10: 0.7, bottom10: 2.0 },
    winRate: { avg: 50, top10: 54, bottom10: 46 },
  },
  '2200+': {
    accuracy: { avg: 88, top10: 95, bottom10: 82 },
    acpl: { avg: 30, top10: 18, bottom10: 45 },
    blundersPerGame: { avg: 0.4, top10: 0.2, bottom10: 0.8 },
    mistakesPerGame: { avg: 0.8, top10: 0.4, bottom10: 1.4 },
    winRate: { avg: 50, top10: 53, bottom10: 47 },
  },
};

function getRatingBracket(rating: number): string {
  if (rating < 800) return '0-800';
  if (rating < 1000) return '800-1000';
  if (rating < 1200) return '1000-1200';
  if (rating < 1400) return '1200-1400';
  if (rating < 1600) return '1400-1600';
  if (rating < 1800) return '1600-1800';
  if (rating < 2000) return '1800-2000';
  if (rating < 2200) return '2000-2200';
  return '2200+';
}

function getNextBracket(bracket: string): string | null {
  const brackets = Object.keys(RATING_BENCHMARKS);
  const index = brackets.indexOf(bracket);
  if (index < brackets.length - 1) {
    return brackets[index + 1];
  }
  return null;
}

function calculatePercentile(value: number, avg: number, top10: number, bottom10: number, higherIsBetter: boolean): number {
  // Estimate percentile based on value position between benchmarks
  if (higherIsBetter) {
    if (value >= top10) return 90 + ((value - top10) / (top10 - avg)) * 5;
    if (value >= avg) return 50 + ((value - avg) / (top10 - avg)) * 40;
    if (value >= bottom10) return 10 + ((value - bottom10) / (avg - bottom10)) * 40;
    return Math.max(1, 10 - ((bottom10 - value) / bottom10) * 10);
  } else {
    if (value <= top10) return 90 + ((top10 - value) / (avg - top10)) * 5;
    if (value <= avg) return 50 + ((avg - value) / (avg - top10)) * 40;
    if (value <= bottom10) return 10 + ((bottom10 - value) / (bottom10 - avg)) * 40;
    return Math.max(1, 10 - ((value - bottom10) / bottom10) * 10);
  }
}

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

function getRating(percentile: number): 'excellent' | 'good' | 'average' | 'below_average' | 'needs_work' {
  if (percentile >= 80) return 'excellent';
  if (percentile >= 60) return 'good';
  if (percentile >= 40) return 'average';
  if (percentile >= 20) return 'below_average';
  return 'needs_work';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        games: {
          include: {
            analysis: true,
          },
          orderBy: { playedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const analyzedGames = user.games.filter(g => g.analysis);

    if (analyzedGames.length < 3) {
      return NextResponse.json(
        { error: 'Need at least 3 analyzed games for benchmarking' },
        { status: 400 }
      );
    }

    // Calculate user's average rating
    const ratingSum = user.games
      .filter(g => g.playerRating)
      .reduce((sum, g) => sum + (g.playerRating || 0), 0);
    const ratingCount = user.games.filter(g => g.playerRating).length;
    const avgRating = ratingCount > 0 ? Math.round(ratingSum / ratingCount) : 1200;

    const bracket = getRatingBracket(avgRating);
    const benchmarks = RATING_BENCHMARKS[bracket];

    // Calculate user's stats
    const totalAccuracy = analyzedGames.reduce((sum, g) => sum + (g.analysis?.accuracy || 0), 0);
    const totalAcpl = analyzedGames.reduce((sum, g) => sum + (g.analysis?.acpl || 0), 0);
    const totalBlunders = analyzedGames.reduce((sum, g) => sum + (g.analysis?.blunders || 0), 0);
    const totalMistakes = analyzedGames.reduce((sum, g) => sum + (g.analysis?.mistakes || 0), 0);

    const userStats = {
      accuracy: Math.round((totalAccuracy / analyzedGames.length) * 10) / 10,
      acpl: Math.round((totalAcpl / analyzedGames.length) * 10) / 10,
      blundersPerGame: Math.round((totalBlunders / analyzedGames.length) * 10) / 10,
      mistakesPerGame: Math.round((totalMistakes / analyzedGames.length) * 10) / 10,
      winRate: Math.round((user.games.filter(g => g.result === 'win').length / user.games.length) * 100),
    };

    // Calculate metrics
    const metrics: BenchmarkMetric[] = [
      {
        metric: 'accuracy',
        label: 'Accuracy',
        yourValue: userStats.accuracy,
        peerAverage: benchmarks.accuracy.avg,
        top10Threshold: benchmarks.accuracy.top10,
        percentile: Math.min(99, Math.max(1, Math.round(calculatePercentile(
          userStats.accuracy, benchmarks.accuracy.avg, benchmarks.accuracy.top10, benchmarks.accuracy.bottom10, true
        )))),
        rating: getRating(calculatePercentile(
          userStats.accuracy, benchmarks.accuracy.avg, benchmarks.accuracy.top10, benchmarks.accuracy.bottom10, true
        )),
        comparison: userStats.accuracy >= benchmarks.accuracy.avg
          ? `+${(userStats.accuracy - benchmarks.accuracy.avg).toFixed(1)}% above average`
          : `${(userStats.accuracy - benchmarks.accuracy.avg).toFixed(1)}% below average`,
      },
      {
        metric: 'acpl',
        label: 'Centipawn Loss',
        yourValue: userStats.acpl,
        peerAverage: benchmarks.acpl.avg,
        top10Threshold: benchmarks.acpl.top10,
        percentile: Math.min(99, Math.max(1, Math.round(calculatePercentile(
          userStats.acpl, benchmarks.acpl.avg, benchmarks.acpl.top10, benchmarks.acpl.bottom10, false
        )))),
        rating: getRating(calculatePercentile(
          userStats.acpl, benchmarks.acpl.avg, benchmarks.acpl.top10, benchmarks.acpl.bottom10, false
        )),
        comparison: userStats.acpl <= benchmarks.acpl.avg
          ? `${(benchmarks.acpl.avg - userStats.acpl).toFixed(0)} better than average`
          : `${(userStats.acpl - benchmarks.acpl.avg).toFixed(0)} worse than average`,
      },
      {
        metric: 'blunders',
        label: 'Blunders/Game',
        yourValue: userStats.blundersPerGame,
        peerAverage: benchmarks.blundersPerGame.avg,
        top10Threshold: benchmarks.blundersPerGame.top10,
        percentile: Math.min(99, Math.max(1, Math.round(calculatePercentile(
          userStats.blundersPerGame, benchmarks.blundersPerGame.avg, benchmarks.blundersPerGame.top10, benchmarks.blundersPerGame.bottom10, false
        )))),
        rating: getRating(calculatePercentile(
          userStats.blundersPerGame, benchmarks.blundersPerGame.avg, benchmarks.blundersPerGame.top10, benchmarks.blundersPerGame.bottom10, false
        )),
        comparison: userStats.blundersPerGame <= benchmarks.blundersPerGame.avg
          ? `${(benchmarks.blundersPerGame.avg - userStats.blundersPerGame).toFixed(1)} fewer than average`
          : `${(userStats.blundersPerGame - benchmarks.blundersPerGame.avg).toFixed(1)} more than average`,
      },
      {
        metric: 'mistakes',
        label: 'Mistakes/Game',
        yourValue: userStats.mistakesPerGame,
        peerAverage: benchmarks.mistakesPerGame.avg,
        top10Threshold: benchmarks.mistakesPerGame.top10,
        percentile: Math.min(99, Math.max(1, Math.round(calculatePercentile(
          userStats.mistakesPerGame, benchmarks.mistakesPerGame.avg, benchmarks.mistakesPerGame.top10, benchmarks.mistakesPerGame.bottom10, false
        )))),
        rating: getRating(calculatePercentile(
          userStats.mistakesPerGame, benchmarks.mistakesPerGame.avg, benchmarks.mistakesPerGame.top10, benchmarks.mistakesPerGame.bottom10, false
        )),
        comparison: userStats.mistakesPerGame <= benchmarks.mistakesPerGame.avg
          ? `${(benchmarks.mistakesPerGame.avg - userStats.mistakesPerGame).toFixed(1)} fewer than average`
          : `${(userStats.mistakesPerGame - benchmarks.mistakesPerGame.avg).toFixed(1)} more than average`,
      },
      {
        metric: 'winRate',
        label: 'Win Rate',
        yourValue: userStats.winRate,
        peerAverage: benchmarks.winRate.avg,
        top10Threshold: benchmarks.winRate.top10,
        percentile: Math.min(99, Math.max(1, Math.round(calculatePercentile(
          userStats.winRate, benchmarks.winRate.avg, benchmarks.winRate.top10, benchmarks.winRate.bottom10, true
        )))),
        rating: getRating(calculatePercentile(
          userStats.winRate, benchmarks.winRate.avg, benchmarks.winRate.top10, benchmarks.winRate.bottom10, true
        )),
        comparison: userStats.winRate >= benchmarks.winRate.avg
          ? `+${userStats.winRate - benchmarks.winRate.avg}% above average`
          : `${userStats.winRate - benchmarks.winRate.avg}% below average`,
      },
    ];

    // Identify strengths
    const strengths = metrics
      .filter(m => m.percentile >= 70)
      .map(m => `Your ${m.label.toLowerCase()} is in the top ${100 - m.percentile}% of ${bracket} players`);

    // Identify improvement areas
    const improvementAreas: ImprovementArea[] = metrics
      .filter(m => m.percentile < 50)
      .map(m => ({
        area: m.label,
        description: m.comparison,
        gap: Math.abs(m.yourValue - m.peerAverage),
        priority: (m.percentile < 25 ? 'high' : m.percentile < 40 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      }))
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    // Next level requirements
    const nextBracket = getNextBracket(bracket);
    const requirements: string[] = [];

    if (nextBracket) {
      const nextBenchmarks = RATING_BENCHMARKS[nextBracket];
      if (userStats.accuracy < nextBenchmarks.accuracy.avg) {
        requirements.push(`Improve accuracy to ${nextBenchmarks.accuracy.avg}%+ (currently ${userStats.accuracy}%)`);
      }
      if (userStats.acpl > nextBenchmarks.acpl.avg) {
        requirements.push(`Reduce centipawn loss to ${nextBenchmarks.acpl.avg} (currently ${userStats.acpl})`);
      }
      if (userStats.blundersPerGame > nextBenchmarks.blundersPerGame.avg) {
        requirements.push(`Reduce blunders to ${nextBenchmarks.blundersPerGame.avg}/game (currently ${userStats.blundersPerGame})`);
      }
    }

    // Overall percentile
    const overallPercentile = Math.round(
      metrics.reduce((sum, m) => sum + m.percentile, 0) / metrics.length
    );

    const report: BenchmarkReport = {
      username,
      rating: avgRating,
      ratingBracket: bracket,
      gamesAnalyzed: analyzedGames.length,
      metrics,
      strengths,
      improvementAreas,
      nextLevelRequirements: {
        nextBracket,
        requirements,
      },
      overallPercentile,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating benchmark report:', error);
    return NextResponse.json(
      { error: 'Failed to generate benchmark report' },
      { status: 500 }
    );
  }
}
