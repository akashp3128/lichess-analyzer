# Vibe Coding Guide for Lichess Analyzer

Based on YC's guide to vibe coding. Follow these practices to maintain code quality while moving fast.

---

## Planning Process

1. **Create comprehensive plans** - Use markdown files (like PRODUCT_PLAN.md)
2. **Review and refine** - Delete unnecessary items, mark features as "won't do" if too complex
3. **Maintain scope control** - Keep a "Future Ideas" section for later
4. **Implement incrementally** - Work section by section, not everything at once
5. **Track progress** - Mark sections complete after successful implementation
6. **Commit regularly** - Commit each working section to Git before moving on

---

## Version Control Strategy

### Golden Rules
- **Use Git religiously** - Don't rely solely on AI tools' revert functionality
- **Start clean** - Begin each new feature with a clean Git slate
- **Commit working states** - Always have a known-good state to return to

### When Stuck
```bash
# Reset to last working state
git reset --hard HEAD

# Or reset to specific commit
git log --oneline  # find commit
git reset --hard <commit-hash>
```

### Avoid Cumulative Problems
- Multiple failed attempts create layers of bad code
- When you find a solution, reset and implement it cleanly
- Don't build on top of failed attempts

### Branch Strategy
```bash
# For new features
git checkout -b feature/phase-analysis
# ... work on feature ...
git add .
git commit -m "Add phase-based analysis"
git checkout main
git merge feature/phase-analysis
```

---

## Testing Framework

### Priorities (in order)
1. **End-to-end tests** - Simulate real user behavior (Playwright)
2. **Integration tests** - Test features working together
3. **Unit tests** - Only for complex logic

### Test Before Proceeding
- Ensure tests pass before moving to next feature
- Tests are guardrails, not bureaucracy
- Use tests to catch regressions (LLMs often break unrelated code)

### Our Test Commands
```bash
# Run Playwright tests
node test-analysis-improved.mjs

# Test specific feature
node test-opening-click.mjs
```

---

## Effective Bug Fixing

1. **Leverage error messages** - Copy-paste errors to AI is often enough
2. **Analyze before coding** - Ask AI to consider multiple possible causes
3. **Reset after failures** - Start fresh after each unsuccessful fix
4. **Add logging** - Strategic console.logs help understand flow
5. **Switch models** - Try different AI models when stuck
6. **Clean implementation** - Once fix is found, reset and implement cleanly

---

## AI Tool Optimization

### Instruction Files (We Have These)
- `CLAUDE.md` - Project structure and commands
- `PRODUCT_PLAN.md` - Feature roadmap
- `VIBE_CODING_GUIDE.md` - This file

### Best Practices
- Keep files modular and small (<300 lines ideal)
- Use clear, consistent naming
- Document APIs and data structures in types
- Use screenshots to communicate UI bugs

---

## Complex Feature Development

1. **Create standalone prototypes** - Build complex features in isolation first
2. **Use reference implementations** - Point AI to working examples
3. **Clear boundaries** - Maintain consistent external APIs
4. **Modular architecture** - Service-based with clear boundaries

---

## Tech Stack Decisions

### Why Our Stack Works
- **Next.js** - Established framework, great AI training data
- **TypeScript** - Type safety catches errors early
- **Prisma** - Clean database abstraction
- **Tailwind** - Consistent styling without CSS complexity
- **Recharts** - Simple charting

### Guidelines
- Keep files small and modular
- Avoid files >500 lines
- One component per file
- Separate concerns (API, components, lib)

---

## Continuous Improvement

- **Regular refactoring** - Once tests pass, refactor frequently
- **Identify opportunities** - Ask AI to find refactoring candidates
- **Stay current** - Try new AI model releases
- **Recognize strengths** - Different models excel at different tasks

---

## Quick Reference

### Before Starting a Feature
```bash
git status                    # Check clean state
git checkout -b feature/name  # Create branch
```

### After Feature Works
```bash
git add .
git commit -m "Description of feature"
git checkout main
git merge feature/name
```

### When Stuck
```bash
git stash                     # Save current work
git reset --hard HEAD~1       # Go back one commit
# Or
git reset --hard <commit>     # Go to specific commit
```

### Daily Workflow
1. Pull latest changes
2. Create feature branch
3. Implement incrementally
4. Test with Playwright
5. Commit working state
6. Merge to main
