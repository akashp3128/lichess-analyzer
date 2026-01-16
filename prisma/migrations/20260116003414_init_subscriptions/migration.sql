-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "rating" INTEGER,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lichessId" TEXT NOT NULL,
    "pgn" TEXT NOT NULL,
    "white" TEXT NOT NULL,
    "black" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "timeControl" TEXT NOT NULL,
    "perfType" TEXT NOT NULL,
    "opening" TEXT,
    "openingEco" TEXT,
    "playerColor" TEXT NOT NULL,
    "playerRating" INTEGER,
    "opponentRating" INTEGER,
    "playedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accuracy" REAL NOT NULL,
    "acpl" REAL NOT NULL,
    "bestMoves" INTEGER NOT NULL,
    "goodMoves" INTEGER NOT NULL,
    "inaccuracies" INTEGER NOT NULL,
    "mistakes" INTEGER NOT NULL,
    "blunders" INTEGER NOT NULL,
    "missedMates" INTEGER NOT NULL,
    "timeInTrouble" INTEGER NOT NULL,
    "avgMoveTime" REAL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "Analysis_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MoveAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moveNumber" INTEGER NOT NULL,
    "move" TEXT NOT NULL,
    "isWhite" BOOLEAN NOT NULL,
    "evaluation" REAL NOT NULL,
    "bestMove" TEXT,
    "evalLoss" REAL NOT NULL,
    "classification" TEXT NOT NULL,
    "square" TEXT NOT NULL,
    "piece" TEXT NOT NULL DEFAULT 'P',
    "timeSpent" REAL,
    "timeRemaining" REAL,
    "inTimeTrouble" BOOLEAN NOT NULL DEFAULT false,
    "fen" TEXT,
    "gameId" TEXT NOT NULL,
    CONSTRAINT "MoveAnalysis_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "monthlyPrice" INTEGER NOT NULL,
    "yearlyPrice" INTEGER NOT NULL,
    "maxAnalysesPerMonth" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodStart" DATETIME NOT NULL,
    "currentPeriodEnd" DATETIME NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "analysesUsed" INTEGER NOT NULL DEFAULT 0,
    "monthlyResetAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Game_lichessId_key" ON "Game"("lichessId");

-- CreateIndex
CREATE INDEX "Game_userId_idx" ON "Game"("userId");

-- CreateIndex
CREATE INDEX "Game_playedAt_idx" ON "Game"("playedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_gameId_key" ON "Analysis"("gameId");

-- CreateIndex
CREATE INDEX "MoveAnalysis_gameId_idx" ON "MoveAnalysis"("gameId");

-- CreateIndex
CREATE INDEX "MoveAnalysis_square_idx" ON "MoveAnalysis"("square");

-- CreateIndex
CREATE INDEX "MoveAnalysis_piece_idx" ON "MoveAnalysis"("piece");

-- CreateIndex
CREATE INDEX "MoveAnalysis_classification_idx" ON "MoveAnalysis"("classification");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
