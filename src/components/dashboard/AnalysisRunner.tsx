'use client';

import { useEffect, useRef } from 'react';
import { GameWithAnalysis, AnalysisProgress } from '@/types';
import { getStockfishEngine } from '@/lib/stockfish';
import { analyzeGame } from '@/lib/analysis';

interface AnalysisRunnerProps {
  games: GameWithAnalysis[];
  onProgress: (progress: AnalysisProgress) => void;
  onComplete: () => void;
}

export function AnalysisRunner({ games, onProgress, onComplete }: AnalysisRunnerProps) {
  const isRunning = useRef(false);

  useEffect(() => {
    if (isRunning.current || games.length === 0) return;
    isRunning.current = true;

    const runAnalysis = async () => {
      const engine = getStockfishEngine();

      try {
        await engine.init();
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        onComplete();
        return;
      }

      for (let i = 0; i < games.length; i++) {
        const game = games[i];

        onProgress({
          current: i + 1,
          total: games.length,
          gameId: game.id,
          status: 'analyzing',
        });

        try {
          const { analysis, moves } = await analyzeGame(
            game.pgn,
            game.playerColor as 'white' | 'black',
            engine,
            (currentMove, totalMoves) => {
              onProgress({
                current: i + 1,
                total: games.length,
                gameId: game.id,
                status: 'analyzing',
                currentMove,
                totalMoves,
              });
            }
          );

          await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: game.id,
              analysis,
              moves,
            }),
          });
        } catch (error) {
          console.error(`Error analyzing game ${game.id}:`, error);
        }
      }

      engine.quit();
      onComplete();
    };

    runAnalysis();

    return () => {
      isRunning.current = false;
    };
  }, [games, onProgress, onComplete]);

  return null;
}
