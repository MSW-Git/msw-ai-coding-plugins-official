'use strict';

// MSW LSP Command Resolver & Safe Spawn
// Spawning `npx -y @maplestoryworlds/mlua-lsp@<ver>` every time we need to call
// mlua-lsp adds ~1–2 seconds on Windows just from the npm cache + Node bootstrap.
// This module reduces that cost by resolving the launch command in the following
// order of priority:
//
//   1) `MLUA_LSP_CMD` (+ `MLUA_LSP_ARGS`) env vars (explicit user / hooks.json override).
//   2) Use the workspace-local mlua-lsp runtime materialized by `mswai init/update`.
//   3) Use the @maplestoryworlds/mlua-lsp runtime vendored with ai-cli.
//   4) Use `mlua-lsp` from PATH if it is installed there.
//   5) Fall back to `npx -y @maplestoryworlds/mlua-lsp@<ver>` if `npx` is on PATH.
//   6) Last resort: the literal `mlua-lsp` (spawn will fail if it does not exist).
//
// Windows caveats:
//   - Node 18+ security policy prevents `spawn` from launching `.cmd` / `.bat`
//     files directly → invocation must go through `cmd.exe`.
//   - `spawn(file, args, { shell: true })` does not auto-quote `file`/`args` even
//     when they contain spaces, so a path like `C:\Program Files\nodejs\npx.CMD`
//     gets truncated to `C:\Program`.
//   - Therefore on Windows we always invoke via `cmd.exe /d /s /c "<quoted cmdline>"`,
//     escaping every token with `quoteForCmd` and passing the result through
//     `windowsVerbatimArguments`.

const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const DEFAULT_NPX_SPEC = '@maplestoryworlds/mlua-lsp@1.1.5';
const MLUA_LSP_PACKAGE_NAME = '@maplestoryworlds/mlua-lsp';
const MLUA_LSP_VERSION = '1.1.5';

function splitArgs(raw) {
  return String(raw || '').trim().split(/\s+/).filter(Boolean);
}

function findOnPath(name) {
  const PATH = process.env.PATH || process.env.Path || '';
  const exts = process.platform === 'win32'
    ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
    : [''];
  const dirs = PATH.split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext);
      try {
        if (fs.statSync(candidate).isFile()) return candidate;
      } catch (_) {
        // Try the next candidate.
      }
    }
  }
  return null;
}

function stripOuterQuotes(s) {
  if (typeof s !== 'string') return s;
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

function safeRealpath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch (_) {
    return filePath;
  }
}

