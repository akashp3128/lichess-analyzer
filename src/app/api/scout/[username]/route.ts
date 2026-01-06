import { NextRequest, NextResponse } from 'next/server';
import { fetchUserGames } from '@/lib/lichess';
import { LichessGame } from '@/types';

interface OpeningFrequency {
  name: string;
  eco: string;
  count: number;
  percentage: number;
  winRate: number;
  wins: number;
  losses: number;
  draws: number;
}

interface ColorStats {
  games: number;
  winRate: number;
  avgRating: number;
  favoriteOpenings: OpeningFrequency[];
}

interface TimeControlStats {
  timeControl: string;
  games: number;
  winRate: number;
}

interface PerformancePattern {
  type: string;
  description: string;
  value: number;
}

interface ScoutReport {
  username: string;
  rating: number | null;
  totalGames: number;
  overallWinRate: number;
  asWhite: ColorStats;
  asBlack: ColorStats;
  timeControlStats: TimeControlStats[];
  recentForm: {
    last10WinRate: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  patterns: PerformancePattern[];
  suggestedPreparation: string[];
}

function analyzeOpenings(
  games: LichessGame[],
  username: string,
  asWhite: boolean
): OpeningFrequency[] {
  const openingMap = new Map<string, {
    name: string;
    eco: string;
    count: number;
    wins: number;
    losses: number;
    draws: number;
  }>();

  const usernameLower = username.toLowerCase();

  for (const game of games) {
    const isPlayerWhite = game.players.white.user?.name.toLowerCase() === usernameLower;
    if (isPlayerWhite !== asWhite) continue;

    if (!game.opening) continue;

    const key = game.opening.eco;
    const existing = openingMap.get(key) || {
      name: game.opening.name,
      eco: game.opening.eco,
      count: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };

    existing.count++;

    // Determine result from player's perspective
    if (game.winner === 'white' && isPlayerWhite) existing.wins++;
    else if (game.winner === 'black' && !isPlayerWhite) existing.wins++;
    else if (game.winner === 'white' && !isPlayerWhite) existing.losses++;
    else if (game.winner === 'black' && isPlayerWhite) existing.losses++;
    else existing.draws++;

    openingMap.set(key, existing);
  }

  const total = Array.from(openingMap.values()).reduce((sum, o) => sum + o.count, 0);

  return Array.from(openingMap.values())
    .map(o => ({
      name: o.name,
      eco: o.eco,
      count: o.count,
      percentage: total > 0 ? Math.round((o.count / total) * 100) : 0,
      winRate: o.count > 0 ? Math.round((o.wins / o.count) * 100) : 0,
      wins: o.wins,
      losses: o.losses,
      draws: o.draws,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function analyzeColorStats(
  games: LichessGame[],
  username: string,
  asWhite: boolean
): ColorStats {
  const usernameLower = username.toLowerCase();
  const colorGames = games.filter(g => {
    const isPlayerWhite = g.players.white.user?.name.toLowerCase() === usernameLower;
    return isPlayerWhite === asWhite;
  });

  let wins = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const game of colorGames) {
    const isPlayerWhite = game.players.white.user?.name.toLowerCase() === usernameLower;
    const playerData = isPlayerWhite ? game.players.white : game.players.black;

    if (game.winner === 'white' && isPlayerWhite) wins++;
    else if (game.winner === 'black' && !isPlayerWhite) wins++;

    if (playerData.rating) {
      ratingSum += playerData.rating;
      ratingCount++;
    }
  }

  return {
    games: colorGames.length,
    winRate: colorGames.length > 0 ? Math.round((wins / colorGames.length) * 100) : 0,
    avgRating: ratingCount > 0 ? Math.round(ratingSum / ratingCount) : 0,
    favoriteOpenings: analyzeOpenings(games, username, asWhite),
  };
}

function analyzeTimeControls(games: LichessGame[], username: string): TimeControlStats[] {
  const usernameLower = username.toLowerCase();
  const tcMap = new Map<string, { games: number; wins: number }>();

  for (const game of games) {
    const tc = game.speed || 'unknown';
    const existing = tcMap.get(tc) || { games: 0, wins: 0 };
    existing.games++;

    const isPlayerWhite = game.players.white.user?.name.toLowerCase() === usernameLower;
    if (game.winner === 'white' && isPlayerWhite) existing.wins++;
    else if (game.winner === 'black' && !isPlayerWhite) existing.wins++;

    tcMap.set(tc, existing);
  }

  return Array.from(tcMap.entries())
    .map(([tc, data]) => ({
      timeControl: tc,
      games: data.games,
      winRate: data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games);
}

function analyzeRecentForm(games: LichessGame[], username: string): {
  last10WinRate: number;
  trend: 'improving' | 'declining' | 'stable';
} {
  const usernameLower = username.toLowerCase();
  const recentGames = games.slice(0, 10);
  const olderGames = games.slice(10, 20);

  const countWins = (gameList: LichessGame[]) => {
    let wins = 0;
    for (const game of gameList) {
      const isPlayerWhite = game.players.white.user?.name.toLowerCase() === usernameLower;
      if (game.winner === 'white' && isPlayerWhite) wins++;
      else if (game.winner === 'black' && !isPlayerWhite) wins++;
    }
    return wins;
  };

  const recentWins = countWins(recentGames);
  const olderWins = countWins(olderGames);

  const recentWinRate = recentGames.length > 0 ? (recentWins / recentGames.length) * 100 : 0;
  const olderWinRate = olderGames.length > 0 ? (olderWins / olderGames.length) * 100 : 0;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (recentWinRate > olderWinRate + 10) trend = 'improving';
  else if (recentWinRate < olderWinRate - 10) trend = 'declining';

  return {
    last10WinRate: Math.round(recentWinRate),
    trend,
  };
}

function generatePatterns(
  asWhite: ColorStats,
  asBlack: ColorStats,
  timeControls: TimeControlStats[]
): PerformancePattern[] {
  const patterns: PerformancePattern[] = [];

  // Color preference
  if (asWhite.winRate > asBlack.winRate + 10) {
    patterns.push({
      type: 'color_preference',
      description: 'Stronger as White',
      value: asWhite.winRate - asBlack.winRate,
    });
  } else if (asBlack.winRate > asWhite.winRate + 10) {
    patterns.push({
      type: 'color_preference',
      description: 'Stronger as Black',
      value: asBlack.winRate - asWhite.winRate,
    });
  }

  // Opening diversity
  const whiteOpeningCount = asWhite.favoriteOpenings.length;
  const blackOpeningCount = asBlack.favoriteOpenings.length;

  if (asWhite.favoriteOpenings[0]?.percentage > 50) {
    patterns.push({
      type: 'opening_narrow',
      description: `Predictable as White: plays ${asWhite.favoriteOpenings[0].name} ${asWhite.favoriteOpenings[0].percentage}% of time`,
      value: asWhite.favoriteOpenings[0].percentage,
    });
  }

  if (asBlack.favoriteOpenings[0]?.percentage > 50) {
    patterns.push({
      type: 'opening_narrow',
      description: `Predictable as Black: plays ${asBlack.favoriteOpenings[0].name} ${asBlack.favoriteOpenings[0].percentage}% of time`,
      value: asBlack.favoriteOpenings[0].percentage,
    });
  }

  // Time control preference
  const bestTC = timeControls.reduce((a, b) => a.winRate > b.winRate ? a : b, timeControls[0]);
  const worstTC = timeControls.reduce((a, b) => a.winRate < b.winRate ? a : b, timeControls[0]);

  if (bestTC && worstTC && bestTC.winRate - worstTC.winRate > 15) {
    patterns.push({
      type: 'time_control',
      description: `Struggles in ${worstTC.timeControl} (${worstTC.winRate}% win rate)`,
      value: worstTC.winRate,
    });
  }

  // Weak openings
  const allOpenings = [...asWhite.favoriteOpenings, ...asBlack.favoriteOpenings];
  const weakOpenings = allOpenings.filter(o => o.count >= 3 && o.winRate < 40);
  for (const opening of weakOpenings.slice(0, 2)) {
    patterns.push({
      type: 'weak_opening',
      description: `Weak in ${opening.name} (${opening.winRate}% win rate)`,
      value: opening.winRate,
    });
  }

  return patterns;
}

function generatePreparationSuggestions(
  asWhite: ColorStats,
  asBlack: ColorStats,
  patterns: PerformancePattern[]
): string[] {
  const suggestions: string[] = [];

  // Suggest based on their favorite openings
  if (asWhite.favoriteOpenings[0]) {
    const fav = asWhite.favoriteOpenings[0];
    suggestions.push(`Prepare against ${fav.name} (${fav.eco}) - they play this ${fav.percentage}% as White`);
  }

  if (asBlack.favoriteOpenings[0]) {
    const fav = asBlack.favoriteOpenings[0];
    suggestions.push(`Expect ${fav.name} (${fav.eco}) as Black - ${fav.percentage}% of their games`);
  }

  // Exploit weak openings
  const weakPattern = patterns.find(p => p.type === 'weak_opening');
  if (weakPattern) {
    suggestions.push(`Target their weakness: ${weakPattern.description}`);
  }

  // Color exploitation
  const colorPattern = patterns.find(p => p.type === 'color_preference');
  if (colorPattern) {
    if (colorPattern.description.includes('White')) {
      suggestions.push('They struggle as Black - aim for complex positions if you have White');
    } else {
      suggestions.push('They struggle as White - consider sharp defenses');
    }
  }

  return suggestions.slice(0, 4);
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
    // Fetch recent games from Lichess
    const games = await fetchUserGames(username, { max: 50 });

    if (games.length === 0) {
      return NextResponse.json(
        { error: 'No games found for this user' },
        { status: 404 }
      );
    }

    const usernameLower = username.toLowerCase();

    // Get player's rating from most recent game
    const latestGame = games[0];
    const isPlayerWhite = latestGame.players.white.user?.name.toLowerCase() === usernameLower;
    const rating = isPlayerWhite
      ? latestGame.players.white.rating
      : latestGame.players.black.rating;

    // Calculate overall win rate
    let totalWins = 0;
    for (const game of games) {
      const isWhite = game.players.white.user?.name.toLowerCase() === usernameLower;
      if (game.winner === 'white' && isWhite) totalWins++;
      else if (game.winner === 'black' && !isWhite) totalWins++;
    }

    const asWhite = analyzeColorStats(games, username, true);
    const asBlack = analyzeColorStats(games, username, false);
    const timeControlStats = analyzeTimeControls(games, username);
    const recentForm = analyzeRecentForm(games, username);
    const patterns = generatePatterns(asWhite, asBlack, timeControlStats);
    const suggestedPreparation = generatePreparationSuggestions(asWhite, asBlack, patterns);

    const report: ScoutReport = {
      username,
      rating: rating || null,
      totalGames: games.length,
      overallWinRate: Math.round((totalWins / games.length) * 100),
      asWhite,
      asBlack,
      timeControlStats,
      recentForm,
      patterns,
      suggestedPreparation,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating scout report:', error);
    return NextResponse.json(
      { error: 'Failed to generate scout report' },
      { status: 500 }
    );
  }
}
