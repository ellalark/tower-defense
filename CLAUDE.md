
Rules

## TDD Is Mandatory

You MUST follow test-driven development for all code changes:

1. **Write a failing test first** that captures the expected behavior
2. **Implement the minimum code** to make the test pass
3. **Refactor** if needed, ensuring tests stay green


# Model delegation workflow

To conserve tokens, route work to the cheapest model that can handle it. The main
thread (Opus 4.7) does planning, decisions, and review only — not direct coding or
broad exploration.

## Delegation rules

- **Planning, architecture, design discussions, writing plan docs**: stay in the
  main thread (Opus 4.7). Don't delegate reasoning.
- **Code exploration, codebase Q&A, web search, "where is X used", "how does Y
  work"**: delegate to the `Explore` agent with `model: haiku`. Never grep/glob
  more than 2-3 times in the main thread — switch to Explore.
- **Writing or editing code**: delegate to a Sonnet 4.6 subagent (the `coder`
  agent, or `general-purpose` with `model: sonnet`). The main thread does not
  call Edit/Write directly except for:
  - Single-line typo fixes
  - Memory / MEMORY.md / CLAUDE.md updates
  - Config file tweaks under ~10 lines
- **Post-coding review**: after the coder agent returns, the main thread (Opus
  4.7) reviews the diff for (1) correctness vs the plan, (2) security issues,
  (3) code quality. If issues found, send the coder agent back with specific
  feedback. Repeat until clean. This replaces the prior Sonnet review sub-agent
  loop — Opus now reviews Sonnet's work, not the other way around.

## Briefing the coder agent

The coder subagent starts with no conversation context. Every delegation must
include:
- The plan or task spec (paste the relevant plan-doc section inline)
- Exact file paths and line numbers to change
- Constraints from CLAUDE.md that apply (e.g. "no backwards-compat shims")
- What "done" looks like (tests passing, specific behavior)

Don't write "implement the plan" — paste the plan.

## When delegation would cost more than it saves

Skip delegation and do it in the main thread when:
- The change is <20 lines and touches 1 file
- The agent would need >500 lines of context pasted in just to understand the
  change
- You're mid-debug and need tight iteration on a single hypothesis

If unsure, delegate — the default should be delegation, not inline work.