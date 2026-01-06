export interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: LichessPlayer;
    black: LichessPlayer;
  };
  opening?: {
    eco: string;
    name: string;
    ply: number;
  };
  moves: string;
  pgn: string;
  clock?: {
    initial: number;
    increment: number;
    totalTime: number;
  };
  winner?: 'white' | 'black';
}

export interface LichessPlayer {
  user?: {
    name: string;
    id: string;
  };
  rating?: number;
  ratingDiff?: number;
}

export interface GameWithAnalysis {
  id: string;
  lichessId: string;
  pgn: string;
  white: string;
  black: string;
  result: string;
  timeControl: string;
  perfType: string;
  opening: string | null;
  openingEco: string | null;
  playerColor: string;
  playerRating: number | null;
  opponentRating: number | null;
  playedAt: Date;
  analysis: AnalysisResult | null;
}

export interface AnalysisResult {
  accuracy: number;
  acpl: number;
  bestMoves: number;
  goodMoves: number;
  inaccuracies: number;
  mistakes: number;
  blunders: number;
  missedMates: number;
  timeInTrouble: number;
  avgMoveTime: number | null;
}

export type ChessPiece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';

export interface MoveAnalysisResult {
  moveNumber: number;
  move: string;
  isWhite: boolean;
  evaluation: number;
  bestMove: string | null;
  evalLoss: number;
  classification: MoveClassification;
  square: string;
  piece: ChessPiece;
  timeSpent: number | null;
  timeRemaining: number | null;
  inTimeTrouble: boolean;
  fen: string;
}

export interface Puzzle {
  id: string;
  gameId: string;
  fen: string;
  solution: string;
  moveNumber: number;
  yourMove: string;
  evalLoss: number;
  classification: string;
  isWhiteToMove: boolean;
  opening?: string;
  playedAt: Date;
}

export type MoveClassification =
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'missed_mate';

export interface StockfishEvaluation {
  depth: number;
  evaluation: number;
  bestMove: string;
  isMate: boolean;
  mateIn: number | null;
}

export interface OpeningStats {
  name: string;
  eco: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

export interface PieceErrorCount {
  piece: ChessPiece;
  mistakes: number;
  blunders: number;
  total: number;
}

export interface SquareHeatmapData {
  square: string;
  mistakeCount: number;
  blunderCount: number;
  totalErrors: number;
  byPiece: PieceErrorCount[];
}

export interface RatingHistoryPoint {
  date: string;
  rating: number;
  gameId: string;
}

export interface PhaseStats {
  phase: 'opening' | 'middlegame' | 'endgame';
  accuracy: number;
  acpl: number;
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  totalMoves: number;
}

export interface TimeTroubleStats {
  normalMoves: number;
  normalAccuracy: number;
  normalBlunders: number;
  timeTroubleMoves: number;
  timeTroubleAccuracy: number;
  timeTroubleBlunders: number;
  accuracyDrop: number;
  timeTroubleThreshold: number;
}

export interface UserStats {
  totalGames: number;
  analyzedGames: number;
  avgAccuracy: number;
  avgAcpl: number;
  totalBlunders: number;
  totalMistakes: number;
  totalInaccuracies: number;
  mostCommonMistakeSquares: SquareHeatmapData[];
  openingStats: OpeningStats[];
  ratingHistory: RatingHistoryPoint[];
  phaseStats: PhaseStats[];
  timeTroubleStats: TimeTroubleStats | null;
  weaknessReport: WeaknessReport;
  tiltStats: TiltStats | null;
  endgameReport: EndgameReport | null;
}

export interface AnalysisProgress {
  current: number;
  total: number;
  gameId: string;
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  currentMove?: number;
  totalMoves?: number;
}

export interface WeaknessInsight {
  category: string;
  title: string;
  description: string;
  impact: number;
  frequency?: number;
  suggestion?: string;
}

export interface WeaknessReport {
  topWeaknesses: WeaknessInsight[];
  strengths: WeaknessInsight[];
  overallScore: number;
  gamesAnalyzed: number;
}

export type EndgameType =
  | 'pawn'           // K+P vs K or K+P vs K+P
  | 'rook'           // Rook endings
  | 'queen'          // Queen endings
  | 'bishop'         // Bishop endings
  | 'knight'         // Knight endings
  | 'minor_piece'    // B vs N, B+N, etc.
  | 'rook_minor'     // R + minor vs R + minor
  | 'queen_rook'     // Q vs R type
  | 'complex'        // Multiple piece types
  | 'mating_attack'  // Game ended in middlegame with attack
  | 'unknown';

export interface EndgameStats {
  type: string;
  typeName: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgAccuracy: number;
}

export interface EndgameSummary {
  type: string;
  typeName: string;
  winRate: number;
  games: number;
}

export interface EndgameReport {
  endgameStats: EndgameStats[];
  bestEndgame: EndgameSummary | null;
  worstEndgame: EndgameSummary | null;
  totalEndgames: number;
  reachedEndgameRate: number; // % of games that reached endgame
}

export interface TiltStats {
  afterWin: {
    games: number;
    avgAccuracy: number;
    winRate: number;
    blunders: number;
  };
  afterLoss: {
    games: number;
    avgAccuracy: number;
    winRate: number;
    blunders: number;
  };
  afterDraw: {
    games: number;
    avgAccuracy: number;
    winRate: number;
    blunders: number;
  };
  accuracyDrop: number; // afterLoss.avgAccuracy - afterWin.avgAccuracy
  winRateDrop: number;
  tiltScore: number; // 0-100, higher = more affected by losses
  isTilting: boolean;
  streakStats: {
    currentStreak: number; // positive = wins, negative = losses
    longestWinStreak: number;
    longestLoseStreak: number;
    performanceAfterStreak: number; // accuracy after 2+ losses in a row
  };
}
