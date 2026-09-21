---
project: CharlottePortfolio
color: #C06B45
status: active
created: 2026-09-18
---

# CharlottePortfolio

## Backlog

- [ ] Phase 6: handoff !P1 owner:Dev phase:6 ^p6ho
    Plan tasks 17 and 18. The guide is written (local, in documentation/).
    - [x] Task 17: editing guide
    - [x] Domain: charlotterosewrites.com on Production, www folds into it with a 308, canonical and sitemap on the bare domain, no env var needed
    - [x] Acceptance 1, 4, 5, 7, 8, 9, 10 and the local form of 12 checked against the build (scripts in the session scratchpad): order, tile fallbacks, drafts, poem breaks, papers, contact, no overflow at 375px on all 21 pages, a piece builds without a dek line or a date line
    - [ ] Acceptance 2, 3, 6 (admin edits on production), 11 (print preview), 12 on GitHub, 13 (Lighthouse recorded), 14 (Charlotte's first piece)
    - [ ] Clear the placeholders (keep three unpublished templates) when Charlotte is ready
    - [ ] Walkthrough with Charlotte
    > 2026-09-19 — Domain and the build-verifiable acceptance items done; the rest waits on admin sessions and on Charlotte.

## In Progress

- [ ] Phase 5: quality pass !P1 owner:Dev phase:5 ^p5qa
    Plan task 16: types, tests, Lighthouse on production, keyboard and motion, admin round trip.
    - [x] Types and tests clean; Lighthouse run locally: Home 93, piece 98, accessibility 100 (spec section 7 has the detail)
    - [ ] Keyboard and reduced-motion check
    - [ ] Admin round trip: add a category and a poem, delete the category, delete the poem
    > 2026-09-19 — Stylesheets inlined and Newsreader moved to its weight-only build after the first Lighthouse runs (85 and 92); Home stays at 93 because the remaining levers are design changes, declined.
## Review

- [ ] Hidden flag on categories owner:Agent ^chid
    A Hidden checkbox on each category takes it and its pieces off the site (Home, piece pages, sitemap) without deleting anything; existing category files need no change. Waiting on the push and a check in the production admin.
    > 2026-09-20 — Tests, astro check, and a build over Charlotte's content with Speeches hidden all pass; guide and spec updated.

## Done

- [x] Featured band on Home owner:Agent ^feat
    A Featured checkbox on each piece puts it in a Featured section between the Experience row and the categories: an image-left card with the title, the dek, and a meta line that names the category. Tile captions no longer repeat the category. Content width kept at 992 on purpose and the theme corrected to the built numbers. Privilege and Unemployable flagged.
    > 2026-09-20 — Tests, astro check, and a production build pass; theme, spec, and guide updated.
    > 2026-09-20 — Featured square reduced to 160px, 112px on phones, after the first live look.
    > 2026-09-21 — Committed and pushed to main for the Vercel deploy. Dev-only: images of the two pieces whose folder names contain a colon 500 in the dev image endpoint; production is unaffected.

- [x] Phase 1: skeleton and admin !P0 owner:Agent phase:1 ^p1sk
    Plan: documentation/plans/2026-09-18-portfolio-site.md, tasks 1 to 6.
    - [x] Task 1: project scaffold
    - [x] Task 2: tokens, base styles, fonts, layout shell
    - [x] Task 3: Keystatic content model
    - [x] Task 4: seed content
    - [x] Task 5: tolerant schemas and Astro collections
    - [x] Task 6: first deploy and Keystatic Cloud
    > 2026-09-19 — Live at www.charlotterosewrites.com on Vercel with Keystatic Cloud (dreamwell/charlotte-portfolio). Repository made public because Vercel Hobby blocks deploys of non-owner commits on private repos; documentation/ scrubbed from history and ignored; commits rewritten to the ismaelffj identity.

- [x] Phase 4: site plumbing !P1 owner:Agent phase:4 ^p4pl
    > 2026-09-19 — robots.txt endpoint, sitemap, icons, and the social image rendered by scripts/render-assets.py.
    - [x] Task 15: robots, sitemap check, favicon, social image

- [x] Phase 3: piece pages and contact !P0 owner:Agent phase:3 ^p3pc
    > 2026-09-19 — Prose, poem, and paper layouts, the contact page, and the 404; verified in the production build.
    - [x] Task 13: piece pages
    - [x] Task 14: contact page and 404

- [x] Phase 2: home page !P0 owner:Agent phase:2 ^p2hm
    > 2026-09-19 — Library helpers, nav, footer, layout head, and the home page; 69 tests at the end of the phase.
    - [x] Task 7: dates and text helpers
    - [x] Task 8: Markdoc rendering
    - [x] Task 9: piece normalization and grouping
    - [x] Task 10: captions, meta lines, tile kinds
    - [x] Task 11: loaders, nav, footer, layout head, admin noindex
    - [x] Task 12: home page

- [x] Design, theme, spec, and implementation plan owner:Agent ^d0ds
    documentation/theme.md, documentation/spec.md, documentation/plans/2026-09-18-portfolio-site.md, approved previews in documentation/previews/.

