import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { aggregateOpeningStats, aggregateMistakeSquares, aggregatePhaseStats, aggregateTimeTroubleStats, generateWeaknessReport, analyzeTilt, analyzeEndgames } from '@/lib/analysis';
import { UserStats } from '@/types';

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
            moves: true,
          },
          orderBy: { playedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const analyzedGames = user.games.filter((g) => g.analysis);
    const allMoves = user.games.flatMap((g) => g.moves);

    const totalAccuracy =
      analyzedGames.reduce((sum, g) => sum + (g.analysis?.accuracy || 0), 0);
    const totalAcpl =
      analyzedGames.reduce((sum, g) => sum + (g.analysis?.acpl || 0), 0);

    const totalBlunders = analyzedGames.reduce(
      (sum, g) => sum + (g.analysis?.blunders || 0),
      0
    );
    const totalMistakes = analyzedGames.reduce(
      (sum, g) => sum + (g.analysis?.mistakes || 0),
      0
    );
    const totalInaccuracies = analyzedGames.reduce(
      (sum, g) => sum + (g.analysis?.inaccuracies || 0),
      0
    );

    const openingStats = aggregateOpeningStats(
      user.games.map((g) => ({
        opening: g.opening,
        openingEco: g.openingEco,
        result: g.result,
      }))
    );

    const mistakeSquares = aggregateMistakeSquares(
      allMoves.map((m) => ({
        square: m.square,
        classification: m.classification,
        piece: m.piece,
      }))
    );

    const phaseStats = aggregatePhaseStats(
      allMoves.map((m) => ({
        moveNumber: m.moveNumber,
        classification: m.classification,
        evalLoss: m.evalLoss,
      }))
    );

    const timeTroubleStats = aggregateTimeTroubleStats(
      allMoves.map((m) => ({
        evalLoss: m.evalLoss,
        classification: m.classification,
        inTimeTrouble: m.inTimeTrouble,
      }))
    );

    const ratingHistory = user.games
      .filter((g) => g.playerRating)
      .map((g) => ({
        date: g.playedAt.toISOString().split('T')[0],
        rating: g.playerRating!,
        gameId: g.id,
      }))
      .reverse();

    const avgAccuracy = analyzedGames.length > 0
      ? Math.round((totalAccuracy / analyzedGames.length) * 10) / 10
      : 0;

    const weaknessReport = generateWeaknessReport({
      phaseStats,
      timeTroubleStats,
      openingStats,
      mistakeSquares,
      totalGames: user.games.length,
      avgAccuracy,
      totalBlunders,
      totalMistakes,
    });

    const tiltStats = analyzeTilt(
      user.games.map((g) => ({
        id: g.id,
        result: g.result as 'win' | 'loss' | 'draw',
        accuracy: g.analysis?.accuracy || null,
        blunders: g.analysis?.blunders || 0,
        playedAt: g.playedAt,
      }))
    );

    const endgameReport = analyzeEndgames(
      user.games.map((g) => ({
        id: g.id,
        pgn: g.pgn,
        result: g.result as 'win' | 'loss' | 'draw',
        accuracy: g.analysis?.accuracy || null,
        moveCount: g.moves.length,
      }))
    );

    const stats: UserStats = {
      totalGames: user.games.length,
      analyzedGames: analyzedGames.length,
      avgAccuracy,
      avgAcpl:
        analyzedGames.length > 0
          ? Math.round((totalAcpl / analyzedGames.length) * 10) / 10
          : 0,
      totalBlunders,
      totalMistakes,
      totalInaccuracies,
      mostCommonMistakeSquares: mistakeSquares.slice(0, 10),
      openingStats: openingStats.slice(0, 15),
      ratingHistory,
      phaseStats,
      timeTroubleStats,
      weaknessReport,
      tiltStats,
      endgameReport,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
