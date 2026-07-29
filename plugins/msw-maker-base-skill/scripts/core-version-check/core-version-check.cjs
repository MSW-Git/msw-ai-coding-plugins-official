#!/usr/bin/env node
'use strict';

// MSW Core Version Check Hook
// Runs only once per session: a lock file prevents duplicate execution.
// Compares the `CoreVersion` in `Environment/config` with the plugin's supported version.
//
// Auto-registered via the plugin's `hooks/hooks.json` — no manual setup required.

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const SUPPORTED_VERSION = '26.7.0.0';
const CONFIG_FILE = 'Environment/config';

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8').trim();
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}

const input = readInput();
const cwd = input.cwd || process.cwd();

const lockId = crypto.createHash('sha1').update(cwd).digest('hex').slice(0, 16);
const lockPath = path.join(os.tmpdir(), `.msw-corecheck-${lockId}`);

if (fs.existsSync(lockPath)) {
  process.exit(0);
}

const configPath = path.join(cwd, CONFIG_FILE);
if (!fs.existsSync(configPath)) {
  process.exit(0);
}

let configText;
try {
  configText = fs.readFileSync(configPath, 'utf8');
} catch (_) {
  process.exit(0);
}

const match = configText.match(/"CoreVersion"\s*:\s*"([^"]+)"/);
if (!match) {
  process.exit(0);
}
const coreVersion = match[1];

try {
  fs.writeFileSync(lockPath, '');
} catch (_) {
  // Continue with the check even if the lock file cannot be created.
}

if (coreVersion === SUPPORTED_VERSION) {
  process.exit(0);
}

process.stdout.write(
  `<core-version-mismatch>\n` +
  `MSW Core Version mismatch. Workspace: ${coreVersion} / Plugin: ${SUPPORTED_VERSION}\n` +
  `Inform the user of the following and do NOT proceed with any MSW development work (writing code, editing files, etc.).\n` +
  `- If the workspace version is higher → update the msw-ai-coding-plugins-official plugin to the latest version.\n` +
  `- If the workspace version is lower  → update the MSW client to the latest version.\n` +
  `</core-version-mismatch>\n`
);
