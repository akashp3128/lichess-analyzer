import { Chess } from 'chess.js';
import {
  AnalysisResult,
  MoveAnalysisResult,
  MoveClassification,
  StockfishEvaluation,
} from '@/types';
import { StockfishEngine } from './stockfish';

const THRESHOLDS = {
  INACCURACY: 0.2,
  MISTAKE: 0.5,
  BLUNDER: 1.0,
  GOOD_MOVE: 0.2,
};

export function classifyMove(
  evalLoss: number,
  missedMate: boolean
): MoveClassification {
  if (missedMate) return 'missed_mate';
  if (evalLoss <= 0) return 'best';
  if (evalLoss <= THRESHOLDS.GOOD_MOVE) return 'good';
  if (evalLoss <= THRESHOLDS.INACCURACY) return 'inaccuracy';
  if (evalLoss <= THRESHOLDS.MISTAKE) return 'mistake';
  return 'blunder';
}

export function calculateAccuracy(evalLoss: number): number {
  const accuracy = Math.max(0, 100 - evalLoss * 50);
  return Math.min(100, accuracy);
}

export function getSquareFromMove(move: string): string {
  const cleanMove = move.replace(/[+#x=NBRQK]/g, '');
  const match = cleanMove.match(/([a-h][1-8])/g);
  if (match && match.length > 0) {
    return match[match.length - 1];
  }
  return 'unknown';
}

export async function analyzeGame(
  pgn: string,
  playerColor: 'white' | 'black',
  engine: StockfishEngine,
  onProgress?: (moveNumber: number, totalMoves: number) => void
): Promise<{
  analysis: AnalysisResult;
  moves: MoveAnalysisResult[];
}> {
  const chess = new Chess();
  chess.loadPgn(pgn);

  const history = chess.history({ verbose: true });
  chess.reset();

  const moveAnalyses: MoveAnalysisResult[] = [];
  let totalEvalLoss = 0;
  let playerMoveCount = 0;
  let lastEval: StockfishEvaluation | null = null;

  const counts = {
    best: 0,
    good: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
    missedMate: 0,
  };

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const isWhiteMove = i % 2 === 0;
    const isPlayerMove =
      (isWhiteMove && playerColor === 'white') ||
      (!isWhiteMove && playerColor === 'black');

    const fenBefore = chess.fen();
    const evalBefore = await engine.evaluate(fenBefore, 12);

    chess.move(move);

    const fenAfter = chess.fen();
    const evalAfter = await engine.evaluate(fenAfter, 12);

    if (isPlayerMove) {
      const evalBeforeFromPlayer = isWhiteMove
        ? evalBefore.evaluation
        : -evalBefore.evaluation;
      const evalAfterFromPlayer = isWhiteMove
        ? -evalAfter.evaluation
        : evalAfter.evaluation;

      const evalLoss = Math.max(0, evalBeforeFromPlayer - evalAfterFromPlayer);
      totalEvalLoss += evalLoss;
      playerMoveCount++;

      const missedMate =
        lastEval?.isMate &&
        lastEval.mateIn !== null &&
        ((isWhiteMove && lastEval.mateIn > 0) ||
          (!isWhiteMove && lastEval.mateIn < 0)) &&
        !evalAfter.isMate;

      const classification = classifyMove(evalLoss, !!missedMate);

      switch (classification) {
        case 'best':
          counts.best++;
          break;
        case 'good':
          counts.good++;
          break;
        case 'inaccuracy':
          counts.inaccuracy++;
          break;
        case 'mistake':
          counts.mistake++;
          break;
        case 'blunder':
          counts.blunder++;
          break;
        case 'missed_mate':
          counts.missedMate++;
          break;
      }

      moveAnalyses.push({
        moveNumber: Math.floor(i / 2) + 1,
        move: move.san,
        isWhite: isWhiteMove,
        evaluation: evalAfter.evaluation,
        bestMove: evalBefore.bestMove !== move.lan ? evalBefore.bestMove : null,
        evalLoss,
        classification,
        square: move.to,
        timeSpent: null,
      });
    }

    lastEval = evalBefore;

    if (onProgress) {
      onProgress(i + 1, history.length);
    }
  }

  const acpl = playerMoveCount > 0 ? (totalEvalLoss / playerMoveCount) * 100 : 0;

  const accuracyScores = moveAnalyses.map((m) => calculateAccuracy(m.evalLoss));
  const avgAccuracy =
    accuracyScores.length > 0
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length
      : 0;

  return {
    analysis: {
      accuracy: Math.round(avgAccuracy * 10) / 10,
      acpl: Math.round(acpl * 10) / 10,
      bestMoves: counts.best,
      goodMoves: counts.good,
      inaccuracies: counts.inaccuracy,
      mistakes: counts.mistake,
      blunders: counts.blunder,
      missedMates: counts.missedMate,
      timeInTrouble: 0,
      avgMoveTime: null,
    },
    moves: moveAnalyses,
  };
}

export function aggregateOpeningStats(
  games: Array<{
    opening: string | null;
    openingEco: string | null;
    result: string;
  }>
): Array<{
  name: string;
  eco: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}> {
  const openingMap = new Map<
    string,
    {
      name: string;
      eco: string;
      games: number;
      wins: number;
      losses: number;
      draws: number;
    }
  >();

  for (const game of games) {
    if (!game.opening) continue;

    const key = game.openingEco || game.opening;
    const existing = openingMap.get(key) || {
      name: game.opening,
      eco: game.openingEco || '',
      games: 0,
      wins: 0,
      losses: 0,
      draws: 0,
    };

    existing.games++;
    if (game.result === 'win') existing.wins++;
    else if (game.result === 'loss') existing.losses++;
    else existing.draws++;

    openingMap.set(key, existing);
  }

  return Array.from(openingMap.values())
    .map((o) => ({
      ...o,
      winRate: o.games > 0 ? Math.round((o.wins / o.games) * 100) : 0,
    }))
    .sort((a, b) => b.games - a.games);
}

export function aggregateMistakeSquares(
  moves: Array<{ square: string; classification: string }>
): Array<{
  square: string;
  mistakeCount: number;
  blunderCount: number;
  totalErrors: number;
}> {
  const squareMap = new Map<
    string,
    { mistakeCount: number; blunderCount: number }
  >();

  for (const move of moves) {
    if (
      move.classification !== 'mistake' &&
      move.classification !== 'blunder' &&
      move.classification !== 'missed_mate'
    ) {
      continue;
    }

    const existing = squareMap.get(move.square) || {
      mistakeCount: 0,
      blunderCount: 0,
    };

    if (move.classification === 'mistake') {
      existing.mistakeCount++;
    } else {
      existing.blunderCount++;
    }

    squareMap.set(move.square, existing);
  }

  return Array.from(squareMap.entries())
    .map(([square, counts]) => ({
      square,
      ...counts,
      totalErrors: counts.mistakeCount + counts.blunderCount,
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors);
}
