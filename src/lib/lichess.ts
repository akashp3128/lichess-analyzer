import { LichessGame } from '@/types';

const LICHESS_API_BASE = 'https://lichess.org/api';

export async function fetchUserGames(
  username: string,
  options: {
    max?: number;
    perfType?: string;
    since?: number;
  } = {}
): Promise<LichessGame[]> {
  const { max = 20, perfType = 'bullet,blitz,rapid,classical', since } = options;

  const params = new URLSearchParams({
    max: String(max),
    perfType,
    pgnInJson: 'true',
    opening: 'true',
    clocks: 'true',
    evals: 'false',
  });

  if (since) {
    params.set('since', String(since));
  }

  const url = `${LICHESS_API_BASE}/games/user/${username}?${params}`;

  const response = await fetch(url, {
    headers: {
      Accept: 'application/x-ndjson',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User "${username}" not found on Lichess`);
    }
    throw new Error(`Lichess API error: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.trim().split('\n').filter(Boolean);
  const games: LichessGame[] = lines.map((line) => JSON.parse(line));

  return games;
}

export async function fetchUserInfo(username: string): Promise<{
  id: string;
  username: string;
  perfs?: Record<string, { rating: number }>;
}> {
  const response = await fetch(`${LICHESS_API_BASE}/user/${username}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`User "${username}" not found on Lichess`);
    }
    throw new Error(`Lichess API error: ${response.status}`);
  }

  return response.json();
}

export function parseTimeControl(clock?: {
  initial: number;
  increment: number;
}): string {
  if (!clock) return 'Unknown';
  const minutes = clock.initial / 60;
  return `${minutes}+${clock.increment}`;
}

export function getGameResult(game: LichessGame, playerColor: 'white' | 'black'): string {
  if (game.status === 'draw' || game.status === 'stalemate') {
    return 'draw';
  }

  if (game.winner === playerColor) {
    return 'win';
  }

  if (game.winner && game.winner !== playerColor) {
    return 'loss';
  }

  return 'draw';
}

export function getPlayerColor(
  game: LichessGame,
  username: string
): 'white' | 'black' {
  const normalizedUsername = username.toLowerCase();

  if (game.players.white.user?.id?.toLowerCase() === normalizedUsername) {
    return 'white';
  }

  return 'black';
}
