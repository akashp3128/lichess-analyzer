'use client';

import { GameWithAnalysis } from '@/types';
import { formatDate, getResultColor } from '@/lib/utils';
import { ExternalLink, CheckCircle, Clock } from 'lucide-react';

interface GamesListProps {
  games: GameWithAnalysis[];
}

export function GamesList({ games }: GamesListProps) {
  if (games.length === 0) {
    return (
      <p className="py-8 text-center text-slate-400">No games found</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 text-left text-sm text-slate-400">
            <th className="pb-3 pr-4">Date</th>
            <th className="pb-3 pr-4">Opening</th>
            <th className="pb-3 pr-4">Opponent</th>
            <th className="pb-3 pr-4">Result</th>
            <th className="pb-3 pr-4">Time</th>
            <th className="pb-3 pr-4">Accuracy</th>
            <th className="pb-3 pr-4">Status</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {games.map((game) => {
            const opponent =
              game.playerColor === 'white' ? game.black : game.white;
            const opponentRating = game.opponentRating;

            return (
              <tr
                key={game.id}
                className="border-b border-slate-800 hover:bg-slate-800/50"
              >
                <td className="py-3 pr-4 text-slate-300">
                  {formatDate(new Date(game.playedAt))}
                </td>
                <td className="py-3 pr-4">
                  <div className="max-w-[200px] truncate" title={game.opening || 'Unknown'}>
                    {game.opening || 'Unknown'}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        game.playerColor === 'white' ? 'bg-white' : 'bg-slate-600'
                      }`}
                    />
                    <span>{opponent}</span>
                    {opponentRating && (
                      <span className="text-slate-500">({opponentRating})</span>
                    )}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`font-medium capitalize ${getResultColor(game.result)}`}
                  >
                    {game.result}
                  </span>
                </td>
                <td className="py-3 pr-4 text-slate-400">{game.timeControl}</td>
                <td className="py-3 pr-4">
                  {game.analysis ? (
                    <span className="font-medium text-green-400">
                      {game.analysis.accuracy}%
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  {game.analysis ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Clock className="h-4 w-4" />
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <a
                    href={`https://lichess.org/${game.lichessId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
