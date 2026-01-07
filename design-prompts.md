# Gemini Design Prompts for Lichess Analyzer

Run these prompts from the project root directory.

---

## 1. Landing Page Hero Redesign

```bash
gemini -p "@src/app/page.tsx @src/app/layout.tsx

You are a senior product designer at a top tech company. Analyze this landing page and provide a complete redesign proposal.

CURRENT STATE: Simple dark form with username input.

DESIGN BRIEF:
- Create a premium, memorable first impression
- Target audience: Chess enthusiasts who want to improve
- Competitors: Chess.com (gamified), Lichess (minimalist)
- Our differentiation: AI-powered deep analysis

DELIVERABLES:
1. **Hero Section Layout** - Describe the visual hierarchy, what goes where
2. **Animated Elements** - Propose 2-3 subtle animations (CSS/Framer Motion)
3. **Social Proof Section** - How to show credibility (stats, testimonials mock)
4. **Sample Insights Preview** - Show a teaser of what analysis looks like
5. **Exact Tailwind Classes** - Provide the complete JSX with Tailwind for the new design
6. **Color Refinements** - Any tweaks to the amber/slate palette

Make it feel like a SpaceX dashboard meets Chess.com's energy. Premium but approachable."
```

---

## 2. Dashboard Cards & Visual Hierarchy

```bash
gemini -p "@src/app/dashboard/page.tsx @src/components/dashboard/StatsOverview.tsx @src/components/charts/

You are a senior product designer specializing in data-dense dashboards (think: Stripe, Linear, Vercel).

Analyze this dashboard and propose improvements for VISUAL HIERARCHY and CARD DESIGN.

PROBLEMS TO SOLVE:
- Too many sections competing for attention
- Cards look similar, hard to scan quickly
- No clear 'story' flow from top to bottom

DELIVERABLES:
1. **Information Architecture** - Reorder/group sections for better flow
2. **Card Hierarchy System** - Define 3 card tiers (primary/secondary/tertiary)
3. **Focal Point** - What should users see FIRST? Design that element
4. **Refined Card Component** - New base card with:
   - Subtle gradient borders
   - Hover micro-interactions
   - Better shadow/depth system
5. **Exact Tailwind/CSS** - Provide the refined StatsOverview component with new styling

Reference: Vercel's dashboard, Linear's project views, Raycast's UI polish."
```

---

## 3. Chart Animations & Delight

```bash
gemini -p "@src/components/charts/RatingChart.tsx @src/components/charts/OpeningStatsChart.tsx @src/components/charts/MistakeHeatmap.tsx

You are a motion designer specializing in data visualization animations.

These charts use Recharts and need animation polish.

DELIVERABLES:
1. **Entry Animations** - How should each chart animate in on load?
   - RatingChart: Line drawing effect
   - OpeningStatsChart: Bars growing from left
   - MistakeHeatmap: Squares fading in with stagger

2. **Hover States** - Enhanced interactions on data points
3. **Number Animations** - Count-up effect for statistics
4. **Implementation Code** - Provide Recharts animation props and any CSS needed

Use Framer Motion if needed. Keep animations subtle (200-400ms, ease-out)."
```

---

## 4. Achievement & Badge System Design

```bash
gemini -p "@src/components/dashboard/ @src/types/index.ts

You are a gamification designer who worked on Duolingo and Chess.com.

Design an ACHIEVEMENT SYSTEM for this chess analyzer.

ACHIEVEMENT CATEGORIES:
1. **Analysis Milestones** - Games analyzed (10, 50, 100, 500)
2. **Accuracy Awards** - First 90%+ game, 95%+ game, perfect game
3. **Improvement Streaks** - Week-over-week improvement streaks
4. **Weakness Conquered** - Reduced blunders by 50%
5. **Opening Mastery** - Analyzed 20+ games with same opening

DELIVERABLES:
1. **Badge Visual Design** - Describe the badge aesthetic (shape, colors, icons)
2. **Badge Component JSX** - Complete React component with Tailwind
3. **Achievement Toast** - Notification when unlocked
4. **Achievement Gallery** - How to display earned vs locked badges
5. **TypeScript Types** - Add Achievement interface to types

Style: Modern, minimal, uses amber/emerald/purple accents. NOT cartoonish."
```

---

## 5. Empty States & Onboarding

```bash
gemini -p "@src/app/dashboard/page.tsx @src/components/

You are a UX designer focused on first-time user experience.

Design EMPTY STATES and ONBOARDING for when users have:
- No games analyzed yet
- No puzzles available
- No opening data

DELIVERABLES:
1. **Empty State Illustrations** - Describe simple, on-brand illustrations (or recommend icon compositions)
2. **Empty State Component** - Reusable component with:
   - Icon/illustration slot
   - Title and description
   - CTA button
3. **First-Time Dashboard** - What should new users see? Progressive disclosure?
4. **Micro-copy** - Friendly, encouraging text for each empty state
5. **Exact JSX with Tailwind** - Complete components

Tone: Encouraging, not patronizing. 'Let's get started' not 'Nothing here yet'."
```

---

## 6. Full Design System Audit

```bash
gemini -p "@src/app/ @src/components/ @tailwind.config.ts

You are a design systems engineer at Vercel.

Audit this codebase and create a UNIFIED DESIGN SYSTEM specification.

DELIVERABLES:
1. **Color Tokens** - Semantic color names (--color-surface, --color-accent, etc.)
2. **Spacing Scale** - Consistent spacing (4, 8, 12, 16, 24, 32, 48)
3. **Typography Scale** - Font sizes, weights, line-heights
4. **Component Variants** - Button, Card, Badge, Input variants
5. **Shadow System** - Elevation levels (sm, md, lg, xl)
6. **Border Radius** - Consistent rounding (sm, md, lg, full)
7. **Tailwind Config Updates** - Extend tailwind.config.ts with these tokens
8. **Example Refactor** - Show one component refactored to use the system

Output should be copy-paste ready for implementation."
```

---

## Quick Commands

```bash
# Run any prompt above by copying the gemini command

# For a full codebase overview first:
gemini -p "@src/ Give me a visual design audit of this chess analyzer app. What works, what needs improvement?"

# For specific component feedback:
gemini -p "@src/components/charts/MistakeHeatmap.tsx How can I make this heatmap more visually striking and interactive?"
```

---

## Tips

- Run prompts one at a time for focused feedback
- Copy Gemini's output and I can help implement it
- Iterate: "Make the cards more glassy" or "Less playful, more professional"
