'use client';

import { SquareHeatmapData } from '@/types';

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

export function MistakeHeatmap({ data }: MistakeHeatmapProps) {
  const squareMap = new Map(data.map((d) => [d.square, d]));
  const maxErrors = Math.max(...data.map((d) => d.totalErrors), 1);

  const getSquareColor = (square: string): string => {
    const squareData = squareMap.get(square);
    if (!squareData) return 'bg-slate-700';

    const intensity = squareData.totalErrors / maxErrors;

    if (intensity > 0.7) return 'bg-red-600';
    if (intensity > 0.4) return 'bg-orange-500';
    if (intensity > 0.2) return 'bg-yellow-500';
    if (intensity > 0) return 'bg-yellow-600/50';
    return 'bg-slate-700';
  };

  const isLightSquare = (square: string): boolean => {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    return (file + rank) % 2 === 1;
  };

  return (
    <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:gap-8">
      <div className="grid grid-cols-8 gap-0.5 rounded-lg bg-slate-900 p-2">
        {SQUARES.map((row, rowIndex) =>
          row.map((square) => {
            const squareData = squareMap.get(square);
            const baseColor = isLightSquare(square)
              ? 'bg-slate-600'
              : 'bg-slate-700';
            const heatColor = getSquareColor(square);
            const hasErrors = squareData && squareData.totalErrors > 0;

            return (
              <div
                key={square}
                className={`relative flex h-8 w-8 items-center justify-center text-xs font-medium sm:h-10 sm:w-10 ${
                  hasErrors ? heatColor : baseColor
                }`}
                title={
                  squareData
                    ? `${square}: ${squareData.totalErrors} errors (${squareData.mistakeCount} mistakes, ${squareData.blunderCount} blunders)`
                    : square
                }
              >
                {squareData && squareData.totalErrors > 0 && (
                  <span className="text-white text-opacity-90">
                    {squareData.totalErrors}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-300">
            Top Problem Squares
          </h3>
          <div className="space-y-2">
            {data.slice(0, 5).map((square) => (
              <div
                key={square.square}
                className="flex items-center justify-between rounded bg-slate-800 px-3 py-2"
              >
                <span className="font-mono text-lg font-bold">
                  {square.square.toUpperCase()}
                </span>
                <div className="text-right text-sm">
                  <div className="text-slate-300">
                    {square.totalErrors} errors
                  </div>
                  <div className="text-slate-500">
                    {square.mistakeCount} mistakes, {square.blunderCount} blunders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
  );
}
