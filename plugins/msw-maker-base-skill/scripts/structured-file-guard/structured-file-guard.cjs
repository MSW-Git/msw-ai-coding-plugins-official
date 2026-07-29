#!/usr/bin/env node
'use strict';

// MSW structured file guard hook (PreToolUse).
// Direct .model/.ui reads and writes are blocked; use the matching builder.

const fs = require('fs');

if (
  process.env.MSW_STRUCTURED_FILE_GUARD_DISABLE === '1' ||
  process.env.MSW_MODEL_FILE_GUARD_DISABLE === '1'
) {
  process.exit(0);
}

const POLICIES = [
  {
    ext: '.model',
    directReason:
      '.model files are builder-only. Read skills/msw-general/references/builder-protocol.md (core) and skills/msw-general/references/builder-protocol-model.md §2 (call protocol) in full, then use the msw-general ModelBuilder script instead of direct Read/Edit/Write/MultiEdit.',
    bashReason:
      '.model files are builder-only. Do not read/edit/copy them through shell commands. Read skills/msw-general/references/builder-protocol.md (core) and skills/msw-general/references/builder-protocol-model.md §2 (call protocol) in full, then use msw-general ModelBuilder; node commands that call the builder are allowed. To DELETE a .model file (no builder delete API), run node -e "require(\'fs\').unlinkSync(\'RootDesk/MyDesk/Models/<Category>/<Name>.model\')" then refresh — not shell rm.',
  },
  {
    ext: '.ui',
    directReason:
      '.ui files are builder-only. Load the msw-ui-system skill, read skills/msw-general/references/builder-protocol.md (core) and skills/msw-general/references/builder-protocol-ui.md §3 (call protocol) in full, then use the msw-ui-system UIBuilder script instead of direct Read/Edit/Write/MultiEdit.',
    bashReason:
      '.ui files are builder-only. Do not read/edit/copy them through shell commands. Load the msw-ui-system skill, read skills/msw-general/references/builder-protocol.md (core) and skills/msw-general/references/builder-protocol-ui.md §3 (call protocol) in full, then use msw-ui-system UIBuilder; node commands that call the builder are allowed. To DELETE a .ui file (no builder delete API), run node -e "require(\'fs\').unlinkSync(\'ui/<File>.ui\')" then refresh — not shell rm.',
  },
];

const CONTENT_TOOL_RE =
  /(^|[\s|;&(`])(cat|type|more|less|head|tail|Get-Content|gc|grep|rg|egrep|fgrep|findstr|Select-String|sls|awk|sed|vim|vi|nvim|nano|emacs|code|notepad|Set-Content|Add-Content|Out-File|tee|cp|copy|Copy-Item|mv|move|Move-Item|rm|del|erase|Remove-Item|touch|New-Item|xxd|od|strings)([\s|;&)`]|$)/i;

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/');
}

function pathHasExtension(value, ext) {
  const escaped = ext.replace('.', '\\.');
  return new RegExp(`(^|/)[^/]+${escaped}$`, 'i').test(normalizePath(value));
}

function commandMentionsExtension(command, ext) {
  const escaped = ext.replace('.', '\\.');
  // `\b(?!\.)` keeps every real token boundary (space, quote, redirect, EOL)
  // but drops matches where another `.` follows — so a mid-name token like
  // `notes.ui.bak` / `A.model.backup` isn't mistaken for a builder-only file.
  return new RegExp(`${escaped}\\b(?!\\.)`, 'i').test(command);
}

// Blank the JS payload of `node -e/--eval/-p/--print` so tokens inside builder
// code (a `.ui` path, `copy`/`rm`/…) aren't scanned as shell invocations. The
// body matcher consumes `\<char>` escapes so an escaped closing quote (e.g.
// `node -e "x=\"ui/A.ui\""`) can't end the string early and leak tokens.
function stripNodeEval(command) {
  return command.replace(
    /(\bnode(?:\.exe)?\b[^|;&`]*?\s(?:-e|--eval|-p|--print|-pe)(?:=|\s)\s*)(["'`])((?:\\.|(?!\2)[\s\S])*)\2/gi,
    (match, prefix, quote) => prefix + quote + quote,
  );
}

function matchingPathPolicy(value) {
  return POLICIES.find((policy) => pathHasExtension(value, policy.ext));
}

function matchingCommandPolicy(command) {
  return POLICIES.find((policy) => commandMentionsExtension(command, policy.ext));
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

const input = readInput();
const toolName = input.tool_name || input.toolName || input.name || '';
const toolInput = input.tool_input || {};

if (/^(Read|Edit|Write|MultiEdit|NotebookEdit)$/.test(toolName)) {
  const filePath = toolInput.file_path || toolInput.path || toolInput.notebook_path || '';
  const policy = matchingPathPolicy(filePath);
  if (policy) {
    deny(policy.directReason);
  }
  process.exit(0);
}

if (toolName !== 'Bash') {
  process.exit(0);
}

const command = String(toolInput.command || '');
if (!command) {
  process.exit(0);
}

const shellCommand = stripNodeEval(command);
const policy = matchingCommandPolicy(shellCommand);
if (!policy || !CONTENT_TOOL_RE.test(shellCommand)) {
  process.exit(0);
}

deny(policy.bashReason);
