#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const CONTENT_TYPE = "x-mod/collisiongroupset";
const ENTRY_KEY = "collisiongroupset://unique";
const MAX_USER_DEFINED_GROUPS = 15;

const PROTECTED_NAMES = new Set(["Default", "TriggerBox", "HitBox", "Interaction", "Portal", "Climbable"]);
const PROTECTED_IDS = new Set(["MOD@TriggerBox", "MOD@HitBox", "MOD@Interaction", "MOD@Portal", "MOD@Climbable"]);

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function readJsonFile(filepath, label) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch (err) {
    if (err && err.code === "ENOENT") throw new Error(`${label} not found: ${filepath}`);
    throw new Error(`Invalid JSON in ${label} ${filepath}: ${err.message}`);
  }
}

function randomHexId() {
  return crypto.randomUUID().replace(/-/g, "");
}

function normalizeName(name) {
  if (name == null) throw new TypeError("Collision group name must not be null");
  const normalized = String(name).trim();
  if (!normalized) throw new Error("Collision group name must not be empty");
  return normalized;
}

function normalizeId(id) {
  if (id == null) throw new TypeError("Collision group id must not be null");
  const normalized = String(id).trim();
  if (!normalized) throw new Error("Collision group id must not be empty");
  return normalized;
}

function isValidGroupId(id) {
  return /^MOD@[A-Za-z0-9_]+$/.test(id) || /^[0-9a-f]{32}$/i.test(id);
}

function formatFinding(finding) {
  return `${finding.rule}: ${finding.message}`;
}

class CollisionGroupSetBuilder {
  constructor(data, options = {}) {
    this.data = clone(data);
    this._sourcePath = options.sourcePath || null;
    this._originalGroups = this._groups().map((group) => clone(group));
    this._warned = new Set();
  }

  static read(filepath) {
    return new CollisionGroupSetBuilder(readJsonFile(filepath, "collisiongroupset file"), { sourcePath: filepath });
  }

  static load(filepath) {
    return CollisionGroupSetBuilder.read(filepath);
  }

  static snapshot(filepath) {
    return CollisionGroupSetBuilder.read(filepath).snapshot();
  }

