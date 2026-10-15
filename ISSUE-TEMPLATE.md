<!--
How a worktree's ISSUE.md looks. When an agent starts an issue, it copies this file to ISSUE.md at the
worktree root, fills it in from `gh issue view <N>`, and deletes these comments. See the Workflow section of CLAUDE.md.

ISSUE.md is gitignored, so it never gets committed or merged. GitHub stays the source of truth: if the issue
changes there, re-copy the issue sections and keep the Status and Local notes.

Named ISSUE-TEMPLATE.md on purpose: GitHub treats a file named ISSUE_TEMPLATE.md (underscore) as the starting
text for every new GitHub issue.
-->

> **Local only — this file never merges.** It's gitignored, so it can't be committed. It's a copy of the
> GitHub issue this worktree is building, made when work started. GitHub is the source of truth: if the
> issue changes there, re-copy it here.

# #<N> <issue title>

## Status

<!-- Keep this current as work moves: branch renamed, PR opened, issue closed. -->

| | |
|---|---|
| Issue | [#<N>](https://github.com/Ikuchar1/all22-helper/issues/<N>) — **open**, `<label>` |
| Blocked by | #<X> — closed, so unblocked |
| Worktree | `.claude/worktrees/<name>` |
| Branch | `feature/<short-desc>` |
| PR | none yet |
| Copied | <YYYY-MM-DD> |

<!--
Paste the issue body below, word for word: every section it has, in its order (usually What to build,
Acceptance criteria, Blocked by). Tick an acceptance criterion here once it's done and checked.
-->

## What to build

## Acceptance criteria

- [ ]

## Blocked by

-

## Plan

<!--
Written by /drive-issue before any code, then approved by Ian (gate G1). Leave this section out when building by hand.
-->

- **Interface changes:** <modules, exported functions and types, panel pieces added or changed>
- **New packages:** <each with why, or none>
- **Behaviors to test**, in build order (engine first, then panel):
  1. Engine:
  2. Panel:
- Plan approved <YYYY-MM-DD>, `BASE=<sha>`

## Progress

<!--
One line per step, newest last, so a restarted or compacted session picks up from the last line.
e.g. `dev r0: DONE`, `checks: green`, `review r1: 2 Fix`, `Ruling: <question> → <answer, and where it came from>`
-->

-

## Local notes

<!--
Optional. Decisions made while building, scope changes not on GitHub yet, things to hand to another agent.
Anything that matters after this worktree is gone goes into the real docs or the GitHub issue before the PR.
-->
