# Agents

## Purpose

Build and maintain a local-only server migration planning tool. The product must help a real user prepare a migration checklist, risk review, command plan, rollback notes, and exports without pretending to directly control production servers.

## File Map

- `src/main.ts`: app state, bilingual copy, command generation, risk logic, export logic, and three.js topology.
- `src/style.css`: full responsive product layout and design tokens.
- `index.html`: static entry and metadata.
- `docs/BEGINNER-GUIDE.md`: bilingual beginner usage guide.
- `docs/screenshot.png`: generated product screenshot.
- `docs/demo.gif`: generated demo animation.
- `.github/workflows/pages.yml`: GitHub Pages deployment workflow.

## Guardrails

- Do not add fake automation that claims to SSH into servers from GitHub Pages.
- Keep server data local to the browser.
- Generated commands must remain auditable and include safety comments.
- Preserve bilingual UI and README sections.
- Use three.js only for meaningful topology visualization, not decorative clutter.
- Avoid repeated card-grid layouts; this product should stay command-deck / ops-console shaped.
- Keep long commands inside bounded scroll containers.

## Next-Step Ideas

- Add import/export of JSON migration profiles.
- Add Nginx vhost and Docker Compose paste analyzers.
- Add a rehearsal mode that compares first and second rsync dry-run output.
- Add database-specific preflight checks for MySQL replication or PostgreSQL extensions.
