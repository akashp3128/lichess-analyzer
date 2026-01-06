import { Chess } from 'chess.js';
import {
  AnalysisResult,
  MoveAnalysisResult,
  MoveClassification,
  StockfishEvaluation,
  ChessPiece,
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

export function getPieceFromMove(san: string): ChessPiece {
  // Castling is a king move
  if (san.startsWith('O-O')) return 'K';

  // Check first character for piece indicator
  const firstChar = san[0];
  if (firstChar === 'N') return 'N';
  if (firstChar === 'B') return 'B';
  if (firstChar === 'R') return 'R';
  if (firstChar === 'Q') return 'Q';
  if (firstChar === 'K') return 'K';

  // If no piece indicator, it's a pawn move
  return 'P';
}

// Parse clock time from PGN comment like "{ [%clk 0:05:23] }"
export function parseClockTime(comment: string): number | null {
  const match = comment.match(/\[%clk (\d+):(\d+):(\d+)\]/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Extract clock times from PGN for each move
export function extractClockTimes(pgn: string): Map<number, { white: number | null; black: number | null }> {
  const clockTimes = new Map<number, { white: number | null; black: number | null }>();

  // Match moves with their clock comments
  // Format: 1. e4 { [%clk 0:10:00] } e5 { [%clk 0:10:00] }
  const movePattern = /(\d+)\.\s*(\S+)\s*(?:\{([^}]*)\})?\s*(?:(\S+)\s*(?:\{([^}]*)\})?)?/g;

  let match;
  while ((match = movePattern.exec(pgn)) !== null) {
    const moveNum = parseInt(match[1], 10);
    const whiteComment = match[3] || '';
    const blackComment = match[5] || '';

    clockTimes.set(moveNum, {
      white: parseClockTime(whiteComment),
      black: parseClockTime(blackComment),
    });
  }

  return clockTimes;
}

// Parse initial time from TimeControl header (e.g., "600+0" = 600 seconds)
export function parseInitialTime(pgn: string): number | null {
  const match = pgn.match(/\[TimeControl "(\d+)\+?\d*"\]/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

// Determine if in time trouble (less than 10% of initial time remaining)
export function isInTimeTrouble(timeRemaining: number, initialTime: number, threshold = 0.1): boolean {
  return timeRemaining < initialTime * threshold;
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

  // Extract clock times and initial time for time trouble tracking
  const clockTimes = extractClockTimes(pgn);
  const initialTime = parseInitialTime(pgn);

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

      // Get time remaining for this move
      const moveNum = Math.floor(i / 2) + 1;
      const clockData = clockTimes.get(moveNum);
      const timeRemaining = clockData
        ? (isWhiteMove ? clockData.white : clockData.black)
        : null;
      const inTimeTrouble = timeRemaining !== null && initialTime !== null
        ? isInTimeTrouble(timeRemaining, initialTime)
        : false;

      moveAnalyses.push({
        moveNumber: moveNum,
        move: move.san,
        isWhite: isWhiteMove,
        evaluation: evalAfter.evaluation,
        bestMove: evalBefore.bestMove !== move.lan ? evalBefore.bestMove : null,
        evalLoss,
        classification,
        square: move.to,
        piece: getPieceFromMove(move.san),
        timeSpent: null,
        timeRemaining,
        inTimeTrouble,
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
  moves: Array<{ square: string; classification: string; piece?: string }>
): Array<{
  square: string;
  mistakeCount: number;
  blunderCount: number;
  totalErrors: number;
  byPiece: Array<{ piece: ChessPiece; mistakes: number; blunders: number; total: number }>;
}> {
  const squareMap = new Map<
    string,
    {
      mistakeCount: number;
      blunderCount: number;
      pieceMap: Map<string, { mistakes: number; blunders: number }>;
    }
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
      pieceMap: new Map(),
    };

    const piece = move.piece || 'P';
    const pieceData = existing.pieceMap.get(piece) || { mistakes: 0, blunders: 0 };

    if (move.classification === 'mistake') {
      existing.mistakeCount++;
      pieceData.mistakes++;
    } else {
      existing.blunderCount++;
      pieceData.blunders++;
    }

    existing.pieceMap.set(piece, pieceData);
    squareMap.set(move.square, existing);
  }

  return Array.from(squareMap.entries())
    .map(([square, data]) => ({
      square,
      mistakeCount: data.mistakeCount,
      blunderCount: data.blunderCount,
      totalErrors: data.mistakeCount + data.blunderCount,
      byPiece: Array.from(data.pieceMap.entries())
        .map(([piece, counts]) => ({
          piece: piece as ChessPiece,
          mistakes: counts.mistakes,
          blunders: counts.blunders,
          total: counts.mistakes + counts.blunders,
        }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.totalErrors - a.totalErrors);
}

export function getPhase(moveNumber: number): 'opening' | 'middlegame' | 'endgame' {
  if (moveNumber <= 15) return 'opening';
  if (moveNumber <= 35) return 'middlegame';
  return 'endgame';
}

export function aggregatePhaseStats(
  moves: Array<{
    moveNumber: number;
    classification: string;
    evalLoss: number;
  }>
): Array<{
  phase: 'opening' | 'middlegame' | 'endgame';
  accuracy: number;
  acpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  totalMoves: number;
}> {
  const phases: ('opening' | 'middlegame' | 'endgame')[] = ['opening', 'middlegame', 'endgame'];

  const phaseData = new Map<string, {
    totalEvalLoss: number;
    blunders: number;
    mistakes: number;
    inaccuracies: number;
    totalMoves: number;
  }>();

  // Initialize phases
  for (const phase of phases) {
    phaseData.set(phase, {
      totalEvalLoss: 0,
      blunders: 0,
      mistakes: 0,
      inaccuracies: 0,
      totalMoves: 0,
    });
  }

  // Aggregate move data by phase
  for (const move of moves) {
    const phase = getPhase(move.moveNumber);
    const data = phaseData.get(phase)!;

    data.totalMoves++;
    data.totalEvalLoss += move.evalLoss;

    if (move.classification === 'blunder' || move.classification === 'missed_mate') {
      data.blunders++;
    } else if (move.classification === 'mistake') {
      data.mistakes++;
    } else if (move.classification === 'inaccuracy') {
      data.inaccuracies++;
    }
  }

  // Calculate accuracy and ACPL for each phase
  return phases.map((phase) => {
    const data = phaseData.get(phase)!;
    const acpl = data.totalMoves > 0 ? (data.totalEvalLoss / data.totalMoves) * 100 : 0;
    const accuracy = Math.max(0, 100 - acpl * 0.5);

    return {
      phase,
      accuracy: Math.round(accuracy * 10) / 10,
      acpl: Math.round(acpl * 10) / 10,
      blunders: data.blunders,
      mistakes: data.mistakes,
      inaccuracies: data.inaccuracies,
      totalMoves: data.totalMoves,
    };
  });
}

export function aggregateTimeTroubleStats(
  moves: Array<{
    evalLoss: number;
    classification: string;
    inTimeTrouble: boolean;
  }>
): {
  normalMoves: number;
  normalAccuracy: number;
  normalBlunders: number;
  timeTroubleMoves: number;
  timeTroubleAccuracy: number;
  timeTroubleBlunders: number;
  accuracyDrop: number;
  timeTroubleThreshold: number;
} | null {
  const normalMoves = moves.filter(m => !m.inTimeTrouble);
  const timeTroubleMoves = moves.filter(m => m.inTimeTrouble);

  // Need at least some moves in each category for meaningful stats
  if (normalMoves.length === 0 || timeTroubleMoves.length < 2) {
    return null;
  }

  const calcAccuracy = (moveList: typeof moves) => {
    if (moveList.length === 0) return 0;
    const totalLoss = moveList.reduce((sum, m) => sum + m.evalLoss, 0);
    const acpl = (totalLoss / moveList.length) * 100;
    return Math.max(0, Math.round((100 - acpl * 0.5) * 10) / 10);
  };

  const countBlunders = (moveList: typeof moves) =>
    moveList.filter(m => m.classification === 'blunder' || m.classification === 'missed_mate').length;

  const normalAccuracy = calcAccuracy(normalMoves);
  const timeTroubleAccuracy = calcAccuracy(timeTroubleMoves);

  return {
    normalMoves: normalMoves.length,
    normalAccuracy,
    normalBlunders: countBlunders(normalMoves),
    timeTroubleMoves: timeTroubleMoves.length,
    timeTroubleAccuracy,
    timeTroubleBlunders: countBlunders(timeTroubleMoves),
    accuracyDrop: Math.round((normalAccuracy - timeTroubleAccuracy) * 10) / 10,
    timeTroubleThreshold: 60, // seconds (10% of 600s = 60s for 10+0)
  };
}
