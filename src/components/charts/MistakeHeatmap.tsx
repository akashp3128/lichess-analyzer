'use client';

import { useState } from 'react';
import { SquareHeatmapData, ChessPiece } from '@/types';
import { X } from 'lucide-react';

interface MistakeHeatmapProps {
  data: SquareHeatmapData[];
}

const SQUARES = [
  ['a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'],
  ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7'],
  ['a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6'],
  ['a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5'],
  ['a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4'],
  ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3'],
  ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
  ['a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'],
];

const PIECE_NAMES: Record<ChessPiece, string> = {
  P: 'Pawn',
  N: 'Knight',
  B: 'Bishop',
  R: 'Rook',
  Q: 'Queen',
  K: 'King',
};

const PIECE_SYMBOLS: Record<ChessPiece, string> = {
  P: '♟',
  N: '♞',
  B: '♝',
  R: '♜',
  Q: '♛',
  K: '♚',
};

export function MistakeHeatmap({ data }: MistakeHeatmapProps) {
  const [selectedSquare, setSelectedSquare] = useState<SquareHeatmapData | null>(null);
  const [filterPiece, setFilterPiece] = useState<ChessPiece | null>(null);

  const squareMap = new Map(data.map((d) => [d.square, d]));
  const maxErrors = Math.max(...data.map((d) => d.totalErrors), 1);

  // Aggregate piece stats across all squares
  const pieceStats = new Map<ChessPiece, { mistakes: number; blunders: number; total: number }>();
  for (const square of data) {
    for (const pieceData of square.byPiece || []) {
      const existing = pieceStats.get(pieceData.piece) || { mistakes: 0, blunders: 0, total: 0 };
      existing.mistakes += pieceData.mistakes;
      existing.blunders += pieceData.blunders;
      existing.total += pieceData.total;
      pieceStats.set(pieceData.piece, existing);
    }
  }

  const sortedPieceStats = Array.from(pieceStats.entries())
    .map(([piece, stats]) => ({ piece, ...stats }))
    .sort((a, b) => b.total - a.total);

  const getSquareColor = (square: string): string => {
    const squareData = squareMap.get(square);
    if (!squareData) return 'bg-slate-700';

    // If filtering by piece, only count errors for that piece
    let errorCount = squareData.totalErrors;
    if (filterPiece && squareData.byPiece) {
      const pieceData = squareData.byPiece.find((p) => p.piece === filterPiece);
      errorCount = pieceData?.total || 0;
    }

    if (errorCount === 0) return 'bg-slate-700';

    const intensity = errorCount / maxErrors;

    if (intensity > 0.7) return 'bg-red-600';
    if (intensity > 0.4) return 'bg-orange-500';
    if (intensity > 0.2) return 'bg-yellow-500';
    if (intensity > 0) return 'bg-yellow-600/50';
    return 'bg-slate-700';
  };

  const getErrorCount = (square: string): number => {
    const squareData = squareMap.get(square);
    if (!squareData) return 0;

    if (filterPiece && squareData.byPiece) {
      const pieceData = squareData.byPiece.find((p) => p.piece === filterPiece);
      return pieceData?.total || 0;
    }

    return squareData.totalErrors;
  };

  const isLightSquare = (square: string): boolean => {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    return (file + rank) % 2 === 1;
  };

  return (
    <div className="space-y-6">
      {/* Piece Filter Buttons */}
      {sortedPieceStats.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">Filter by piece:</span>
          <button
            onClick={() => setFilterPiece(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterPiece === null
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {sortedPieceStats.map(({ piece, total }) => (
            <button
              key={piece}
              onClick={() => setFilterPiece(filterPiece === piece ? null : piece)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filterPiece === piece
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span className="text-lg">{PIECE_SYMBOLS[piece]}</span>
              <span>{total}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
        {/* Chessboard Heatmap */}
        <div className="grid grid-cols-8 gap-0.5 rounded-lg bg-slate-900 p-2">
          {SQUARES.map((row) =>
            row.map((square) => {
              const squareData = squareMap.get(square);
              const baseColor = isLightSquare(square) ? 'bg-slate-600' : 'bg-slate-700';
              const errorCount = getErrorCount(square);
              const heatColor = getSquareColor(square);
              const hasErrors = errorCount > 0;

              return (
                <button
                  key={square}
                  onClick={() => squareData && hasErrors && setSelectedSquare(squareData)}
                  className={`relative flex h-8 w-8 items-center justify-center text-xs font-medium sm:h-10 sm:w-10 ${
                    hasErrors ? heatColor : baseColor
                  } ${hasErrors ? 'cursor-pointer hover:ring-2 hover:ring-white/50' : ''}`}
                  title={
                    squareData
                      ? `${square}: ${squareData.totalErrors} errors`
                      : square
                  }
                >
                  {hasErrors && (
                    <span className="text-white text-opacity-90">{errorCount}</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Stats Panel */}
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              Top Problem Squares
            </h3>
            <div className="space-y-2">
              {data.slice(0, 5).map((square) => (
                <button
                  key={square.square}
                  onClick={() => setSelectedSquare(square)}
                  className="flex w-full items-center justify-between rounded bg-slate-800 px-3 py-2 hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-bold">
                      {square.square.toUpperCase()}
                    </span>
                    {square.byPiece && square.byPiece.length > 0 && (
                      <span className="text-lg text-slate-400">
                        {square.byPiece[0] && PIECE_SYMBOLS[square.byPiece[0].piece]}
                      </span>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-slate-300">{square.totalErrors} errors</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Piece Breakdown Summary */}
          {sortedPieceStats.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium text-slate-300">
                Errors by Piece
              </h3>
              <div className="space-y-1">
                {sortedPieceStats.slice(0, 4).map(({ piece, mistakes, blunders, total }) => (
                  <div
                    key={piece}
                    className="flex items-center justify-between rounded bg-slate-800/50 px-3 py-1.5 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{PIECE_SYMBOLS[piece]}</span>
                      <span className="text-slate-300">{PIECE_NAMES[piece]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-orange-400">{mistakes}m</span>
                      <span className="text-red-400">{blunders}b</span>
                      <span className="font-medium text-white">{total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Fewer errors</span>
            <div className="flex gap-1">
              <div className="h-4 w-4 rounded bg-slate-700" />
              <div className="h-4 w-4 rounded bg-yellow-600/50" />
              <div className="h-4 w-4 rounded bg-yellow-500" />
              <div className="h-4 w-4 rounded bg-orange-500" />
              <div className="h-4 w-4 rounded bg-red-600" />
            </div>
            <span>More errors</span>
          </div>
        </div>
      </div>

      {/* Square Detail Modal */}
      {selectedSquare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 p-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl font-bold">
                  {selectedSquare.square.toUpperCase()}
                </span>
                <span className="text-slate-400">
                  {selectedSquare.totalErrors} total errors
                </span>
              </div>
              <button
                onClick={() => setSelectedSquare(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {/* Error breakdown */}
              <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-orange-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {selectedSquare.mistakeCount}
                  </div>
                  <div className="text-sm text-slate-400">Mistakes</div>
                </div>
                <div className="rounded-lg bg-red-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {selectedSquare.blunderCount}
                  </div>
                  <div className="text-sm text-slate-400">Blunders</div>
                </div>
              </div>

              {/* Piece breakdown */}
              {selectedSquare.byPiece && selectedSquare.byPiece.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-300">
                    By Piece Type
                  </h4>
                  <div className="space-y-2">
                    {selectedSquare.byPiece.map((pieceData) => (
                      <div
                        key={pieceData.piece}
                        className="flex items-center justify-between rounded-lg bg-slate-700/50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{PIECE_SYMBOLS[pieceData.piece]}</span>
                          <span className="text-slate-300">{PIECE_NAMES[pieceData.piece]}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-orange-400">
                            {pieceData.mistakes} mistakes
                          </span>
                          <span className="text-red-400">
                            {pieceData.blunders} blunders
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!selectedSquare.byPiece || selectedSquare.byPiece.length === 0) && (
                <p className="text-center text-sm text-slate-400">
                  Piece data not available for existing games.
                  Re-analyze games to see piece breakdown.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
