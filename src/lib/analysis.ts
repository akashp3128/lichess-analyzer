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

export interface WeaknessAnalysisInput {
  phaseStats: Array<{
    phase: 'opening' | 'middlegame' | 'endgame';
    accuracy: number;
    blunders: number;
    mistakes: number;
    totalMoves: number;
  }>;
  timeTroubleStats: {
    normalAccuracy: number;
    timeTroubleAccuracy: number;
    accuracyDrop: number;
    timeTroubleBlunders: number;
    normalBlunders: number;
    timeTroubleMoves: number;
    normalMoves: number;
  } | null;
  openingStats: Array<{
    name: string;
    eco: string;
    games: number;
    winRate: number;
    losses: number;
  }>;
  mistakeSquares: Array<{
    square: string;
    totalErrors: number;
    byPiece?: Array<{ piece: string; total: number }>;
  }>;
  totalGames: number;
  avgAccuracy: number;
  totalBlunders: number;
  totalMistakes: number;
}

export function generateWeaknessReport(input: WeaknessAnalysisInput): {
  topWeaknesses: Array<{
    category: string;
    title: string;
    description: string;
    impact: number;
    frequency: number;
    suggestion: string;
  }>;
  strengths: Array<{
    category: string;
    title: string;
    description: string;
    impact: number;
  }>;
  overallScore: number;
  gamesAnalyzed: number;
} {
  const weaknesses: Array<{
    category: string;
    title: string;
    description: string;
    impact: number;
    frequency: number;
    suggestion: string;
  }> = [];

  const strengths: Array<{
    category: string;
    title: string;
    description: string;
    impact: number;
  }> = [];

  // Analyze phase weaknesses
  if (input.phaseStats.length > 0) {
    const sortedPhases = [...input.phaseStats].sort((a, b) => a.accuracy - b.accuracy);
    const weakestPhase = sortedPhases[0];
    const strongestPhase = sortedPhases[sortedPhases.length - 1];

    if (weakestPhase && weakestPhase.accuracy < 75) {
      const phaseNames = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };
      const suggestions = {
        opening: 'Study your main opening lines and focus on the first 10-15 moves.',
        middlegame: 'Practice tactical puzzles and focus on piece coordination.',
        endgame: 'Study basic endgame patterns: King+Pawn, Rook endings, and opposition.',
      };

      weaknesses.push({
        category: 'phase_weakness',
        title: `Weak ${phaseNames[weakestPhase.phase]}`,
        description: `Your ${phaseNames[weakestPhase.phase].toLowerCase()} accuracy is ${weakestPhase.accuracy}% with ${weakestPhase.blunders} blunders.`,
        impact: Math.round((80 - weakestPhase.accuracy) * 1.2),
        frequency: weakestPhase.totalMoves,
        suggestion: suggestions[weakestPhase.phase],
      });
    }

    if (strongestPhase && strongestPhase.accuracy >= 80) {
      const phaseNames = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };
      strengths.push({
        category: 'phase_strength',
        title: `Strong ${phaseNames[strongestPhase.phase]}`,
        description: `Your ${phaseNames[strongestPhase.phase].toLowerCase()} accuracy is ${strongestPhase.accuracy}%.`,
        impact: Math.round(strongestPhase.accuracy - 70),
      });
    }
  }

  // Analyze time trouble
  if (input.timeTroubleStats && input.timeTroubleStats.accuracyDrop > 5) {
    const blunderRate = input.timeTroubleStats.timeTroubleMoves > 0
      ? (input.timeTroubleStats.timeTroubleBlunders / input.timeTroubleStats.timeTroubleMoves) * 100
      : 0;

    weaknesses.push({
      category: 'time_management',
      title: 'Time Trouble Issues',
      description: `Your accuracy drops ${input.timeTroubleStats.accuracyDrop}% in time trouble with a ${blunderRate.toFixed(1)}% blunder rate.`,
      impact: Math.round(input.timeTroubleStats.accuracyDrop * 2),
      frequency: input.timeTroubleStats.timeTroubleMoves,
      suggestion: 'Practice faster calculation. Consider playing increment games to improve time management.',
    });
  } else if (input.timeTroubleStats && input.timeTroubleStats.accuracyDrop <= 0) {
    strengths.push({
      category: 'time_management',
      title: 'Good Under Pressure',
      description: 'You maintain accuracy even in time trouble situations.',
      impact: 15,
    });
  }

  // Analyze opening performance
  const badOpenings = input.openingStats.filter(o => o.games >= 3 && o.winRate < 35);
  if (badOpenings.length > 0) {
    const worstOpening = badOpenings.sort((a, b) => a.winRate - b.winRate)[0];
    weaknesses.push({
      category: 'opening_theory',
      title: 'Struggling Opening',
      description: `${worstOpening.name} has only ${worstOpening.winRate}% win rate over ${worstOpening.games} games.`,
      impact: Math.round((50 - worstOpening.winRate) * 0.8),
      frequency: worstOpening.games,
      suggestion: `Consider studying ${worstOpening.name} theory or switching to a different opening.`,
    });
  }

  const goodOpenings = input.openingStats.filter(o => o.games >= 3 && o.winRate >= 60);
  if (goodOpenings.length > 0) {
    const bestOpening = goodOpenings.sort((a, b) => b.winRate - a.winRate)[0];
    strengths.push({
      category: 'opening_theory',
      title: 'Strong Opening',
      description: `${bestOpening.name} with ${bestOpening.winRate}% win rate.`,
      impact: Math.round((bestOpening.winRate - 50) * 0.5),
    });
  }

  // Analyze piece-specific mistakes
  if (input.mistakeSquares.length > 0) {
    const pieceErrors = new Map<string, number>();
    for (const sq of input.mistakeSquares) {
      if (sq.byPiece) {
        for (const p of sq.byPiece) {
          pieceErrors.set(p.piece, (pieceErrors.get(p.piece) || 0) + p.total);
        }
      }
    }

    const sortedPieces = Array.from(pieceErrors.entries()).sort((a, b) => b[1] - a[1]);
    if (sortedPieces.length > 0) {
      const [worstPiece, errorCount] = sortedPieces[0];
      const pieceNames: Record<string, string> = {
        P: 'Pawn', N: 'Knight', B: 'Bishop', R: 'Rook', Q: 'Queen', K: 'King'
      };
      const pieceSuggestions: Record<string, string> = {
        P: 'Review pawn structure concepts and avoid creating weaknesses.',
        N: 'Knights need outposts. Avoid placing them on the rim.',
        B: 'Keep bishops on open diagonals. Watch for blocked pawns.',
        R: 'Rooks belong on open files. Connect them early.',
        Q: 'Avoid early queen moves. Protect your queen from attacks.',
        K: 'Prioritize king safety. Castle early in most games.',
      };

      if (errorCount >= 3) {
        weaknesses.push({
          category: 'piece_handling',
          title: `${pieceNames[worstPiece] || worstPiece} Mistakes`,
          description: `${errorCount} errors with your ${(pieceNames[worstPiece] || worstPiece).toLowerCase()}s.`,
          impact: Math.min(40, errorCount * 5),
          frequency: errorCount,
          suggestion: pieceSuggestions[worstPiece] || 'Focus on this piece type in your training.',
        });
      }
    }
  }

  // Analyze blunder rate
  const blunderRate = input.totalGames > 0 ? input.totalBlunders / input.totalGames : 0;
  if (blunderRate >= 2) {
    weaknesses.push({
      category: 'tactical_awareness',
      title: 'High Blunder Rate',
      description: `Averaging ${blunderRate.toFixed(1)} blunders per game.`,
      impact: Math.min(50, Math.round(blunderRate * 15)),
      frequency: input.totalBlunders,
      suggestion: 'Do tactical puzzles daily. Use the "blunder check" before each move.',
    });
  } else if (blunderRate < 0.5 && input.totalGames >= 5) {
    strengths.push({
      category: 'tactical_awareness',
      title: 'Low Blunder Rate',
      description: `Only ${blunderRate.toFixed(1)} blunders per game on average.`,
      impact: 20,
    });
  }

  // Calculate overall score
  const baseScore = Math.min(100, input.avgAccuracy);
  const weaknessPenalty = weaknesses.reduce((sum, w) => sum + w.impact * 0.3, 0);
  const strengthBonus = strengths.reduce((sum, s) => sum + s.impact * 0.2, 0);
  const overallScore = Math.max(0, Math.min(100, Math.round(baseScore - weaknessPenalty + strengthBonus)));

  // Sort by impact
  weaknesses.sort((a, b) => b.impact - a.impact);
  strengths.sort((a, b) => b.impact - a.impact);

  return {
    topWeaknesses: weaknesses.slice(0, 3),
    strengths: strengths.slice(0, 3),
    overallScore,
    gamesAnalyzed: input.totalGames,
  };
}

