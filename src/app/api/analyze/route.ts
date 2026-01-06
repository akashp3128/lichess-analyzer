import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AnalysisResult, MoveAnalysisResult } from '@/types';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId, analysis, moves } = body as {
      gameId: string;
      analysis: AnalysisResult;
      moves: MoveAnalysisResult[];
    };

    if (!gameId || !analysis) {
      return NextResponse.json(
        { error: 'gameId and analysis are required' },
        { status: 400 }
      );
    }

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { analysis: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.analysis) {
      await prisma.analysis.update({
        where: { gameId },
        data: {
          accuracy: analysis.accuracy,
          acpl: analysis.acpl,
          bestMoves: analysis.bestMoves,
          goodMoves: analysis.goodMoves,
          inaccuracies: analysis.inaccuracies,
          mistakes: analysis.mistakes,
          blunders: analysis.blunders,
          missedMates: analysis.missedMates,
          timeInTrouble: analysis.timeInTrouble,
          avgMoveTime: analysis.avgMoveTime,
          analyzedAt: new Date(),
        },
      });

      await prisma.moveAnalysis.deleteMany({
        where: { gameId },
      });
    } else {
      await prisma.analysis.create({
        data: {
          accuracy: analysis.accuracy,
          acpl: analysis.acpl,
          bestMoves: analysis.bestMoves,
          goodMoves: analysis.goodMoves,
          inaccuracies: analysis.inaccuracies,
          mistakes: analysis.mistakes,
          blunders: analysis.blunders,
          missedMates: analysis.missedMates,
          timeInTrouble: analysis.timeInTrouble,
          avgMoveTime: analysis.avgMoveTime,
          gameId,
        },
      });
    }

    if (moves && moves.length > 0) {
      await prisma.moveAnalysis.createMany({
        data: moves.map((move) => ({
          id: generateId(),
          moveNumber: move.moveNumber,
          move: move.move,
          isWhite: move.isWhite,
          evaluation: move.evaluation,
          bestMove: move.bestMove,
          evalLoss: move.evalLoss,
          classification: move.classification,
          square: move.square,
          timeSpent: move.timeSpent,
          gameId,
        })),
      });
    }

    const updatedGame = await prisma.game.findUnique({
      where: { id: gameId },
      include: { analysis: true, moves: true },
    });

    return NextResponse.json({
      success: true,
      game: updatedGame,
    });
  } catch (error) {
    console.error('Error saving analysis:', error);
    return NextResponse.json(
      { error: 'Failed to save analysis' },
      { status: 500 }
    );
  }
}
