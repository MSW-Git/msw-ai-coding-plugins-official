#!/usr/bin/env node
/**
 * msw-planning web-view deployer (fixed skill asset — the AI never edits this).
 *
 * Usage:  node build-status-data.cjs "<projectRoot>" [--serve]
 *
 * Deploys the skill's pre-built form(s) into <projectRoot>/Docs/web/ so a view can be
 * opened with no manual setup, and migrates legacy root-level artifacts into that
 * folder. This build ships one form — DecisionSheet.html — which renders
 * Docs/web/decision-data.json, written by the session at a decision gate.
 * A form the current skill build doesn't ship is skipped silently, so views can be
 * released one at a time.
 *
 * --serve: start a throwaway static server on 127.0.0.1 (first free port from 8931)
 * that serves ONLY Docs/web, and print "[web-view] serving <url>". This is REQUIRED,
 * not optional: the form fetches its gate data as JSON, and a browser refuses that
 * read for a page opened straight off the disk (file://). Open the printed address
 * in the in-app pane when there is one, otherwise in the OS default browser.
 *
 * decision-data.json is a DISPOSABLE presentation package: regenerate any time,
 * never hand-edit, never read it back as planning input — the markdown docs and the
 * user's chat answer are the single source of truth.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
const SERVE = argv.includes("--serve");
const root = path.resolve(argv.find((a) => !a.startsWith("--")) || process.cwd());
// All web artifacts (forms, data files) live under Docs/web/ — never the project root.
const webDir = path.join(root, "Docs", "web");

// Docs/ or Docs/web may be a link out of the project, and everything downstream is scoped to the
// RESOLVED web dir. Prove containment BEFORE creating anything: mkdir through an external link
// would already have written outside the project.
// Resolving an existing path is mandatory: falling back to the unresolved path would let the
// containment check pass on something we could not actually verify (fail-open).
const mustResolve = (p) => {
  try {
    return fs.realpathSync(p);
  } catch (e) {
    console.error(
      "[web-view] refusing to run: cannot resolve the real path of " + p + " (" + e.message + ").\n" +
      "           Without that this run cannot prove it stays inside the project."
    );
    process.exit(1);
  }
};
// A project root that does not exist yet has nothing to escape through — create it, then resolve.
if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
const rootReal = mustResolve(root);
const escapes = (p) => {
  const rel = path.relative(rootReal, p);
  return rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel);
};
const refuse = (what, resolved) => {
  console.error(
    "[web-view] refusing to run: " + what + " resolves to " + resolved +
    ", which is outside the project root " + rootReal + ".\n" +
    "           Remove the link (or point it back inside the project) and run again."
  );
  process.exit(1);
};
// Walk down from the root and check each existing segment before it is followed or created.
for (const seg of ["Docs", path.join("Docs", "web")]) {
  const p = path.join(root, seg);
  // lstat, not existsSync: a link whose target is missing reports "does not exist" and would
  // slip past the check, only to blow up in mkdir with a raw stack trace.
  // Only "it isn't there" may skip the check. Any other lstat failure (permissions, a loop) means
  // this path could not be inspected — skipping it would waive the containment proof for it.
  try {
    fs.lstatSync(p);
  } catch (e) {
    if (e.code === "ENOENT") continue;   // genuinely absent — nothing to verify yet
    console.error(
      "[web-view] refusing to run: cannot inspect " + p + " (" + e.message + ").\n" +
      "           Without that this run cannot prove it stays inside the project."
    );
    process.exit(1);
  }
  const resolved = mustResolve(p);
  if (escapes(resolved)) refuse(p, resolved);
}
try {
  fs.mkdirSync(webDir, { recursive: true });
} catch (e) {
  console.error("[web-view] refusing to run: could not create " + webDir + " (" + e.message + ").");
  process.exit(1);
}
const webReal = mustResolve(webDir);
if (escapes(webReal)) refuse(webDir, webReal);   // re-check what actually got created

// Fixed forms deployed next to the data files (self-healing copies).
const FORMS = [["msw-decision-sheet.html", "DecisionSheet.html"]];
const HOME_PAGE = "DecisionSheet.html";

// The gate data's own home must be a plain file (or nothing). If something else is squatting on the
// name, the session's next gate write fails with an error that points nowhere near the cause.
{
  const dataPath = path.join(webDir, "decision-data.json");
  let st = null;
  try {
    st = fs.lstatSync(dataPath);
  } catch (e) {
    // Absent is the normal case — but only ENOENT means absent. Anything else (permissions, a
    // link loop) means the path could not be inspected, and continuing would waive this check.
    if (e.code !== "ENOENT") {
      console.error("[web-view] refusing to run: cannot inspect " + dataPath + " (" + e.message + ").");
      process.exit(1);
    }
  }
  // nlink > 1 is a hard link, which lstat reports as a plain file: writing the gate here would
  // rewrite whatever else shares that inode.
  if (st && (!st.isFile() || st.nlink > 1)) {
    console.error(
      "[web-view] refusing to run: " + dataPath + " is " +
      (st.isDirectory() ? "a directory" : !st.isFile() ? "not a regular file" : "a hard link to another file") + ".\n" +
      "           That path is where the gate data is written — remove it and run again."
    );
    process.exit(1);
  }
}

// Legacy names are matched case-insensitively (any casing may exist on disk), but the destination is
// always the canonical name: the form fetches "decision-data.json" literally, so a DECISION-DATA.JSON
// carried over as-is would not be found on a case-sensitive filesystem.
// Object.create(null), not a literal: this is keyed by whatever names happen to sit in the
// project root, and an entry called "constructor" or "__proto__" would otherwise resolve to an
// inherited value — truthy, not a string, and path.join() throws on it.
const CANONICAL = Object.assign(Object.create(null), {
  "decisionsheet.html": "DecisionSheet.html",
  "decision-data.json": "decision-data.json",
});
// The gate used to be an executable .js the page loaded with a <script> tag. It is JSON now, so
// any leftover .js is dead weight the form will never read — and leaving one next to the real
// data invites a session into editing the wrong file. Disposable by contract, so just clear it.
for (const dir of [root, webDir]) {
  for (const name of ["decision-data.js"]) {
    const p = path.join(dir, name);
    let st = null;
    try {
      st = fs.lstatSync(p);
    } catch (e) {
      // Absent is the normal case. Anything else means we could not look at it — say so and move
      // on: leaving a dead file behind is a nuisance, but failing the whole run over it is worse.
      if (e.code !== "ENOENT") console.error("[web-view] could not inspect " + p + " (" + e.message + ") — leaving it in place.");
      continue;
    }
    if (!st.isFile() || st.nlink > 1) continue;   // not ours to touch
    try {
      fs.unlinkSync(p);
      console.log("[web-view] removed obsolete executable gate file: " + p);
    } catch (e) {
      console.error("[web-view] could not remove the obsolete " + p + " (" + e.message + ") — delete it by hand.");
      process.exit(1);
    }
  }
}
// One-time migration: earlier versions placed artifacts at the project root — move them in.
// A failure here is not cosmetic: a decision-data.json left at the root means the view can show
// stale or missing content, so every error is collected and the run stops.
const migrationErrors = [];
try {
  for (const name of fs.readdirSync(root)) {
    const canon = CANONICAL[name.toLowerCase()];
    if (typeof canon !== "string") continue;   // absent, or an inherited name that is not ours
    const from = path.join(root, name);
    const to = path.join(webDir, canon);   // conflicts are decided on the canonical path too
    try {
      // Only a regular file is an artifact. A directory (or a link) carrying one of these names
      // would be renamed into Docs/web as-is, and the data file's own home would silently become
      // a folder — every later gate write then fails somewhere far from here.
      const fromStat = fs.lstatSync(from);
      if (!fromStat.isFile() || fromStat.nlink > 1) {
        migrationErrors.push(
          name + " is " +
          (fromStat.isDirectory() ? "a directory" : !fromStat.isFile() ? "not a regular file" : "a hard link to another file") +
          " but carries an artifact name — move or delete it by hand"
        );
        continue;
      }
      // The DESTINATION has to be inspected before it is read, compared against, or replaced.
      // existsSync and readFileSync both follow a link: a symlinked destination would be read
      // through something outside the project and could decide the fate of the root file, and a
      // broken link reports "does not exist" so the rename would quietly replace it. Only an
      // absent path or a plain, un-hard-linked file may take part in a migration.
      let toStat = null;
      try {
        toStat = fs.lstatSync(to);
      } catch (e) {
        if (e.code !== "ENOENT") {
          migrationErrors.push(canon + ": cannot inspect " + to + " (" + e.message + ")");
          continue;
        }
      }
      if (toStat && (!toStat.isFile() || toStat.nlink > 1)) {
        migrationErrors.push(
          "Docs/web/" + canon + " is " +
          (toStat.isSymbolicLink() ? "a symlink" : toStat.isDirectory() ? "a directory" : !toStat.isFile() ? "not a regular file" : "a hard link to another file") +
          " — remove it by hand, then run again"
        );
        continue;
      }
      if (!toStat) {
        fs.renameSync(from, to);
        console.log("[web-view] migrated root artifact -> Docs/web/" + canon);
      } else if (fs.readFileSync(from, "utf8") === fs.readFileSync(to, "utf8")) {
        fs.unlinkSync(from);   // byte-identical leftover: safe to drop
        console.log("[web-view] removed duplicate root artifact: " + name);
      } else if (canon === "DecisionSheet.html") {
        // The form is a regenerable deploy target, never a source of truth: the root copy is residue.
        fs.unlinkSync(from);
        console.log("[web-view] removed stale root form: " + name);
      } else {
        // The gate's content differs between the two places and only Docs/web is ever displayed,
        // so continuing would quietly show one of them. Stop and let a human pick.
        console.error(
          "[web-view] refusing to run: " + name + " exists in BOTH places with different content.\n" +
          "           root:     " + from + "\n" +
          "           Docs/web: " + to + "\n" +
          "           Only Docs/web is ever displayed. Keep the one you want (usually Docs/web),\n" +
          "           delete the other, and run again."
        );
        process.exit(1);
      }
    } catch (e) {
      migrationErrors.push(name + ": " + e.message);
    }
  }
} catch (e) {
  migrationErrors.push("could not list the project root: " + e.message);
}
if (migrationErrors.length) {
  console.error(
    "[web-view] refusing to run: legacy root artifacts could not be migrated —\n" +
    migrationErrors.map(function (m) { return "           " + m; }).join("\n") + "\n" +
    "           Resolve those files by hand (the view would otherwise show stale data) and run again."
  );
  process.exit(1);
}

// Self-heal the form copies (deploy once, refresh when the skill ships newer forms).
const deployed = [];
const failed = [];
for (const [srcName, dstName] of FORMS) {
  try {
    const src = path.join(__dirname, srcName);
    // A form the current skill build doesn't ship is simply not deployed (no error):
    // keeps this packer correct when the views are released one at a time.
    if (!fs.existsSync(src)) continue;
    const dst = path.join(webDir, dstName);
    // copyFileSync follows a link: a deploy target that is a link (or a directory) would let the
    // write land somewhere else entirely, so refuse instead of overwriting an unknown file.
    let dstStat = null;
    // As above: "not there yet" is the only failure that may fall through to the copy. Treating an
    // uninspectable target as absent would skip the link/hard-link refusal that follows.
    try {
      dstStat = fs.lstatSync(dst);
    } catch (e) {
      if (e.code !== "ENOENT") {
        console.error(
          "[web-view] refusing to deploy " + dstName + ": cannot inspect " + dst + " (" + e.message + ")."
        );
        process.exit(1);
      }
    }
    // nlink > 1 means a hard link: writing here would change that other file too, and a hard link
    // is indistinguishable from a plain file to lstat().isFile().
    if (dstStat && (!dstStat.isFile() || dstStat.nlink > 1)) {
      console.error(
        "[web-view] refusing to deploy " + dstName + ": " + dst + " is " +
        (dstStat.isSymbolicLink() ? "a symlink" : !dstStat.isFile() ? "not a regular file" : "a hard link to another file") +
        " — delete it and run again."
      );
      process.exit(1);
    }
    const needCopy =
      !fs.existsSync(dst) || fs.readFileSync(src, "utf8") !== fs.readFileSync(dst, "utf8");
    if (needCopy) {
      fs.copyFileSync(src, dst);
      deployed.push(dstName);
    }
  } catch (e) {
    console.error("[web-view] form copy failed (" + dstName + "): " + e.message);
    failed.push(dstName);
  }
}
// Opening a view whose form never landed would show the user a stale or missing page, so a
// partial deploy is a failed run: no success line, no server, non-zero exit.
if (failed.length) {
  console.error(
    "[web-view] " + failed.length + " form(s) could not be deployed (" + failed.join(", ") + ") — " +
    "not opening the view. Fix the cause (permissions, disk, a lock on the file) and run again."
  );
  process.exit(1);
}

console.log(
  "[web-view] " +
    (deployed.length ? "forms deployed: " + deployed.join(", ") : "forms up-to-date") +
    " -> " + webDir
);

// --serve: throwaway localhost static server for in-app preview panes (see header).
if (SERVE) {
  const http = require("http");
  const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
  };
  // webReal was resolved at startup and proven to be inside the project root; every candidate
  // is resolved the same way before it is served.
  const inside = (p) => p === webReal || p.startsWith(webReal + path.sep);
  // Walk webReal -> target one segment at a time; lstat reports links (and Windows junctions)
  // without following them, so a link anywhere on the way is caught before the file is read.
  const noLinksBelowWebDir = (target, cb) => {
    const parts = path.relative(webReal, target).split(path.sep).filter(Boolean);
    let cur = webReal, i = 0;
    (function step() {
      if (i >= parts.length) return cb(null, false);
      cur = path.join(cur, parts[i++]);
      fs.lstat(cur, (e, st) => {
        if (e) return cb(e);
        if (st.isSymbolicLink()) return cb(null, true);
        step();
      });
    })();
  };

  const server = http.createServer((req, res) => {
    // This server reads one folder and nothing else. Answering a write method with the file and a
    // 200 reads as "accepted" — which it can never mean here — so only GET and HEAD get past.
    const method = String(req.method || "").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end("method not allowed");
      return;
    }
    let rel;
    // A malformed escape (e.g. "/%") makes decodeURIComponent throw — answer 400 instead of
    // letting the exception take the whole server down mid-session.
    try {
      rel = decodeURIComponent((req.url || "/").split("?")[0]);
    } catch (e) {
      res.writeHead(400).end("bad request");
      return;
    }
    if (rel === "/" || rel === "") rel = "/" + HOME_PAGE;
    if (rel.indexOf("\0") >= 0) { res.writeHead(400).end("bad request"); return; }
    // Serve Docs/web only — reject anything that escapes it, before and after resolving links.
    const target = path.resolve(webReal, "." + rel);
    if (!inside(target)) {
      res.writeHead(403).end("forbidden");
      return;
    }
    // Every segment below Docs/web must be a real entry: a link is refused even when it points
    // back inside, so what is served is always the file that is actually sitting in the folder.
    noLinksBelowWebDir(target, (linkErr, hasLink) => {
      if (linkErr) { res.writeHead(404).end("not found"); return; }
      if (hasLink) { res.writeHead(403).end("forbidden"); return; }
    fs.realpath(target, (rErr, real) => {
      if (rErr) { res.writeHead(404).end("not found"); return; }
      if (!inside(real)) { res.writeHead(403).end("forbidden"); return; }   // a symlink pointing out
      fs.stat(real, (sErr, st) => {
        if (sErr || !st.isFile()) { res.writeHead(404).end("not found"); return; }   // dirs, devices, sockets
        fs.readFile(real, (err, data) => {
          if (err) {
            res.writeHead(404).end("not found");
            return;
          }
          res.writeHead(200, {
            "Content-Type": MIME[path.extname(real).toLowerCase()] || "application/octet-stream",
            "Content-Length": data.length,
            "Cache-Control": "no-store",
          });
          res.end(method === "HEAD" ? undefined : data);   // HEAD answers with the headers alone
        });
      });
    });
    });
  });
  // Last-resort net: a socket-level error must not kill a server the user is browsing.
  server.on("clientError", (err, socket) => { try { socket.end("HTTP/1.1 400 Bad Request\r\n\r\n"); } catch (e) {} });

  const BASE_PORT = 8931;
  const MAX_TRIES = 20;
  let port = BASE_PORT;
  server.on("error", (e) => {
    if (e.code === "EADDRINUSE" && port < BASE_PORT + MAX_TRIES) {
      server.listen(++port, "127.0.0.1");
      return;
    }
    // Opening the .html straight off the disk is NOT a fallback any more: the form fetches its
    // gate data, and a browser refuses that read for a file:// page. Say what actually works,
    // and exit non-zero so the caller can tell that no view is available.
    console.error(
      "[web-view] serve failed (" + e.message + ") — no web view is available.\n" +
      "           Do NOT open Docs/web/DecisionSheet.html directly; served over file:// it cannot\n" +
      "           read the gate data. Ask the questions in chat instead, with each option's\n" +
      "           tradeoff written into its description (see the skill's decision-sheet reference)."
    );
    process.exit(1);
  });
  server.listen(port, "127.0.0.1", () => {
    console.log("[web-view] serving http://127.0.0.1:" + port + "/" + HOME_PAGE);
    console.log("[web-view] (throwaway server — Docs/web only, 127.0.0.1 only; ends with this process)");
  });
}