export interface TiltAnalysisGame {
  id: string;
  result: 'win' | 'loss' | 'draw';
  accuracy: number | null;
  blunders: number;
  playedAt: Date;
}

export function analyzeTilt(games: TiltAnalysisGame[]): {
  afterWin: { games: number; avgAccuracy: number; winRate: number; blunders: number };
  afterLoss: { games: number; avgAccuracy: number; winRate: number; blunders: number };
  afterDraw: { games: number; avgAccuracy: number; winRate: number; blunders: number };
  accuracyDrop: number;
  winRateDrop: number;
  tiltScore: number;
  isTilting: boolean;
  streakStats: {
    currentStreak: number;
    longestWinStreak: number;
    longestLoseStreak: number;
    performanceAfterStreak: number;
  };
} | null {
  if (games.length < 3) return null;

  // Sort games by date (oldest first to analyze sequential performance)
  const sortedGames = [...games].sort(
    (a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
  );

  const afterWin: TiltAnalysisGame[] = [];
  const afterLoss: TiltAnalysisGame[] = [];
  const afterDraw: TiltAnalysisGame[] = [];
  const afterLoseStreak: TiltAnalysisGame[] = []; // Games after 2+ consecutive losses

  let currentStreak = 0;
  let longestWinStreak = 0;
  let longestLoseStreak = 0;
  let tempWinStreak = 0;
  let tempLoseStreak = 0;

  for (let i = 1; i < sortedGames.length; i++) {
    const prevGame = sortedGames[i - 1];
    const currGame = sortedGames[i];

    // Track what happened after previous result
    if (prevGame.result === 'win') {
      afterWin.push(currGame);
      tempWinStreak++;
      tempLoseStreak = 0;
    } else if (prevGame.result === 'loss') {
      afterLoss.push(currGame);
      tempLoseStreak++;
      tempWinStreak = 0;

      // Track games after losing streaks (2+ losses)
      if (tempLoseStreak >= 2) {
        afterLoseStreak.push(currGame);
      }
    } else {
      afterDraw.push(currGame);
      tempWinStreak = 0;
      tempLoseStreak = 0;
    }

    longestWinStreak = Math.max(longestWinStreak, tempWinStreak);
    longestLoseStreak = Math.max(longestLoseStreak, tempLoseStreak);
  }

  // Calculate current streak from most recent games
  const recentGames = sortedGames.slice(-10).reverse();
  for (const game of recentGames) {
    if (currentStreak === 0) {
      currentStreak = game.result === 'win' ? 1 : game.result === 'loss' ? -1 : 0;
    } else if (currentStreak > 0 && game.result === 'win') {
      currentStreak++;
    } else if (currentStreak < 0 && game.result === 'loss') {
      currentStreak--;
    } else {
      break;
    }
  }

  // Helper to calculate stats for a group of games
  const calcStats = (gameList: TiltAnalysisGame[]) => {
    const analyzed = gameList.filter(g => g.accuracy !== null);
    const wins = gameList.filter(g => g.result === 'win').length;
    const totalBlunders = gameList.reduce((sum, g) => sum + g.blunders, 0);

    return {
      games: gameList.length,
      avgAccuracy: analyzed.length > 0
        ? Math.round((analyzed.reduce((sum, g) => sum + (g.accuracy || 0), 0) / analyzed.length) * 10) / 10
        : 0,
      winRate: gameList.length > 0 ? Math.round((wins / gameList.length) * 100) : 0,
      blunders: totalBlunders,
    };
  };

  const afterWinStats = calcStats(afterWin);
  const afterLossStats = calcStats(afterLoss);
  const afterDrawStats = calcStats(afterDraw);

  // Calculate accuracy and win rate drops
  const accuracyDrop = afterWinStats.avgAccuracy - afterLossStats.avgAccuracy;
  const winRateDrop = afterWinStats.winRate - afterLossStats.winRate;

  // Calculate tilt score (0-100, higher = more tilted)
  // Factors: accuracy drop, win rate drop, blunder increase
  let tiltScore = 0;
  if (afterWin.length >= 2 && afterLoss.length >= 2) {
    tiltScore += Math.max(0, accuracyDrop) * 2; // Up to ~40 points
    tiltScore += Math.max(0, winRateDrop) * 0.5; // Up to ~25 points

    const blunderRateAfterWin = afterWin.length > 0 ? afterWinStats.blunders / afterWin.length : 0;
    const blunderRateAfterLoss = afterLoss.length > 0 ? afterLossStats.blunders / afterLoss.length : 0;
    const blunderIncrease = blunderRateAfterLoss - blunderRateAfterWin;
    tiltScore += Math.max(0, blunderIncrease) * 20; // Up to ~20 points
  }
  tiltScore = Math.min(100, Math.round(tiltScore));

  // Performance after losing streaks
  const streakPerformance = afterLoseStreak.length > 0
    ? calcStats(afterLoseStreak).avgAccuracy
    : afterLossStats.avgAccuracy;

  return {
    afterWin: afterWinStats,
    afterLoss: afterLossStats,
    afterDraw: afterDrawStats,
    accuracyDrop: Math.round(accuracyDrop * 10) / 10,
    winRateDrop: Math.round(winRateDrop * 10) / 10,
    tiltScore,
    isTilting: tiltScore >= 25 || accuracyDrop >= 5,
    streakStats: {
      currentStreak,
      longestWinStreak: longestWinStreak + 1, // +1 because we count from 0
      longestLoseStreak: longestLoseStreak + 1,
      performanceAfterStreak: streakPerformance,
    },
  };
}
