import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Puzzle } from '@/types';

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
            moves: {
              where: {
                classification: { in: ['blunder', 'mistake'] },
                bestMove: { not: null },
                fen: { not: null },
              },
              orderBy: { evalLoss: 'desc' },
            },
          },
          orderBy: { playedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform moves into puzzles
    const puzzles: Puzzle[] = [];

    for (const game of user.games) {
      for (const move of game.moves) {
        if (move.fen && move.bestMove) {
          puzzles.push({
            id: move.id,
            gameId: game.id,
            fen: move.fen,
            solution: move.bestMove,
            moveNumber: move.moveNumber,
            yourMove: move.move,
            evalLoss: move.evalLoss,
            classification: move.classification,
            isWhiteToMove: move.isWhite,
            opening: game.opening || undefined,
            playedAt: game.playedAt,
          });
        }
      }
    }

    // Sort by eval loss (worst mistakes first) and limit to 20
    const sortedPuzzles = puzzles
      .sort((a, b) => b.evalLoss - a.evalLoss)
      .slice(0, 20);

    return NextResponse.json({
      puzzles: sortedPuzzles,
      totalMistakes: puzzles.length,
    });
  } catch (error) {
    console.error('Error fetching puzzles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzles' },
      { status: 500 }
    );
  }
}
