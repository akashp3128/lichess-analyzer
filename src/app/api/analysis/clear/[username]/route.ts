import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        games: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const gameIds = user.games.map((g) => g.id);

    if (gameIds.length === 0) {
      return NextResponse.json({
        message: 'No games to clear',
        clearedAnalyses: 0,
        clearedMoves: 0,
      });
    }

    // Delete all move analyses for user's games
    const deletedMoves = await prisma.moveAnalysis.deleteMany({
      where: {
        gameId: { in: gameIds },
      },
    });

    // Delete all analyses for user's games
    const deletedAnalyses = await prisma.analysis.deleteMany({
      where: {
        gameId: { in: gameIds },
      },
    });

    return NextResponse.json({
      message: 'Analysis data cleared successfully',
      clearedAnalyses: deletedAnalyses.count,
      clearedMoves: deletedMoves.count,
    });
  } catch (error) {
    console.error('Error clearing analysis:', error);
    return NextResponse.json(
      { error: 'Failed to clear analysis data' },
      { status: 500 }
    );
  }
}