  _json() {
    const json = this.data && this.data.ContentProto && this.data.ContentProto.Json;
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      throw new Error("Invalid collisiongroupset: missing ContentProto.Json");
    }
    return json;
  }

  _groups() {
    const groups = this._json().Groups;
    if (!Array.isArray(groups)) throw new Error("Invalid collisiongroupset: ContentProto.Json.Groups must be an array");
    return groups;
  }

  _matrix() {
    const matrix = this._json().Matrix;
    if (!matrix || typeof matrix !== "object" || Array.isArray(matrix)) {
      throw new Error("Invalid collisiongroupset: ContentProto.Json.Matrix must be an object");
    }
    return matrix;
  }

  _warnOnce(rule, message, key = message) {
    const warnKey = `${rule}:${key}`;
    if (this._warned.has(warnKey)) return;
    this._warned.add(warnKey);
    console.warn(`[CollisionGroupSetBuilder] WARNING ${rule}: ${message}`);
  }

  _findGroup(nameOrId) {
    const key = String(nameOrId);
    return this._groups().find((group) => group && (group.Id === key || group.Name === key)) || null;
  }

  _resolveId(nameOrId) {
    const group = this._findGroup(nameOrId);
    if (!group) throw new Error(`Collision group not found: ${nameOrId}`);
    return group.Id;
  }

  _resolveName(id) {
    const group = this._findGroup(id);
    return group ? group.Name : id;
  }

  _ensureRow(id) {
    const matrix = this._matrix();
    if (!Array.isArray(matrix[id])) matrix[id] = [];
    return matrix[id];
  }

  _removeFromRows(id) {
    const matrix = this._matrix();
    for (const [rowId, row] of Object.entries(matrix)) {
      if (!Array.isArray(row)) continue;
      matrix[rowId] = row.filter((targetId) => targetId !== id);
    }
  }

  _dedupeMatrix() {
    const matrix = this._matrix();
    for (const [rowId, row] of Object.entries(matrix)) {
      matrix[rowId] = Array.isArray(row) ? Array.from(new Set(row.map(String))) : [];
    }
  }

  listGroups() {
    return this._groups().map((group) => clone(group));
  }

  listCollisions(nameOrId) {
    const id = this._resolveId(nameOrId);
    return this._ensureRow(id).map((targetId) => ({
      id: targetId,
      name: this._resolveName(targetId),
    }));
  }

  hasGroup(nameOrId) {
    return Boolean(this._findGroup(nameOrId));
  }

  getGroup(nameOrId) {
    const group = this._findGroup(nameOrId);
    return group ? clone(group) : null;
  }

  getGroupId(nameOrId) {
    const group = this._findGroup(nameOrId);
    return group ? group.Id : null;
  }

  addGroup(name, options = {}) {
    const groupName = normalizeName(name);
    const requestedId = normalizeId(options.id || options.groupId || randomHexId());
    const id = requestedId.toLowerCase().startsWith("mod@") ? requestedId : requestedId.toLowerCase();
    const existingByName = this._findGroup(groupName);
    if (existingByName) {
      this._warnOnce("C020", `Group name '${groupName}' already exists; addGroup() left the existing group unchanged.`, groupName);
      return this;
    }
    const existingById = this._findGroup(id);
    if (existingById) {
      this._warnOnce("C021", `Group id '${id}' already exists on '${existingById.Name}'; addGroup() skipped '${groupName}'.`, id);
      return this;
    }
    if (PROTECTED_NAMES.has(groupName) || PROTECTED_IDS.has(id)) {
      this._warnOnce("C030", `Group '${groupName}' uses a protected built-in name or id; avoid redefining built-in collision groups.`, groupName);
    }
    this._groups().push({ Id: id, Name: groupName });
    this._ensureRow(id);
    return this;
  }

  removeGroup(nameOrId) {
    const group = this._findGroup(nameOrId);
    if (!group) throw new Error(`Collision group not found: ${nameOrId}`);
    if (PROTECTED_NAMES.has(group.Name) || PROTECTED_IDS.has(group.Id)) {
      this._warnOnce("C031", `Removing protected group '${group.Name}' can break native collision behavior.`, group.Id);
    }
    const groups = this._groups();
    const index = groups.findIndex((candidate) => candidate && candidate.Id === group.Id);
    if (index >= 0) groups.splice(index, 1);
    delete this._matrix()[group.Id];
    this._removeFromRows(group.Id);
    return this;
  }

  renameGroup(nameOrId, newName) {
    const group = this._findGroup(nameOrId);
    if (!group) throw new Error(`Collision group not found: ${nameOrId}`);
    const groupName = normalizeName(newName);
    const existing = this._findGroup(groupName);
    if (existing && existing.Id !== group.Id) {
      this._warnOnce("C022", `Group name '${groupName}' already exists; renameGroup() left '${group.Name}' unchanged.`, groupName);
      return this;
    }
    if (PROTECTED_NAMES.has(group.Name) || PROTECTED_IDS.has(group.Id)) {
      this._warnOnce("C032", `Renaming protected group '${group.Name}' can break scripts that use CollisionGroups.${group.Name}.`, group.Id);
    }
    group.Name = groupName;
    return this;
  }

  setGroupId(nameOrId, newId) {
    const group = this._findGroup(nameOrId);
    if (!group) throw new Error(`Collision group not found: ${nameOrId}`);
    const id = normalizeId(newId);
    const existing = this._findGroup(id);
    if (existing && existing.Name !== group.Name) {
      this._warnOnce("C023", `Group id '${id}' already exists on '${existing.Name}'; setGroupId() left '${group.Name}' unchanged.`, id);
      return this;
    }
    if (PROTECTED_NAMES.has(group.Name) || PROTECTED_IDS.has(group.Id)) {
      this._warnOnce("C033", `Changing id for protected group '${group.Name}' can break model CollisionGroup values.`, group.Id);
    }
    const oldId = group.Id;
    group.Id = id;
    const matrix = this._matrix();
    if (Object.prototype.hasOwnProperty.call(matrix, oldId)) {
      matrix[id] = matrix[oldId];
      delete matrix[oldId];
    }
    for (const [rowId, row] of Object.entries(matrix)) {
      if (Array.isArray(row)) matrix[rowId] = row.map((targetId) => (targetId === oldId ? id : targetId));
    }
    this._ensureRow(id);
    return this;
  }

  setCollidable(groupA, groupB, enabled = true, options = {}) {
    const idA = this._resolveId(groupA);
    const idB = this._resolveId(groupB);
    const symmetric = options.symmetric !== false;
    this._setDirected(idA, idB, enabled);
    if (symmetric && idA !== idB) this._setDirected(idB, idA, enabled);
    return this;
  }

  _setDirected(fromId, toId, enabled) {
    const row = this._ensureRow(fromId);
    const hasTarget = row.includes(toId);
    if (enabled && !hasTarget) row.push(toId);
    if (!enabled && hasTarget) this._matrix()[fromId] = row.filter((targetId) => targetId !== toId);
  }

  setCollidesWith(group, targets, options = {}) {
    const id = this._resolveId(group);
    const targetIds = (Array.isArray(targets) ? targets : [targets]).map((target) => this._resolveId(target));
    this._matrix()[id] = Array.from(new Set(targetIds));
    if (options.symmetric) {
      const allIds = this._groups().map((candidate) => candidate.Id);
      for (const otherId of allIds) {
        if (otherId === id) continue;
        this._setDirected(otherId, id, targetIds.includes(otherId));
      }
    }
    return this;
  }

  build() {
    this.data.EntryKey = this.data.EntryKey || ENTRY_KEY;
    this.data.ContentType = this.data.ContentType || CONTENT_TYPE;
    this.data.ContentProto = this.data.ContentProto || {};
    this.data.ContentProto.Use = "Json";
    this.data.ContentProto.Json = this._json();
    this._dedupeMatrix();
    return this.data;
  }

  snapshot() {
    const groups = this._groups();
    const matrix = this._matrix();
    return {
      entryKey: this.data.EntryKey,
      contentType: this.data.ContentType,
      groups: groups.map((group) => ({
        id: group.Id,
        name: group.Name,
        collidesWith: (Array.isArray(matrix[group.Id]) ? matrix[group.Id] : []).map((targetId) => this._resolveName(targetId)),
      })),
      findings: this.validate(),
    };
  }

  validate() {
    const findings = [];
    let json;
    try {
      json = this._json();
    } catch (err) {
      return [{ severity: "error", rule: "C000", message: err.message }];
    }
    if (this.data.EntryKey && this.data.EntryKey !== ENTRY_KEY) {
      findings.push({ severity: "warn", rule: "C001", message: `EntryKey is '${this.data.EntryKey}', expected '${ENTRY_KEY}'.` });
    }
    if (this.data.ContentType && this.data.ContentType !== CONTENT_TYPE) {
      findings.push({ severity: "warn", rule: "C002", message: `ContentType is '${this.data.ContentType}', expected '${CONTENT_TYPE}'.` });
    }
    if (!Array.isArray(json.Groups)) {
      findings.push({ severity: "error", rule: "C010", message: "ContentProto.Json.Groups must be an array." });
      return findings;
    }
    if (!json.Matrix || typeof json.Matrix !== "object" || Array.isArray(json.Matrix)) {
      findings.push({ severity: "error", rule: "C011", message: "ContentProto.Json.Matrix must be an object." });
      return findings;
    }

    const names = new Map();
    const ids = new Map();
    let userDefinedGroupCount = 0;
    for (const group of json.Groups) {
      if (!group || typeof group !== "object") {
        findings.push({ severity: "error", rule: "C012", message: "Each group must be an object." });
        continue;
      }
      if (!group.Name) findings.push({ severity: "error", rule: "C013", message: `Group '${group.Id || "<missing id>"}' has no Name.` });
      if (!group.Id) findings.push({ severity: "error", rule: "C014", message: `Group '${group.Name || "<missing name>"}' has no Id.` });
      if (group.Id && !isValidGroupId(group.Id)) {
        findings.push({ severity: "warn", rule: "C015", message: `Group '${group.Name}' id '${group.Id}' is not MOD@Name or 32-character hex.` });
      }
      if (group.Name) {
        if (names.has(group.Name)) findings.push({ severity: "warn", rule: "C020", message: `Duplicate group name '${group.Name}'.` });
        names.set(group.Name, group);
      }
      if (group.Id) {
        if (ids.has(group.Id)) findings.push({ severity: "error", rule: "C021", message: `Duplicate group id '${group.Id}'.` });
        ids.set(group.Id, group);
      }
      if (group.Id && group.Name && group.Name !== "Default" && !group.Id.startsWith("MOD@")) {
        userDefinedGroupCount++;
      }
    }
    if (userDefinedGroupCount > MAX_USER_DEFINED_GROUPS) {
      findings.push({
        severity: "error",
        rule: "C016",
        message: `Collision group set has ${userDefinedGroupCount} user-defined groups; the engine supports at most ${MAX_USER_DEFINED_GROUPS}.`,
      });
    }

    for (const original of this._originalGroups) {
      if (!original || (!PROTECTED_NAMES.has(original.Name) && !PROTECTED_IDS.has(original.Id))) continue;
      const byId = ids.get(original.Id);
      const byName = names.get(original.Name);
      if (!byId && !byName) {
        findings.push({ severity: "warn", rule: "C030", message: `Protected group '${original.Name}' was removed.` });
      } else if (byId && byId.Name !== original.Name) {
        findings.push({ severity: "warn", rule: "C031", message: `Protected group id '${original.Id}' was renamed from '${original.Name}' to '${byId.Name}'.` });
      } else if (byName && byName.Id !== original.Id) {
        findings.push({ severity: "warn", rule: "C032", message: `Protected group '${original.Name}' id changed from '${original.Id}' to '${byName.Id}'.` });
      }
    }

    for (const group of json.Groups) {
      if (!group || !group.Id) continue;
      if (!Object.prototype.hasOwnProperty.call(json.Matrix, group.Id)) {
        findings.push({ severity: "error", rule: "C040", message: `Matrix row missing for group '${group.Name}' (${group.Id}).` });
      }
    }
    for (const [rowId, targets] of Object.entries(json.Matrix)) {
      if (!ids.has(rowId)) {
        findings.push({ severity: "warn", rule: "C041", message: `Matrix row '${rowId}' does not match any group id.` });
      }
      if (!Array.isArray(targets)) {
        findings.push({ severity: "error", rule: "C042", message: `Matrix row '${rowId}' must be an array.` });
        continue;
      }
      const seen = new Set();
      for (const targetId of targets) {
        if (seen.has(targetId)) findings.push({ severity: "warn", rule: "C043", message: `Matrix row '${rowId}' contains duplicate target '${targetId}'.` });
        seen.add(targetId);
        if (!ids.has(targetId)) {
          findings.push({ severity: "warn", rule: "C044", message: `Matrix row '${rowId}' references unknown group id '${targetId}'.` });
          continue;
        }
        const reverse = json.Matrix[targetId];
        if (Array.isArray(reverse) && !reverse.includes(rowId)) {
          findings.push({ severity: "warn", rule: "C045", message: `Collision '${this._resolveName(rowId)}' -> '${this._resolveName(targetId)}' is one-way.` });
        }
      }
    }
    return findings;
  }

  write(filepath) {
    const findings = this.validate();
    for (const warning of findings.filter((finding) => finding.severity === "warn")) {
      console.warn(`[CollisionGroupSetBuilder] WARNING ${warning.rule}: ${warning.message}`);
    }
    const errors = findings.filter((finding) => finding.severity === "error");
    if (errors.length) throw new Error(`CollisionGroupSet validation failed: ${errors.map(formatFinding).join("; ")}`);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, `${JSON.stringify(this.build(), null, 2)}\n`, "utf8");
    console.log(`Written collision group set (${this._groups().length} groups) to ${filepath}`);
    return this;
  }
}

module.exports = {
  CollisionGroupSetBuilder,
  CONTENT_TYPE,
  ENTRY_KEY,
  MAX_USER_DEFINED_GROUPS,
};
