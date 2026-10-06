#!/usr/bin/env node
/**
 * MSW Resource Search API — Node.js (CommonJS) wrapper.
 *
 * Node.js implementation. Exposes every endpoint of the MSW resource search
 * REST API as functions and CLI subcommands.
 *
 *   const api = require('./msw_resource_api');
 *   const hits = await api.searchResources('orange mushroom', {
 *     resourceTypeFilter: ['resource_pack'],
 *     categoryFilter: ['npc'],
 *     topK: 3,
 *   });
 *   const detail = await api.getResource(hits.results[0].id);
 *
 * CLI:
 *   node msw_resource_api.cjs search "orange mushroom" \
 *     --resource-type resource_pack --category npc --topK 3
 *   node msw_resource_api.cjs get 0017da7385e04bc4b2ddbe5949b4b462
 * Design notes:
 *  - No external dependencies. Uses only Node 18+ built-in `fetch`/`AbortController`.
 *  - All POST bodies are encoded as UTF-8 JSON and sent with
 *    `Content-Type: application/json; charset=utf-8`.
 *    Korean / Japanese / emoji payloads are safe.
 *  - Default page size for list-style endpoints is 3 (per the SKILL.md convention).
 */

'use strict';

const BASE_URL = 'https://maplestoryworlds-resourcesearch-new.nexon.com/api';
const DEFAULT_TIMEOUT_MS = 15_000; // SKILL.md recommends 15s

// Cap concurrent outgoing requests to avoid unbounded resource consumption
// (file descriptors / sockets / memory) under repeated or bursty callers.
const MAX_CONCURRENT_REQUESTS = 10;
let _activeRequests = 0;
const _requestQueue = [];

function _acquireSlot() {
  if (_activeRequests < MAX_CONCURRENT_REQUESTS) {
    _activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => _requestQueue.push(resolve));
}

function _releaseSlot() {
  const next = _requestQueue.shift();
  if (next) {
    next();
  } else {
    _activeRequests--;
  }
}
const DEFAULT_LIMIT = 3;           // skill convention (server defaults are 5/10)

