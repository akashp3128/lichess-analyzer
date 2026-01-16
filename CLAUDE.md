# Lichess Game Analyzer

A Next.js application that analyzes your Lichess chess games using Stockfish engine integration.

## Project Overview

This application fetches a user's games from Lichess, analyzes them with Stockfish, and provides comprehensive insights including:
- **Mistake Analysis**: Blunders, tactical misses, opening deviations, positional errors
- **Performance Metrics**: Accuracy %, centipawn loss, time management patterns
- **Visualizations**: Rating history, mistake heatmaps, opening statistics

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Chess Logic**: chess.js
- **Engine**: Stockfish.js (WASM)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
lichess-analyzer/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── games/         # Game fetching endpoints
│   │   │   └── analyze/       # Analysis endpoints
│   │   ├── dashboard/         # Dashboard page
│   │   ├── layout.tsx
│   │   └── page.tsx           # Home/username input
│   ├── components/
│   │   ├── charts/            # Chart components
│   │   ├── dashboard/         # Dashboard components
│   │   └── ui/                # Shared UI components
│   ├── lib/
│   │   ├── lichess.ts         # Lichess API client
│   │   ├── stockfish.ts       # Stockfish integration
│   │   ├── analysis.ts        # Game analysis logic
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── types/
│       └── index.ts           # TypeScript types
└── public/
    └── stockfish/             # Stockfish WASM files
```

## Key Commands

```bash
# Development
npm run dev                    # Start dev server on localhost:3000

# Database
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema to database
npx prisma studio              # Open database GUI

# Build
npm run build                  # Production build
npm run start                  # Start production server

# Linting
npm run lint                   # Run ESLint
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"   # SQLite database path
```

## API Endpoints

### GET /api/games
Fetch games from Lichess for a user.
- Query params: `username`, `max` (default 20), `perfType` (rapid,classical)

### POST /api/analyze
Analyze a game with Stockfish.
- Body: `{ gameId: string, pgn: string }`

### GET /api/stats/[username]
Get aggregated statistics for a user.

## Lichess API Integration

Uses the public Lichess API (no auth required for public games):
- Endpoint: `https://lichess.org/api/games/user/{username}`
- Format: NDJSON stream
- Filters: `perfType=rapid,classical`, `max=20`

## Stockfish Integration

Uses stockfish.js WASM for browser-side analysis:
- Depth: 20 for accurate evaluation
- Outputs: Best move, evaluation (centipawns), mate detection
- Runs in Web Worker to avoid blocking UI

## Analysis Metrics

### Move Classification
- **Best**: Matches engine's top choice
- **Good**: Within 20 centipawns of best
- **Inaccuracy**: 20-50 centipawn loss
- **Mistake**: 50-100 centipawn loss
- **Blunder**: >100 centipawn loss or missed mate

### Calculated Stats
- **Accuracy %**: Weighted score based on move quality
- **Average Centipawn Loss (ACPL)**: Mean evaluation loss per move
- **Time Trouble**: Moves made with <10% time remaining

## Database Schema

### User
Stores fetched user info and last sync time.

### Game
Stores game metadata (PGN, result, time control, date).

### Analysis
Stores per-game analysis results (accuracy, ACPL, mistake counts).

### MoveAnalysis
Stores per-move evaluations for heatmap generation.

## Development Guidelines

1. **Error Handling**: All API calls should have try/catch with proper error responses
2. **Loading States**: Show skeletons/spinners during data fetching
3. **Caching**: Cache Lichess API responses to avoid rate limiting
4. **Progressive Analysis**: Analyze games one at a time, show progress
5. **Mobile Responsive**: Dashboard should work on mobile devices

## Common Tasks

### Adding a new chart
1. Create component in `src/components/charts/`
2. Import Recharts components needed
3. Transform data in parent component
4. Add to dashboard layout

### Modifying analysis logic
1. Edit `src/lib/analysis.ts`
2. Update move classification thresholds if needed
3. Run analysis on test games to verify

### Adding new API endpoint
1. Create route in `src/app/api/`
2. Add types to `src/types/index.ts`
3. Update this README with endpoint docs

## Troubleshooting

- **Stockfish not loading**: Ensure WASM files are in `/public/stockfish/`
- **Rate limited by Lichess**: Add delays between requests, cache responses
- **Database errors**: Run `npx prisma db push` to sync schema


 # Using Gemini CLI for Large Codebase Analysis

  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

  ## File and Directory Inclusion Syntax

  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:

  ### Examples:

  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"

  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"

  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"

  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  
#
 Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"

  Implementation Verification Examples

  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

  When to Use Gemini CLI

  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase

  Important Notes

  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results # Using Gemini CLI for Large Codebase Analysis


  When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
  context window. Use `gemini -p` to leverage Google Gemini's large context capacity.


  ## File and Directory Inclusion Syntax


  Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
   gemini command:


  ### Examples:


  **Single file analysis:**
  ```bash
  gemini -p "@src/main.py Explain this file's purpose and structure"


  Multiple files:
  gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"


  Entire directory:
  gemini -p "@src/ Summarize the architecture of this codebase"


  Multiple directories:
  gemini -p "@src/ @tests/ Analyze test coverage for the source code"


  Current directory and subdirectories:
  gemini -p "@./ Give me an overview of this entire project"
  # Or use --all_files flag:
  gemini --all_files -p "Analyze the project structure and dependencies"


  Implementation Verification Examples


  Check if a feature is implemented:
  gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"


  Verify authentication implementation:
  gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"


  Check for specific patterns:
  gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"


  Verify error handling:
  gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"


  Check for rate limiting:
  gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"


  Verify caching strategy:
  gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"


  Check for specific security measures:
  gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"


  Verify test coverage for features:
  gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"


  When to Use Gemini CLI


  Use gemini -p when:
  - Analyzing entire codebases or large directories
  - Comparing multiple large files
  - Need to understand project-wide patterns or architecture
  - Current context window is insufficient for the task
  - Working with files totaling more than 100KB
  - Verifying if specific features, patterns, or security measures are implemented
  - Checking for the presence of certain coding patterns across the entire codebase


  Important Notes


  - Paths in @ syntax are relative to your current working directory when invoking gemini
  - The CLI will include file contents directly in the context
  - No need for --yolo flag for read-only analysis
  - Gemini's context window can handle entire codebases that would overflow Claude's context
  - When checking implementations, be specific about what you're looking for to get accurate results