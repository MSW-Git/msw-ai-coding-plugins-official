#!/usr/bin/env node
'use strict';

// MSW Skill Router Reminder Hook
// Runs on every UserPromptSubmit and injects a SHORT re-classification nudge
// via stdout (delivered as a system message).
//
// Design:
// - The Foundation list, the Domain matrix, and the loading hard-rules live in
//   ONE place: scripts/inject-agent-md/AGENTS.md (copied to the workspace root
//   and loaded as session instructions). This hook deliberately does NOT
//   restate them — an earlier version re-injected the full matrix (~22 KB)
//   every turn, which drifted from AGENTS.md and taxed the context budget.
// - What must survive every turn is the *behavior*, not the data: re-classify
//   the new message, load missing skills before planning, read triggered
//   references in full. That is all this nudge carries.
// - "In context" semantics: Foundation and skills must be PRESENT in context,
//   not re-loaded per turn. Re-reading files already in context wastes budget.
//
// Coupling: the nudge names the "PROJECT CONTEXT" / "Domain matrix" sections
// of inject-agent-md/AGENTS.md — keep them in sync if those headings change.
//
// Auto-registered via the plugin's hooks/hooks.json — no manual setup needed.

const fs = require('fs');

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

readInput();

process.stdout.write(
  '<msw-skill-router-reminder>\n' +
  'NEW user message — re-classify it against the Domain matrix in AGENTS.md (the\n' +
  'PROJECT CONTEXT section of your workspace instructions) BEFORE you plan, search,\n' +
  'or edit. AGENTS.md is the single source of truth for MSW skill routing; this\n' +
  'reminder only re-arms it each turn.\n' +
  '\n' +
  '1. Foundation IN CONTEXT. The 2 Foundation Skills (msw-general, msw-ui-system)\n' +
  '   and the 4 Foundation references (msw-general/references/platform.md,\n' +
  '   workspace.md, entity.md, authoring.md) must be present in context before you\n' +
  '   plan. Load whatever is missing this session (first turn: all of them; later\n' +
  '   turns: only items never loaded or lost to context compaction). Do NOT re-read\n' +
  '   files already fully in context. Once the map\'s TileMapMode is known, the\n' +
  '   matching platform-{maple|rect|sideview}.md joins Foundation.\n' +
  '2. Re-classify EVERY turn. A skill loaded in a previous turn does not exempt\n' +
  '   this one. If this message touches a domain whose skill is not in context yet,\n' +
  '   load it (see the Domain matrix) BEFORE planning. Multiple domains -> load all.\n' +
  '3. Sub-triggers are mandatory. When a fired matrix row lists references/*.md,\n' +
  '   Read each listed file IN FULL (one Read call, no offset/limit) before\n' +
  '   implementing. SKILL.md alone is NOT "loaded" when its references/ cover the\n' +
  '   topic.\n' +
  '4. Loading mechanics. Load skills only through your agent\'s skill mechanism\n' +
  '   (Claude Code: \'Skill\' tool; Cursor: agent skills dir or /skill; Codex: Read\n' +
  '   .codex/skills/<name>/SKILL.md; Copilot: .github/skills/). Never hunt for\n' +
  '   skill files under a workspace \'plugins/\' path, and never read skill or\n' +
  '   reference .md files with shell commands (cat / head / tail / type /\n' +
  '   Get-Content / pipes).\n' +
  '5. Workspace exploration uses Glob/Read/Grep tools only — never shell\n' +
  '   ls/dir/cat/find (Windows and macOS shells diverge; \'D:\\path\' collapses in\n' +
  '   bash). The shell is for real programs (git, npm, builder scripts) with\n' +
  '   forward-slash, double-quoted paths.\n' +
  '\n' +
  'Self-check: if you cannot name which Domain matrix rows fired for THIS message,\n' +
  'you have not re-classified — go back to AGENTS.md now.\n' +
  '</msw-skill-router-reminder>\n'
);
