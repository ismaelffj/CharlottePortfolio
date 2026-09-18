# Board editing guide — CharlottePortfolio

This board's source of truth is `board.md`. Edit it directly: add a checklist line, flip `[ ]`→`[x]`, append a comment. Reference tasks by their `^id`.

## Format

- Columns are `## Heading`; a task is `- [ ] Title` (open) or `- [x] Title` (done).
- Fields go on the task line: `#label` (zero or more), `!P0`–`!P3` (priority), `@YYYY-MM-DD` (due), `key:value` (everything else), `^id` (stable 4-char id, last).
- Canonical order: title → `#labels` → `!P` → `@due` → `key:value` → `^id`.
- Indented 4 spaces under a task = content only: prose, `- [ ] subtask`, `![alt](path)` image, `> YYYY-MM-DD — comment`.

## Columns (left → right)

- Backlog (not started)
- In Progress
- Review
- Done (completion target)

## Fields

- `priority` (select)
- `due` (date)
- `owner` (select) — options: Agent, Dev
- `labels` (multiselect) — options: llm, slack, perf
- `phase` (select)
- `sprint` (select)

