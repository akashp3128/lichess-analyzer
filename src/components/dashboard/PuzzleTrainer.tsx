'use client';

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { Puzzle } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Target,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';

interface PuzzleTrainerProps {
  username: string;
}

export function PuzzleTrainer({ username }: PuzzleTrainerProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [loading, setLoading] = useState(true);
  const [boardPosition, setBoardPosition] = useState('start');
  const [solutionApplied, setSolutionApplied] = useState(false);

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const res = await fetch(`/api/puzzles/${encodeURIComponent(username)}`);
        if (res.ok) {
          const data = await res.json();
          setPuzzles(data.puzzles);
          if (data.puzzles.length > 0) {
            setBoardPosition(data.puzzles[0].fen);
          }
        }
      } catch (error) {
        console.error('Error fetching puzzles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzles();
  }, [username]);

  const currentPuzzle = puzzles[currentIndex];

  const goToNext = useCallback(() => {
    if (currentIndex < puzzles.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setBoardPosition(puzzles[nextIndex].fen);
      setShowSolution(false);
      setSolutionApplied(false);
    }
  }, [currentIndex, puzzles]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setBoardPosition(puzzles[prevIndex].fen);
      setShowSolution(false);
      setSolutionApplied(false);
    }
  }, [currentIndex, puzzles]);

  const toggleSolution = () => {
    setShowSolution(!showSolution);
  };

  const applySolution = () => {
    if (!currentPuzzle || solutionApplied) return;

    try {
      const chess = new Chess(currentPuzzle.fen);
      chess.move(currentPuzzle.solution);
      setBoardPosition(chess.fen());
      setSolutionApplied(true);
      setShowSolution(true);
    } catch {
      console.error('Invalid solution move');
    }
  };

  const resetPosition = () => {
    if (currentPuzzle) {
      setBoardPosition(currentPuzzle.fen);
      setSolutionApplied(false);
    }
  };

  const formatSolution = (solution: string): string => {
    // Convert UCI format (e.g., "e2e4") to more readable format
    if (solution.length === 4 || solution.length === 5) {
      const from = solution.slice(0, 2);
      const to = solution.slice(2, 4);
      const promotion = solution.length === 5 ? `=${solution[4].toUpperCase()}` : '';
      return `${from}-${to}${promotion}`;
    }
    return solution;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (puzzles.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No puzzles available yet</p>
        <p className="text-sm mt-2">
          Analyze some games to generate puzzles from your mistakes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Puzzle Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
              currentPuzzle.classification === 'blunder'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-orange-500/20 text-orange-400'
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            {currentPuzzle.classification === 'blunder' ? 'Blunder' : 'Mistake'}
          </span>
          <span className="text-sm text-slate-400">
            Move {currentPuzzle.moveNumber} ({Math.round(currentPuzzle.evalLoss * 100)} cp lost)
          </span>
        </div>
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {puzzles.length}
        </span>
      </div>

      {/* Chess Board */}
      <div className="flex justify-center">
        <div className="w-full max-w-[400px]">
          <Chessboard
            position={boardPosition}
            boardOrientation={currentPuzzle.isWhiteToMove ? 'white' : 'black'}
            arePiecesDraggable={false}
            customBoardStyle={{
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
            customDarkSquareStyle={{ backgroundColor: '#779952' }}
            customLightSquareStyle={{ backgroundColor: '#edeed1' }}
          />
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-center">
        <span className="text-sm text-slate-300">
          {currentPuzzle.isWhiteToMove ? 'White' : 'Black'} to move - Find the best move!
        </span>
      </div>

      {/* Your Move vs Best Move */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-red-500/10 p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">You played</p>
          <p className="font-mono text-lg text-red-400">{currentPuzzle.yourMove}</p>
        </div>
        <div className="rounded-lg bg-green-500/10 p-3 text-center">
          <p className="text-xs text-slate-400 mb-1">Best move</p>
          {showSolution ? (
            <p className="font-mono text-lg text-green-400">
              {formatSolution(currentPuzzle.solution)}
            </p>
          ) : (
            <p className="font-mono text-lg text-slate-600">???</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>

        <button
          onClick={toggleSolution}
          className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-400 hover:bg-amber-500/30"
        >
          {showSolution ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Reveal
            </>
          )}
        </button>

        {showSolution && !solutionApplied && (
          <button
            onClick={applySolution}
            className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-2 text-sm text-green-400 hover:bg-green-500/30"
          >
            <Lightbulb className="h-4 w-4" />
            Show on Board
          </button>
        )}

        {solutionApplied && (
          <button
            onClick={resetPosition}
            className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}

        <button
          onClick={goToNext}
          disabled={currentIndex === puzzles.length - 1}
          className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Opening Info */}
      {currentPuzzle.opening && (
        <p className="text-center text-xs text-slate-500">
          From: {currentPuzzle.opening}
        </p>
      )}
    </div>
  );
}
