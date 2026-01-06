import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  fetchUserGames,
  fetchUserInfo,
  getPlayerColor,
  getGameResult,
  parseTimeControl,
} from '@/lib/lichess';
import { generateId } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get('username');
  const max = parseInt(searchParams.get('max') || '20', 10);
  const refresh = searchParams.get('refresh') === 'true';

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  try {
    let user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        games: {
          include: { analysis: true },
          orderBy: { playedAt: 'desc' },
          take: max,
        },
      },
    });

    if (user && !refresh && user.games.length > 0) {
      return NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          rating: user.rating,
        },
        games: user.games,
        fromCache: true,
      });
    }

    const userInfo = await fetchUserInfo(username);
    const lichessGames = await fetchUserGames(username, {
      max,
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: generateId(),
          username: userInfo.username.toLowerCase(),
          rating: userInfo.perfs?.rapid?.rating || userInfo.perfs?.classical?.rating || null,
        },
        include: {
          games: {
            include: { analysis: true },
            orderBy: { playedAt: 'desc' },
          },
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastSyncedAt: new Date(),
          rating: userInfo.perfs?.rapid?.rating || userInfo.perfs?.classical?.rating || user.rating,
        },
      });
    }

    const existingGameIds = new Set(
      (await prisma.game.findMany({
        where: { userId: user.id },
        select: { lichessId: true },
      })).map((g) => g.lichessId)
    );

    const newGames = lichessGames.filter((g) => !existingGameIds.has(g.id));

    if (newGames.length > 0) {
      await prisma.game.createMany({
        data: newGames.map((game) => {
          const playerColor = getPlayerColor(game, username);
          const opponent =
            playerColor === 'white'
              ? game.players.black
              : game.players.white;

          return {
            id: generateId(),
            lichessId: game.id,
            pgn: game.pgn,
            white: game.players.white.user?.name || 'Anonymous',
            black: game.players.black.user?.name || 'Anonymous',
            result: getGameResult(game, playerColor),
            timeControl: parseTimeControl(game.clock),
            perfType: game.perf,
            opening: game.opening?.name || null,
            openingEco: game.opening?.eco || null,
            playerColor,
            playerRating:
              playerColor === 'white'
                ? game.players.white.rating || null
                : game.players.black.rating || null,
            opponentRating: opponent.rating || null,
            playedAt: new Date(game.createdAt),
            userId: user!.id,
          };
        }),
      });
    }

    const games = await prisma.game.findMany({
      where: { userId: user.id },
      include: { analysis: true },
      orderBy: { playedAt: 'desc' },
      take: max,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        rating: user.rating,
      },
      games,
      fromCache: false,
      newGamesAdded: newGames.length,
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to fetch games';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