function readPackageJson(packageJsonPath) {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function packageRootToBin(packageRoot) {
  if (!packageRoot) return null;
  const packageJsonPath = path.join(packageRoot, 'package.json');
  const pkg = readPackageJson(packageJsonPath);
  const bin = pkg && pkg.bin && (typeof pkg.bin === 'string' ? pkg.bin : pkg.bin['mlua-lsp']);
  if (!bin || typeof bin !== 'string') return null;
  const binAbs = path.resolve(packageRoot, bin);
  try {
    if (fs.statSync(binAbs).isFile()) return binAbs;
  } catch (_) {
    return null;
  }
  return null;
}

function packageVersionFromSpec(spec) {
  const idx = String(spec || '').lastIndexOf('@');
  return idx > 0 ? String(spec).slice(idx + 1) : 'unknown';
}

function resolvePackageRootWithNode(paths) {
  try {
    const opts = paths && paths.length > 0 ? { paths } : undefined;
    return path.dirname(require.resolve(`${MLUA_LSP_PACKAGE_NAME}/package.json`, opts));
  } catch (_) {
    return null;
  }
}

function candidateWorkspacePackageRoots(projectRoot) {
  if (!projectRoot) return [];
  const version = packageVersionFromSpec(process.env.MLUA_LSP_NPX_SPEC || DEFAULT_NPX_SPEC);
  return [
    path.join(projectRoot, '.mswai', 'runtime', 'mlua-lsp', version),
  ];
}

function candidateVendoredPackageRoots() {
  const roots = [];

  if (process.env.MSWAI_MLUA_LSP_PACKAGE_ROOT) {
    roots.push(stripOuterQuotes(process.env.MSWAI_MLUA_LSP_PACKAGE_ROOT));
  }

  const localResolved = resolvePackageRootWithNode();
  if (localResolved) roots.push(localResolved);

  const mswai = findOnPath('mswai');
  if (mswai) {
    const realMswai = safeRealpath(mswai);
    // POSIX global npm commonly symlinks <prefix>/bin/mswai to
    // <prefix>/lib/node_modules/@maplestoryworlds/ai-cli/bin/cli.js.
    roots.push(path.join(path.dirname(path.dirname(realMswai)), 'vendor', 'mlua-lsp', MLUA_LSP_VERSION));

    // Windows global npm creates mswai.cmd next to node_modules.
    roots.push(path.join(path.dirname(mswai), 'node_modules', '@maplestoryworlds', 'ai-cli', 'vendor', 'mlua-lsp', MLUA_LSP_VERSION));
  }

  const deduped = [];
  const seen = new Set();
  for (const root of roots) {
    if (!root) continue;
    const normalized = path.resolve(root);
    const key = process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(normalized);
  }
  return deduped;
}

function resolveWorkspaceLspBin(projectRoot) {
  for (const root of candidateWorkspacePackageRoots(projectRoot)) {
    const bin = packageRootToBin(root);
    if (bin) return bin;
  }
  return null;
}

function resolveBundledLspBin() {
  for (const root of candidateVendoredPackageRoots()) {
    const bin = packageRootToBin(root);
    if (bin) return bin;
  }
  return null;
}

/**
 * Safely quotes a single token for `cmd.exe`.
 *
 * `cmd.exe` quoting is finicky and impossible to fully generalize, but this
 * implementation is sufficient for the tokens that show up when invoking
 * mlua-lsp (executable paths, ASCII-only arguments, file/directory paths):
 *  - Wrap the token in double quotes if it contains whitespace or any cmd
 *    metacharacter (`&|<>^()"%`).
 *  - Escape interior double quotes as `\"` (Windows `CommandLineToArgvW` rules).
 */
function quoteForCmd(arg) {
  if (arg === null || arg === undefined) return '""';
  const str = String(arg);
  if (str.length === 0) return '""';
  if (!/[\s"&|<>^()%]/.test(str)) return str;

  // Backslashes immediately before a `"` must also be doubled (CommandLineToArgvW rules).
  let escaped = '';
  let backslashes = 0;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str.charAt(i);
    if (ch === '\\') {
      backslashes += 1;
    } else if (ch === '"') {
      escaped += '\\'.repeat(backslashes * 2 + 1);
      escaped += '"';
      backslashes = 0;
    } else {
      escaped += '\\'.repeat(backslashes);
      escaped += ch;
      backslashes = 0;
    }
  }
  // Trailing backslashes also need doubling.
  escaped += '\\'.repeat(backslashes * 2);
  return `"${escaped}"`;
}

/**
 * Determines the launch command for `mlua-lsp`.
 *
 * @returns {{
 *   cmd: string,            // Executable name or absolute path.
 *   baseArgs: string[],     // Base arguments prefixed before the subcommand
 *                           // (e.g. ['-y', '@maplestoryworlds/mlua-lsp@1.1.5']).
 *   useShell: boolean,      // Whether cmd.exe must be used on Windows
 *                           // (true for .cmd/.bat targets or env-var overrides).
 *   source: 'env'|'workspace'|'vendored'|'path'|'npx'|'fallback',
 * }}
 */
function resolveLspCommand(opts) {
  const projectRoot = opts && opts.projectRoot;
  const envCmd = process.env.MLUA_LSP_CMD;
  if (envCmd) {
    const cleanCmd = stripOuterQuotes(envCmd);
    return {
      cmd: cleanCmd,
      baseArgs: splitArgs(process.env.MLUA_LSP_ARGS),
      // A command coming from an env var could be an .exe, a shell script, an
      // alias, etc., so on Windows we conservatively always go through cmd.exe.
      useShell: process.platform === 'win32',
      source: 'env',
    };
  }

  const workspaceBin = resolveWorkspaceLspBin(projectRoot);
  if (workspaceBin) {
    return { cmd: process.execPath, baseArgs: [workspaceBin], useShell: false, source: 'workspace' };
  }

  const bundledBin = resolveBundledLspBin();
  if (bundledBin) {
    return { cmd: process.execPath, baseArgs: [bundledBin], useShell: false, source: 'vendored' };
  }

  if (process.platform === 'win32') {
    // Passing an absolute path (especially `C:\Program Files\...`) as the first
    // argument to `spawn` with `shell: true` easily breaks cmd quoting, so on
    // Windows we rely on PATHEXT and pass just the command name. We still probe
    // PATH to record an accurate `source`.
    if (findOnPath('mlua-lsp')) {
      return { cmd: 'mlua-lsp', baseArgs: [], useShell: true, source: 'path' };
    }
    if (findOnPath('npx')) {
      const npxSpec = process.env.MLUA_LSP_NPX_SPEC || DEFAULT_NPX_SPEC;
      return { cmd: 'npx', baseArgs: ['-y', npxSpec], useShell: true, source: 'npx' };
    }
    return { cmd: 'mlua-lsp', baseArgs: [], useShell: true, source: 'fallback' };
  }

  // POSIX: spawning an absolute path with `shell: false` is safe → fastest path.
  const direct = findOnPath('mlua-lsp');
  if (direct) {
    return { cmd: direct, baseArgs: [], useShell: false, source: 'path' };
  }
  const npx = findOnPath('npx');
  if (npx) {
    const npxSpec = process.env.MLUA_LSP_NPX_SPEC || DEFAULT_NPX_SPEC;
    return { cmd: npx, baseArgs: ['-y', npxSpec], useShell: false, source: 'npx' };
  }
  return { cmd: 'mlua-lsp', baseArgs: [], useShell: false, source: 'fallback' };
}

/**
 * Safely runs `spawnSync` using the result of `resolveLspCommand`.
 *
 * On Windows + `useShell`, we invoke `cmd.exe` explicitly and pass the
 * pre-quoted command line via `windowsVerbatimArguments` so the OS does not
 * re-mangle our quoting.
 *
 * @param {ReturnType<typeof resolveLspCommand>} resolved
 * @param {string[]} subArgs                          Subcommand + its arguments (e.g. `['diagnose', '<root>', '<file>']`).
 * @param {Parameters<typeof spawnSync>[2]} [spawnOpts]
 * @returns {ReturnType<typeof spawnSync>}
 */
function spawnLspSync(resolved, subArgs, spawnOpts) {
  const opts = Object.assign({
    encoding: 'utf8',
    windowsHide: true,
  }, spawnOpts || {});
  const allArgs = (resolved.baseArgs || []).concat(subArgs || []);

  if (process.platform === 'win32' && resolved.useShell) {
    const tokens = [resolved.cmd, ...allArgs].map(quoteForCmd);
    const cmdLine = `"${tokens.join(' ')}"`;
    const comspec = process.env.ComSpec || process.env.COMSPEC || 'cmd.exe';
    return spawnSync(comspec, ['/d', '/s', '/c', cmdLine], Object.assign({}, opts, {
      shell: false,
      windowsVerbatimArguments: true,
    }));
  }

  return spawnSync(resolved.cmd, allArgs, Object.assign({}, opts, {
    shell: resolved.useShell || false,
  }));
}

/**
 * Starts `mlua-lsp` in the background and returns immediately.
 *
 * Used by SessionStart prewarm so a first-run VSIX download or daemon warmup
 * never blocks the agent session. Follow-up diagnose calls still use
 * `spawnLspSync` because they need the diagnostics payload.
 *
 * @param {ReturnType<typeof resolveLspCommand>} resolved
 * @param {string[]} subArgs
 * @param {Parameters<typeof spawn>[2]} [spawnOpts]
 * @returns {{ pid?: number, error?: Error }}
 */
function spawnLspDetached(resolved, subArgs, spawnOpts) {
  const opts = Object.assign({
    windowsHide: true,
  }, spawnOpts || {});
  const allArgs = (resolved.baseArgs || []).concat(subArgs || []);

  try {
    let child;
    if (process.platform === 'win32' && resolved.useShell) {
      const tokens = [resolved.cmd, ...allArgs].map(quoteForCmd);
      const cmdLine = `"${tokens.join(' ')}"`;
      const comspec = process.env.ComSpec || process.env.COMSPEC || 'cmd.exe';
      child = spawn(comspec, ['/d', '/s', '/c', cmdLine], Object.assign({}, opts, {
        shell: false,
        windowsVerbatimArguments: true,
        detached: true,
        stdio: 'ignore',
      }));
    } else {
      child = spawn(resolved.cmd, allArgs, Object.assign({}, opts, {
        shell: resolved.useShell || false,
        detached: true,
        stdio: 'ignore',
      }));
    }
    child.unref();
    return { pid: child.pid };
  } catch (err) {
    return { error: err };
  }
}

module.exports = {
  resolveLspCommand,
  spawnLspSync,
  spawnLspDetached,
  splitArgs,
  findOnPath,
  resolveWorkspaceLspBin,
  resolveBundledLspBin,
  quoteForCmd,
  DEFAULT_NPX_SPEC,
};
