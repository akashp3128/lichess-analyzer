import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  gamesPlayed: number;
  gamesAnalyzed: number;
  avgAccuracy: number;
  avgAcpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
  avgRating: number;
  ratingChange: number;
}

interface ImprovementMetric {
  metric: string;
  label: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'improving' | 'declining' | 'stable';
  isPositive: boolean;
}

interface ProgressReport {
  username: string;
  totalWeeks: number;
  weeklyMetrics: WeeklyMetrics[];
  improvements: ImprovementMetric[];
  overallTrend: 'improving' | 'declining' | 'stable';
  streaks: {
    currentAccuracyStreak: number;
    bestAccuracyStreak: number;
    currentWinStreak: number;
    bestWinStreak: number;
  };
  milestones: string[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekRange(start: Date): { weekStart: string; weekEnd: string } {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    weekStart: start.toISOString().split('T')[0],
    weekEnd: end.toISOString().split('T')[0],
  };
}

function calculateTrend(current: number, previous: number, higherIsBetter: boolean): 'improving' | 'declining' | 'stable' {
  const changePercent = previous !== 0 ? ((current - previous) / previous) * 100 : 0;

  if (Math.abs(changePercent) < 5) return 'stable';

  if (higherIsBetter) {
    return changePercent > 0 ? 'improving' : 'declining';
  } else {
    return changePercent < 0 ? 'improving' : 'declining';
  }
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
          orderBy: { playedAt: 'asc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.games.length === 0) {
      return NextResponse.json({ error: 'No games found' }, { status: 404 });
    }

    // Group games by week
    const weeklyData = new Map<string, {
      games: typeof user.games;
      weekStart: Date;
    }>();

    for (const game of user.games) {
      const weekStart = getWeekStart(game.playedAt);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { games: [], weekStart });
      }
      weeklyData.get(weekKey)!.games.push(game);
    }

    // Calculate metrics for each week
    const weeklyMetrics: WeeklyMetrics[] = [];
    let lastRating: number | null = null;

    const sortedWeeks = Array.from(weeklyData.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    for (const [_, data] of sortedWeeks) {
      const { games, weekStart } = data;
      const { weekStart: wsStr, weekEnd } = formatWeekRange(weekStart);

      const analyzedGames = games.filter(g => g.analysis);

      let wins = 0, losses = 0, draws = 0;
      let ratingSum = 0, ratingCount = 0;
      let firstRating: number | null = null;
      let lastRatingInWeek: number | null = null;

      for (const game of games) {
        if (game.result === 'win') wins++;
        else if (game.result === 'loss') losses++;
        else draws++;

        if (game.playerRating) {
          ratingSum += game.playerRating;
          ratingCount++;
          if (firstRating === null) firstRating = game.playerRating;
          lastRatingInWeek = game.playerRating;
        }
      }

      const avgRating = ratingCount > 0 ? Math.round(ratingSum / ratingCount) : 0;
      const ratingChange = lastRating !== null && lastRatingInWeek !== null
        ? lastRatingInWeek - lastRating
        : 0;

      if (lastRatingInWeek !== null) {
        lastRating = lastRatingInWeek;
      }

      const totalAccuracy = analyzedGames.reduce((sum, g) => sum + (g.analysis?.accuracy || 0), 0);
      const totalAcpl = analyzedGames.reduce((sum, g) => sum + (g.analysis?.acpl || 0), 0);
      const totalBlunders = analyzedGames.reduce((sum, g) => sum + (g.analysis?.blunders || 0), 0);
      const totalMistakes = analyzedGames.reduce((sum, g) => sum + (g.analysis?.mistakes || 0), 0);
      const totalInaccuracies = analyzedGames.reduce((sum, g) => sum + (g.analysis?.inaccuracies || 0), 0);

      weeklyMetrics.push({
        weekStart: wsStr,
        weekEnd,
        gamesPlayed: games.length,
        gamesAnalyzed: analyzedGames.length,
        avgAccuracy: analyzedGames.length > 0 ? Math.round((totalAccuracy / analyzedGames.length) * 10) / 10 : 0,
        avgAcpl: analyzedGames.length > 0 ? Math.round((totalAcpl / analyzedGames.length) * 10) / 10 : 0,
        blunders: totalBlunders,
        mistakes: totalMistakes,
        inaccuracies: totalInaccuracies,
        winRate: games.length > 0 ? Math.round((wins / games.length) * 100) : 0,
        wins,
        losses,
        draws,
        avgRating,
        ratingChange,
      });
    }

    // Calculate improvements (compare last 2 weeks with previous 2 weeks)
    const improvements: ImprovementMetric[] = [];

    if (weeklyMetrics.length >= 2) {
      const recentWeeks = weeklyMetrics.slice(-2);
      const previousWeeks = weeklyMetrics.slice(-4, -2);

      const calcAvg = (weeks: WeeklyMetrics[], key: keyof WeeklyMetrics) => {
        const validWeeks = weeks.filter(w => typeof w[key] === 'number' && w.gamesAnalyzed > 0);
        if (validWeeks.length === 0) return 0;
        return validWeeks.reduce((sum, w) => sum + (w[key] as number), 0) / validWeeks.length;
      };

      const metrics: Array<{
        key: keyof WeeklyMetrics;
        label: string;
        higherIsBetter: boolean;
      }> = [
        { key: 'avgAccuracy', label: 'Accuracy', higherIsBetter: true },
        { key: 'avgAcpl', label: 'Avg Centipawn Loss', higherIsBetter: false },
        { key: 'winRate', label: 'Win Rate', higherIsBetter: true },
        { key: 'blunders', label: 'Blunders per Week', higherIsBetter: false },
        { key: 'mistakes', label: 'Mistakes per Week', higherIsBetter: false },
      ];

      for (const { key, label, higherIsBetter } of metrics) {
        const current = calcAvg(recentWeeks, key);
        const previous = previousWeeks.length > 0 ? calcAvg(previousWeeks, key) : current;
        const change = current - previous;
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
        const trend = calculateTrend(current, previous, higherIsBetter);

        improvements.push({
          metric: key,
          label,
          current: Math.round(current * 10) / 10,
          previous: Math.round(previous * 10) / 10,
          change: Math.round(change * 10) / 10,
          changePercent: Math.round(changePercent * 10) / 10,
          trend,
          isPositive: (higherIsBetter && change > 0) || (!higherIsBetter && change < 0),
        });
      }
    }

    // Calculate overall trend
    const improvingCount = improvements.filter(i => i.trend === 'improving').length;
    const decliningCount = improvements.filter(i => i.trend === 'declining').length;
    let overallTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (improvingCount > decliningCount + 1) overallTrend = 'improving';
    else if (decliningCount > improvingCount + 1) overallTrend = 'declining';

    // Calculate streaks
    let currentAccuracyStreak = 0;
    let bestAccuracyStreak = 0;
    let tempAccuracyStreak = 0;
    let lastAccuracy = 0;

    let currentWinStreak = 0;
    let bestWinStreak = 0;
    let tempWinStreak = 0;

    for (const week of weeklyMetrics) {
      // Accuracy streak (improving)
      if (week.avgAccuracy > lastAccuracy && week.gamesAnalyzed > 0) {
        tempAccuracyStreak++;
        if (tempAccuracyStreak > bestAccuracyStreak) {
          bestAccuracyStreak = tempAccuracyStreak;
        }
      } else {
        tempAccuracyStreak = 0;
      }
      lastAccuracy = week.avgAccuracy;

      // Win streak (>50% win rate)
      if (week.winRate > 50) {
        tempWinStreak++;
        if (tempWinStreak > bestWinStreak) {
          bestWinStreak = tempWinStreak;
        }
      } else {
        tempWinStreak = 0;
      }
    }

    currentAccuracyStreak = tempAccuracyStreak;
    currentWinStreak = tempWinStreak;

    // Generate milestones
    const milestones: string[] = [];
    const latestWeek = weeklyMetrics[weeklyMetrics.length - 1];
    const firstWeek = weeklyMetrics[0];

    if (latestWeek && firstWeek) {
      if (latestWeek.avgAccuracy > firstWeek.avgAccuracy + 5) {
        milestones.push(`Accuracy improved by ${Math.round(latestWeek.avgAccuracy - firstWeek.avgAccuracy)}% since tracking began`);
      }
      if (latestWeek.avgRating > firstWeek.avgRating + 50) {
        milestones.push(`Rating increased by ${latestWeek.avgRating - firstWeek.avgRating} points`);
      }
      if (bestWinStreak >= 3) {
        milestones.push(`Achieved ${bestWinStreak}-week winning streak`);
      }
      if (currentAccuracyStreak >= 2) {
        milestones.push(`${currentAccuracyStreak} consecutive weeks of accuracy improvement`);
      }
    }

    const report: ProgressReport = {
      username,
      totalWeeks: weeklyMetrics.length,
      weeklyMetrics: weeklyMetrics.slice(-8), // Last 8 weeks
      improvements,
      overallTrend,
      streaks: {
        currentAccuracyStreak,
        bestAccuracyStreak,
        currentWinStreak,
        bestWinStreak,
      },
      milestones,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating progress report:', error);
    return NextResponse.json(
      { error: 'Failed to generate progress report' },
      { status: 500 }
    );
  }
}
