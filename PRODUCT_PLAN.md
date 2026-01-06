# Lichess Analyzer - Product Plan

## Market Opportunity

Lichess provides basic game analysis, but lacks **personalized insights** that help players actually improve. This tool can fill that gap.

---

## What Lichess Already Offers
- Single-game Stockfish analysis
- Opening explorer (database of games)
- Basic rating graph
- Simple accuracy percentage
- Puzzle trainer (separate from game analysis)

---

## Gap Analysis: What Players Actually Want

### 1. **Pattern Recognition Across Games**
Players make the same mistakes repeatedly but don't realize it.

**Feature Ideas:**
- "You blunder on f7 in 40% of your games"
- "You struggle in Rook endgames (62% loss rate)"
- "Your accuracy drops 15% after move 30"
- Recurring tactical patterns missed

### 2. **Opening Repertoire Tracking**
Lichess shows what openings you play, not how well-prepared you are.

**Feature Ideas:**
- Track your repertoire lines and deviations
- "You deviated from theory on move 6 - here's the main line"
- Win rate by specific variation (not just ECO code)
- Suggest openings based on your style/weaknesses

### 3. **Time Management Analysis**
Lichess shows clock times but doesn't analyze patterns.

**Feature Ideas:**
- "You spend 45% of your time in the first 15 moves"
- "Your accuracy drops 20% when under 1 minute"
- Optimal time allocation suggestions
- Flag "time scramble blunders" vs "thinking blunders"

### 4. **Opponent Preparation / Scouting**
Before a game, know your opponent.

**Feature Ideas:**
- "This opponent plays e4 90% of the time"
- Their weakness squares/pieces
- Suggested preparation lines
- Historical matchup analysis

### 5. **Phase-Based Performance**
Where in the game do you struggle?

**Feature Ideas:**
- Opening accuracy (moves 1-15)
- Middlegame accuracy (moves 15-35)
- Endgame accuracy (moves 35+)
- "You're strong in openings but lose the advantage in middlegame"

### 6. **Personalized Training Plans**
Connect analysis to improvement.

**Feature Ideas:**
- "Practice these 3 tactical patterns you keep missing"
- Custom puzzle sets from YOUR missed tactics
- "Study Rook vs Bishop endgames"
- Weekly improvement reports

### 7. **Psychological Insights**
Chess is mental.

**Feature Ideas:**
- Tilt detection: "After a loss, your next game accuracy drops 18%"
- "You perform better in morning games"
- Win/loss streak patterns
- "You resign too early in 15% of games"

### 8. **Peer Comparison**
How do you compare to similar players?

**Feature Ideas:**
- "Players at your rating average 65% accuracy, you're at 72%"
- "Your endgame is top 10% for your rating"
- Strengths/weaknesses relative to peers
- What separates your rating from the next level

---

## Prioritized Feature Roadmap

### Phase 1: Core Differentiators (MVP+)
1. **Mistake Pattern Heatmap** - Already built (squares), expand to piece types
2. **Phase-Based Analysis** - Split accuracy by opening/middle/endgame
3. **Time Trouble Detection** - Flag moves made under time pressure
4. **Opening Deviation Alerts** - Show where you left theory

### Phase 2: Insights Engine
5. **Recurring Weakness Report** - "Top 3 things costing you games"
6. **Endgame Classification** - Win rates by endgame type
7. **Tilt Detection** - Performance after losses
8. **Custom Puzzle Generation** - From your missed tactics

### Phase 3: Preparation Tools
9. **Opponent Scout Report** - Pre-game preparation
10. **Repertoire Builder** - Track and drill your lines
11. **Peer Benchmarking** - Compare to similar-rated players
12. **Improvement Tracking** - Week-over-week metrics

---

## Competitive Analysis

| Feature | Lichess | Chess.com | This Tool |
|---------|---------|-----------|-----------|
| Single game analysis | Yes | Yes | Yes |
| Multi-game patterns | No | Limited | **Yes** |
| Phase breakdown | No | No | **Yes** |
| Time analysis | No | Basic | **Yes** |
| Opponent prep | No | Premium | **Yes** |
| Custom puzzles | No | No | **Planned** |
| Tilt detection | No | No | **Planned** |
| Peer comparison | No | Limited | **Planned** |

---

## Monetization Ideas

### Freemium Model
- **Free:** 20 games, basic stats, mistake heatmap
- **Pro ($5/mo):** Unlimited games, patterns, time analysis, phase breakdown
- **Coach ($15/mo):** Opponent prep, custom training, peer comparison

### One-Time Analysis
- "Deep dive" report for $3 (analyze 100 games, full PDF report)

---

## Technical Requirements for New Features

### Phase-Based Analysis
- Track move numbers in analysis
- Classify positions (opening/middle/endgame) using piece count or theory database

### Time Trouble Detection
- Parse clock times from PGN (already have this data)
- Flag moves where remaining time < 10% of starting time

### Opening Deviation
- Need opening book/database
- Compare player moves against theory
- Show "book move" vs "played move"

### Opponent Scouting
- Fetch opponent's recent games
- Aggregate their opening choices
- Find their weakness patterns

### Custom Puzzles
- Save positions where player missed tactics
- Convert to puzzle format
- Track puzzle performance

---

## Questions to Resolve

1. **Target Audience:** Casual improvers? Serious tournament players? Coaches?
2. **Platform:** Web only? Mobile app? Desktop?
3. **Data Privacy:** How long to store game data? User accounts needed?
4. **Branding:** Name? "ChessInsight"? "GameIQ"? "MoveCoach"?
5. **Hosting:** Where to deploy? Cost estimates?

---

## Next Steps

1. [ ] User research - What do players actually want most?
2. [ ] Prioritize Phase 1 features
3. [ ] Design mockups for new features
4. [ ] Technical spike on opening book integration
5. [ ] Competitive pricing research

---

## Notes

- Keep it simple - don't overwhelm users with data
- Focus on actionable insights, not just numbers
- Mobile-friendly is essential
- Consider integration with Lichess OAuth for seamless UX