class MswApiError extends Error {
  constructor(status, url, body) {
    const snippet = typeof body === 'string' ? body.slice(0, 500) : String(body);
    super(`MSW API ${status} on ${url}: ${snippet}`);
    this.name = 'MswApiError';
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

const HEX_RUID_RE = /^[0-9a-f]{32}$/i;
const UUID_CURSOR_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalize the `offset` argument for list-style endpoints (`/v3/resources`,
 * `/v3/resources/packs/{ruid}`) whose cursor is an opaque UUID string.
 *
 *  - `undefined` / `null` → undefined (first page).
 *  - Valid UUID cursor → returned as-is.
 *  - `0` / `"0"` / `""` / `"null"` → undefined (silent: common "first page"
 *    confusion that would otherwise return zero items).
 *  - Anything else → undefined, with a stderr warning so the caller learns
 *    that the value was discarded.
 */
function _normalizeListOffset(offset) {
  if (offset === undefined || offset === null) return undefined;
  const s = String(offset);
  if (UUID_CURSOR_RE.test(s)) return s;
  if (s === '0' || s === '' || s === 'null' || s === 'undefined') return undefined;
  if (typeof process !== 'undefined' && process.stderr && process.stderr.write) {
    process.stderr.write(
      `[msw-api warn] offset "${s}" is not a valid cursor `
      + `(expected the UUID string returned in the previous response's nextOffset); `
      + `ignoring and fetching the first page.\n`
    );
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Low-level HTTP helper
// ---------------------------------------------------------------------------

/**
 * Serialize a query object to a URLSearchParams string.
 * - null / undefined values are dropped.
 * - Arrays / tuples are repeated under the same key (`types=a&types=b`).
 */
function _buildQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined) continue;
        params.append(key, String(item));
      }
    } else {
      params.append(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

async function _request(method, path, { query, body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  await _acquireSlot();
  try {
    const url = BASE_URL + path + _buildQuery(query);

    const headers = { Accept: 'application/json' };
    let payload;
    if (body !== undefined && body !== null) {
      payload = Buffer.from(JSON.stringify(body), 'utf8');
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    let resp;
    try {
      resp = await fetch(url, {
        method,
        headers,
        body: payload,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timer);
      const reason = err && err.name === 'AbortError'
        ? `timeout after ${timeout}ms`
        : (err && err.message) || String(err);
      throw new MswApiError(0, url, reason);
    }
    clearTimeout(timer);

    const text = await resp.text();
    if (!resp.ok) {
      throw new MswApiError(resp.status, url, text);
    }
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_e) {
      return text;
    }
  } finally {
    _releaseSlot();
  }
}

const _enc = (s) => encodeURIComponent(s);

// ---------------------------------------------------------------------------
// Section: Semantic Search — POST /v3/search/resources & similar
// ---------------------------------------------------------------------------

/**
 * Natural-language semantic search.
 * `POST /v3/search/resources` (SearchRequest schema).
 * Used to search sprite / animationclip / resource_pack / sound / avataritem.
 * For avatar costumes, prefer `searchAvatarItems` — it pins
 * `resourceTypeFilter=["avataritem"]` automatically.
 *
 * Body keys follow the OpenAPI spec verbatim (`topK`, `resourceTypeFilter`,
 * `categoryFilter`, …). The legacy wrapper's `limit` / `types` / `categories`
 * were silently ignored by the server.
 *
 * @param {string} query
 * @param {object} [opts]
 * @returns {Promise<object>}
 */
async function searchResources(query, opts = {}) {
  const {
    resourceTypeFilter,
    categoryFilter,
    topK = DEFAULT_LIMIT,
    offset = 0,
    canonicalOnly,
    widthMin, widthMax, heightMin, heightMax,
    lengthMin, lengthMax,
    compact = true,
  } = opts;
  const payload = { query, topK, offset };
  if (resourceTypeFilter !== undefined) payload.resourceTypeFilter = [...resourceTypeFilter];
  if (categoryFilter !== undefined) payload.categoryFilter = [...categoryFilter];
  if (canonicalOnly !== undefined && canonicalOnly !== null) payload.canonicalOnly = canonicalOnly;
  if (widthMin !== undefined && widthMin !== null) payload.widthMin = widthMin;
  if (widthMax !== undefined && widthMax !== null) payload.widthMax = widthMax;
  if (heightMin !== undefined && heightMin !== null) payload.heightMin = heightMin;
  if (heightMax !== undefined && heightMax !== null) payload.heightMax = heightMax;
  if (lengthMin !== undefined && lengthMin !== null) payload.lengthMin = lengthMin;
  if (lengthMax !== undefined && lengthMax !== null) payload.lengthMax = lengthMax;
  return _request('POST', '/v3/search/resources', {
    query: compact ? { compact: 'true' } : undefined,
    body: payload,
  });
}

/**
 * Search avatar costume items (cap, coat, pants, shoes, weapon, …).
 * `POST /v3/search/resources` + `resourceTypeFilter=["avataritem"]`.
 */
async function searchAvatarItems(query, opts = {}) {
  const {
    topK = DEFAULT_LIMIT,
    offset = 0,
    categoryFilter,
    canonicalOnly,
    compact = true,
  } = opts;
  const payload = {
    query, topK, offset,
    resourceTypeFilter: ['avataritem'],
  };
  if (categoryFilter !== undefined) payload.categoryFilter = [...categoryFilter];
  if (canonicalOnly !== undefined && canonicalOnly !== null) payload.canonicalOnly = canonicalOnly;
  return _request('POST', '/v3/search/resources', {
    query: compact ? { compact: 'true' } : undefined,
    body: payload,
  });
}

/**
 * Find resources similar to a given RUID.
 * `GET /v3/search/resources/similar/{id}`. The server uses `topK`
 * (default 20, max 100). The legacy wrapper's `limit` was ignored.
 */
async function findSimilarResources(ruid, opts = {}) {
  const {
    topK = DEFAULT_LIMIT,
    resourceTypeFilter,
    categoryFilter,
    canonicalOnly,
    widthMin, widthMax, heightMin, heightMax,
    compact = true,
  } = opts;
  const query = { topK };
  if (resourceTypeFilter !== undefined) query.resourceTypeFilter = [...resourceTypeFilter];
  if (categoryFilter !== undefined) query.categoryFilter = [...categoryFilter];
  if (canonicalOnly !== undefined && canonicalOnly !== null) query.canonicalOnly = canonicalOnly ? 'true' : 'false';
  if (widthMin !== undefined && widthMin !== null) query.widthMin = widthMin;
  if (widthMax !== undefined && widthMax !== null) query.widthMax = widthMax;
  if (heightMin !== undefined && heightMin !== null) query.heightMin = heightMin;
  if (heightMax !== undefined && heightMax !== null) query.heightMax = heightMax;
  if (compact) query.compact = 'true';
  return _request('GET', `/v3/search/resources/similar/${_enc(ruid)}`, { query });
}

// ---------------------------------------------------------------------------
// Section: Resource Details & Tags
// ---------------------------------------------------------------------------

/** Fetch a single resource's details. `GET /v3/resources/{ruid}`. */
async function getResource(ruid) {
  return _request('GET', `/v3/resources/${_enc(ruid)}`);
}

/** Batch-fetch multiple resources. `POST /v3/resources/batch`. */
async function getResourcesBatch(ids) {
  return _request('POST', '/v3/resources/batch', { body: { ids: [...ids] } });
}

/** Fetch AI-generated multilingual tags. `GET /v3/resources/tags/{ruid}`. */
async function getResourceTags(ruid) {
  return _request('GET', `/v3/resources/tags/${_enc(ruid)}`);
}

// ---------------------------------------------------------------------------
// Section: Browsing — listings, random, and pack details
// ---------------------------------------------------------------------------

/**
 * Qdrant Scroll-based resource listing. `GET /v3/resources`.
 * `offset` is the `nextOffset` string cursor from the previous response.
 * Omit it for the first page.
 * Fixes the legacy bug where the wrapper sent `offset=0` (int) and matched 0 items.
 *
 * Filters are sent under the canonical OpenAPI keys
 * `resourceTypeFilter` / `categoryFilter`.
 */
async function listResources(opts = {}) {
  const {
    resourceTypeFilter,
    categoryFilter,
    limit = DEFAULT_LIMIT,
    offset,
    canonicalOnly,
    widthMin, widthMax, heightMin, heightMax,
    lengthMin, lengthMax,
    compact = true,
  } = opts;
  const query = { limit };
  if (resourceTypeFilter !== undefined) query.resourceTypeFilter = [...resourceTypeFilter];
  if (categoryFilter !== undefined) query.categoryFilter = [...categoryFilter];
  const cursor = _normalizeListOffset(offset);
  if (cursor !== undefined) query.offset = cursor;
  if (canonicalOnly !== undefined && canonicalOnly !== null) query.canonicalOnly = canonicalOnly ? 'true' : 'false';
  if (widthMin !== undefined && widthMin !== null) query.widthMin = widthMin;
  if (widthMax !== undefined && widthMax !== null) query.widthMax = widthMax;
  if (heightMin !== undefined && heightMin !== null) query.heightMin = heightMin;
  if (heightMax !== undefined && heightMax !== null) query.heightMax = heightMax;
  if (lengthMin !== undefined && lengthMin !== null) query.lengthMin = lengthMin;
  if (lengthMax !== undefined && lengthMax !== null) query.lengthMax = lengthMax;
  if (compact) query.compact = 'true';
  return _request('GET', '/v3/resources', { query });
}

/**
 * Random resource recommendations. `GET /v3/resources/random`.
 * The server uses `count` (NOT `limit`) along with
 * `resourceTypeFilter` / `categoryFilter`.
 */
async function randomResources(opts = {}) {
  const {
    resourceTypeFilter,
    categoryFilter,
    count = DEFAULT_LIMIT,
    canonicalOnly,
    widthMin, widthMax, heightMin, heightMax,
    lengthMin, lengthMax,
    compact = true,
  } = opts;
  const query = { count };
  if (resourceTypeFilter !== undefined) query.resourceTypeFilter = [...resourceTypeFilter];
  if (categoryFilter !== undefined) query.categoryFilter = [...categoryFilter];
  if (canonicalOnly !== undefined && canonicalOnly !== null) query.canonicalOnly = canonicalOnly ? 'true' : 'false';
  if (widthMin !== undefined && widthMin !== null) query.widthMin = widthMin;
  if (widthMax !== undefined && widthMax !== null) query.widthMax = widthMax;
  if (heightMin !== undefined && heightMin !== null) query.heightMin = heightMin;
  if (heightMax !== undefined && heightMax !== null) query.heightMax = heightMax;
  if (lengthMin !== undefined && lengthMin !== null) query.lengthMin = lengthMin;
  if (lengthMax !== undefined && lengthMax !== null) query.lengthMax = lengthMax;
  if (compact) query.compact = 'true';
  return _request('GET', '/v3/resources/random', { query });
}

/**
 * List resource packs that contain a given RUID.
 * `GET /v3/resources/packs/{id}` — the path parameter is a 32-hex RUID
 * (NOT a pack id). The server returns packs whose `payload.elements` include that RUID.
 *
 * To fetch a pack's own metadata + populated elements, use `getResource(packId)`
 * — that endpoint fills in the payload of each element and returns it.
 */
async function findPacksContaining(ruid, opts = {}) {
  if (!HEX_RUID_RE.test(String(ruid || ''))) {
    throw new Error(
      `'packs' expects a 32-hex RUID, got "${ruid}". `
      + `If you want a pack's contents, use getResource(packId) (CLI: 'get <packId>') instead — `
      + `that endpoint returns the pack with each payload.elements[*] populated.`
    );
  }
  const { limit = DEFAULT_LIMIT, offset, compact = true } = opts;
  const query = { limit };
  const cursor = _normalizeListOffset(offset);
  if (cursor !== undefined) query.offset = cursor;
  if (compact) query.compact = 'true';
  return _request('GET', `/v3/resources/packs/${_enc(ruid)}`, { query });
}

// ---------------------------------------------------------------------------
// Section: Avatar — listings and defaults
// ---------------------------------------------------------------------------

/**
 * List every avatar item (server-cached).
 * `GET /v3/avatars`. For keyword search, use `searchAvatarItems`.
 */
async function listAvatars({ canonicalOnly = true } = {}) {
  return _request('GET', '/v3/avatars', {
    query: { canonicalOnly: canonicalOnly ? 'true' : 'false' },
  });
}

/** Fetch the default body / head RUIDs. `GET /v3/avatars/defaults`. */
async function getAvatarDefaults() {
  return _request('GET', '/v3/avatars/defaults');
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

/** Tiny argv parser. Does not port argparse wholesale — only what we need. */
function _parseArgs(argv, spec) {
  // spec: { positional: [{name, nargs?: '+'|undefined}], options: { flag: {dest, type, nargs?, const?, default?} } }
  const result = {};
  for (const [, opt] of Object.entries(spec.options || {})) {
    if (opt.default !== undefined) result[opt.dest] = opt.default;
  }
  const positionals = [];
  let i = 0;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const opt = spec.options && spec.options[tok];
      if (!opt) throw new Error(`unknown option: ${tok}`);
      if (opt.nargs === '+') {
        const values = [];
        i += 1;
        while (i < argv.length && !argv[i].startsWith('--')) {
          values.push(argv[i]);
          i += 1;
        }
        if (values.length === 0) throw new Error(`option ${tok} requires at least one value`);
        result[opt.dest] = opt.type === 'int' ? values.map((v) => parseInt(v, 10))
          : opt.type === 'float' ? values.map((v) => parseFloat(v))
            : values;
        continue;
      }
      if (opt.const !== undefined) {
        result[opt.dest] = opt.const;
        i += 1;
        continue;
      }
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`option ${tok} requires a value`);
      result[opt.dest] = opt.type === 'int' ? parseInt(v, 10)
        : opt.type === 'float' ? parseFloat(v)
          : v;
      i += 2;
      continue;
    }
    positionals.push(tok);
    i += 1;
  }
  let pi = 0;
  for (const p of spec.positional || []) {
    if (p.nargs === '+') {
      if (pi >= positionals.length) throw new Error(`missing positional: ${p.name}`);
      result[p.name] = positionals.slice(pi);
      pi = positionals.length;
    } else {
      if (pi >= positionals.length) throw new Error(`missing positional: ${p.name}`);
      result[p.name] = positionals[pi];
      pi += 1;
    }
  }
  return result;
}

function _printJson(value) {
  if (value === null || value === undefined) return;
  if (typeof value === 'object') {
    process.stdout.write(JSON.stringify(value, null, 2) + '\n');
  } else {
    process.stdout.write(String(value) + '\n');
  }
}

const COMMON_FILTERS = {
  '--resource-type': { dest: 'resourceTypeFilter', nargs: '+' },
  '--category':      { dest: 'categoryFilter',     nargs: '+' },
  '--canonical-only':    { dest: 'canonicalOnly', const: true },
  '--no-canonical-only': { dest: 'canonicalOnly', const: false },
  '--no-compact': { dest: 'compact', const: false },
  '--width-min':  { dest: 'widthMin',  type: 'int' },
  '--width-max':  { dest: 'widthMax',  type: 'int' },
  '--height-min': { dest: 'heightMin', type: 'int' },
  '--height-max': { dest: 'heightMax', type: 'int' },
  '--length-min': { dest: 'lengthMin', type: 'float' },
  '--length-max': { dest: 'lengthMax', type: 'float' },
};

const CLI_USAGE = `\
MSW Resource Search API CLI

Usage:
  node msw_resource_api.cjs <command> [args]

Commands:
  search <query> [--resource-type ...] [--category ...] [--topK N] [--offset N]
                 [--canonical-only|--no-canonical-only] [--width-min N] ...
                 [--no-compact]
  search-avatar <query> [--topK N] [--offset N] [--category ...] [--no-compact]
  similar <ruid> [--topK N] [--resource-type ...] [--category ...] [--no-compact]
  get <ruid>
  batch <id1> <id2> ...
  tags <ruid>
  list [--resource-type ...] [--category ...] [--limit N] [--offset CURSOR] ...
  random [--resource-type ...] [--category ...] [--count N] ...
  packs <ruid> [--limit N] [--offset CURSOR] [--no-compact]
  avatars [--no-canonical-only]
  avatar-defaults
`;

const CLI_HANDLERS = {
  search: async (argv) => {
    const a = _parseArgs(argv, {
      positional: [{ name: 'query' }],
      options: {
        ...COMMON_FILTERS,
        '--topK':   { dest: 'topK',   type: 'int', default: DEFAULT_LIMIT },
        '--offset': { dest: 'offset', type: 'int', default: 0 },
      },
    });
    return searchResources(a.query, {
      resourceTypeFilter: a.resourceTypeFilter,
      categoryFilter: a.categoryFilter,
      topK: a.topK, offset: a.offset,
      canonicalOnly: a.canonicalOnly,
      widthMin: a.widthMin, widthMax: a.widthMax,
      heightMin: a.heightMin, heightMax: a.heightMax,
      lengthMin: a.lengthMin, lengthMax: a.lengthMax,
      compact: a.compact !== false,
    });
  },
  'search-avatar': async (argv) => {
    const a = _parseArgs(argv, {
      positional: [{ name: 'query' }],
      options: {
        '--category':          { dest: 'categoryFilter', nargs: '+' },
        '--canonical-only':    { dest: 'canonicalOnly', const: true },
        '--no-canonical-only': { dest: 'canonicalOnly', const: false },
        '--no-compact':        { dest: 'compact', const: false },
        '--topK':   { dest: 'topK',   type: 'int', default: DEFAULT_LIMIT },
        '--offset': { dest: 'offset', type: 'int', default: 0 },
      },
    });
    return searchAvatarItems(a.query, {
      topK: a.topK, offset: a.offset,
      categoryFilter: a.categoryFilter,
      canonicalOnly: a.canonicalOnly,
      compact: a.compact !== false,
    });
  },
  similar: async (argv) => {
    const a = _parseArgs(argv, {
      positional: [{ name: 'ruid' }],
      options: {
        '--resource-type':     { dest: 'resourceTypeFilter', nargs: '+' },
        '--category':          { dest: 'categoryFilter',     nargs: '+' },
        '--canonical-only':    { dest: 'canonicalOnly', const: true },
        '--no-canonical-only': { dest: 'canonicalOnly', const: false },
        '--no-compact':        { dest: 'compact', const: false },
        '--topK': { dest: 'topK', type: 'int', default: DEFAULT_LIMIT },
      },
    });
    return findSimilarResources(a.ruid, {
      topK: a.topK,
      resourceTypeFilter: a.resourceTypeFilter,
      categoryFilter: a.categoryFilter,
      canonicalOnly: a.canonicalOnly,
      compact: a.compact !== false,
    });
  },
  get: async (argv) => {
    const a = _parseArgs(argv, { positional: [{ name: 'ruid' }] });
    return getResource(a.ruid);
  },
  batch: async (argv) => {
    const a = _parseArgs(argv, { positional: [{ name: 'ids', nargs: '+' }] });
    return getResourcesBatch(a.ids);
  },
  tags: async (argv) => {
    const a = _parseArgs(argv, { positional: [{ name: 'ruid' }] });
    return getResourceTags(a.ruid);
  },
  list: async (argv) => {
    const a = _parseArgs(argv, {
      options: {
        ...COMMON_FILTERS,
        '--limit':  { dest: 'limit', type: 'int', default: DEFAULT_LIMIT },
        '--offset': { dest: 'offset' }, // string cursor
      },
    });
    return listResources({
      resourceTypeFilter: a.resourceTypeFilter,
      categoryFilter: a.categoryFilter,
      limit: a.limit, offset: a.offset,
      canonicalOnly: a.canonicalOnly,
      widthMin: a.widthMin, widthMax: a.widthMax,
      heightMin: a.heightMin, heightMax: a.heightMax,
      lengthMin: a.lengthMin, lengthMax: a.lengthMax,
      compact: a.compact !== false,
    });
  },
  random: async (argv) => {
    const a = _parseArgs(argv, {
      options: {
        ...COMMON_FILTERS,
        '--count': { dest: 'count', type: 'int', default: DEFAULT_LIMIT },
      },
    });
    return randomResources({
      resourceTypeFilter: a.resourceTypeFilter,
      categoryFilter: a.categoryFilter,
      count: a.count,
      canonicalOnly: a.canonicalOnly,
      widthMin: a.widthMin, widthMax: a.widthMax,
      heightMin: a.heightMin, heightMax: a.heightMax,
      lengthMin: a.lengthMin, lengthMax: a.lengthMax,
      compact: a.compact !== false,
    });
  },
  packs: async (argv) => {
    const a = _parseArgs(argv, {
      positional: [{ name: 'ruid' }],
      options: {
        '--limit':       { dest: 'limit', type: 'int', default: DEFAULT_LIMIT },
        '--offset':      { dest: 'offset' },
        '--no-compact':  { dest: 'compact', const: false },
      },
    });
    return findPacksContaining(a.ruid, {
      limit: a.limit, offset: a.offset,
      compact: a.compact !== false,
    });
  },
  avatars: async (argv) => {
    const a = _parseArgs(argv, {
      options: { '--no-canonical-only': { dest: 'canonicalOnly', const: false } },
    });
    return listAvatars({ canonicalOnly: a.canonicalOnly !== false });
  },
  'avatar-defaults': async () => getAvatarDefaults(),
};

async function main(argv = process.argv.slice(2)) {
  if (argv.length === 0 || argv[0] === '-h' || argv[0] === '--help') {
    process.stdout.write(CLI_USAGE);
    return 0;
  }
  const [cmd, ...rest] = argv;
  const handler = CLI_HANDLERS[cmd];
  if (!handler) {
    process.stderr.write(`unknown command: ${cmd}\n\n${CLI_USAGE}`);
    return 2;
  }
  try {
    const value = await handler(rest);
    _printJson(value);
    return 0;
  } catch (err) {
    if (err instanceof MswApiError) {
      process.stderr.write(`[msw-api error] ${err.message}\n`);
      return 2;
    }
    process.stderr.write(`[error] ${err && err.message ? err.message : String(err)}\n`);
    return 2;
  }
}

module.exports = {
  BASE_URL,
  DEFAULT_TIMEOUT_MS,
  DEFAULT_LIMIT,
  MswApiError,
  searchResources,
  searchAvatarItems,
  findSimilarResources,
  getResource,
  getResourcesBatch,
  getResourceTags,
  listResources,
  randomResources,
  findPacksContaining,
  listAvatars,
  getAvatarDefaults,
  main,
};

if (require.main === module) {
  main().then((code) => process.exit(code));
}
