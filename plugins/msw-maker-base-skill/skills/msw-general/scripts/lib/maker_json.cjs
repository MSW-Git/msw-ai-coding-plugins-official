"use strict";

const fs = require("fs");
const path = require("path");

// Serializes builder output in the Maker's own save format: 2-space indented JSON,
// CRLF line endings, no trailing newline, and float-typed values written the way the
// Maker writes them (`1.0`, `0.9607843`, `-4.46236E-05`). Which numbers are floats is
// decided from the workspace's Environment/NativeScripts property declarations
// (`property <Type> <Name>`); a number no declaration covers keeps its natural notation.

const FLOAT_TYPES = new Set(["float", "single"]);
const DOUBLE_TYPES = new Set(["number", "double"]);
const INT_TYPES = new Set(["int32", "integer", "int64", "long", "short", "byte", "sbyte", "uint32", "uint64", "ushort", "int", "uint"]);
const VECTOR_KEYS = new Set(["x", "y", "z", "w", "r", "g", "b", "a"]);
const PROPERTY_LINE = /^\s*(?:readonly\s+)?property\s+(.+?)\s+([A-Za-z_]\w*)\s*(?:=.*)?$/;
const GENERIC_TYPE = /^(\w+)<(.+)>$/;
const NATIVE_PREFIX = "MOD.Core.";
const INDENT = "  ";
const EOL = "\r\n";


function formatGeneral(value, precision) {
  if (value === 0) return "0";
  const [mantissa, exponentText] = value.toExponential(precision - 1).split("e");
  const exponent = Number(exponentText);
  const negative = mantissa.startsWith("-");
  const digits = mantissa.replace("-", "").replace(".", "").replace(/0+$/, "") || "0";
  let text;
  if (exponent > -5 && exponent < precision) {
    if (exponent >= 0) {
      const whole = digits.slice(0, exponent + 1).padEnd(exponent + 1, "0");
      const fraction = digits.slice(exponent + 1);
      text = fraction ? `${whole}.${fraction}` : whole;
    } else {
      text = `0.${"0".repeat(-exponent - 1)}${digits}`;
    }
  } else {
    const fraction = digits.slice(1);
    const sign = exponent < 0 ? "-" : "+";
    text = `${digits[0]}${fraction ? `.${fraction}` : ""}E${sign}${String(Math.abs(exponent)).padStart(2, "0")}`;
  }
  return negative ? `-${text}` : text;
}

function withDecimal(text) {
  return /[.E]/.test(text) ? text : `${text}.0`;
}

function formatSingle(value) {
  const single = Math.fround(value);
  if (!Number.isFinite(single)) return "null";
  let text = formatGeneral(single, 7);
  if (Math.fround(Number(text)) !== single) text = formatGeneral(single, 9);
  return withDecimal(text);
}

function formatDouble(value) {
  let text = formatGeneral(value, 15);
  if (Number(text) !== value) text = formatGeneral(value, 17);
  return withDecimal(text);
}

function formatNumber(value, kind) {
  if (!Number.isFinite(value)) return "null";
  if (kind === "float") return formatSingle(value);
  if (kind === "double") return formatDouble(value);
  return JSON.stringify(value);
}

function hintKey(componentType, chain, key) {
  const steps = chain.map((step) => (typeof step === "number" ? "[]" : step));
  return `${componentType || ""}|${steps.join("/")}|${key}`;
}

function isSerializable(value) {
  return value !== undefined && typeof value !== "function" && typeof value !== "symbol";
}

// `scope` is the classification context of `value`'s siblings: the nearest enclosing
// component type and the key chain from that component down to `owner`. An object that
// carries `@type` starts a new scope for its own children.
function writeValue(out, value, depth, scope, state, owner, key) {
  if (value === null || !isSerializable(value)) {
    out.push("null");
    return;
  }
  if (typeof value === "number") {
    out.push(formatNumber(value, numberKind(value, key, owner, scope, state)));
    return;
  }
  if (typeof value !== "object") {
    out.push(JSON.stringify(value));
    return;
  }
  if (typeof value.toJSON === "function") {
    writeValue(out, value.toJSON(), depth, scope, state, owner, key);
    return;
  }
  const inner = INDENT.repeat(depth + 1);
  const outer = INDENT.repeat(depth);
  const childScope = owner === undefined ? scope : { componentType: scope.componentType, chain: scope.chain.concat(key) };
  if (Array.isArray(value)) {
    if (value.length === 0) {
      out.push("[]");
      return;
    }
    out.push("[", EOL);
    value.forEach((item, index) => {
      if (index > 0) out.push(",", EOL);
      out.push(inner);
      writeValue(out, item, depth + 1, childScope, state, value, index);
    });
    out.push(EOL, outer, "]");
    return;
  }
  const keys = Object.keys(value).filter((name) => isSerializable(value[name]));
  if (keys.length === 0) {
    out.push("{}");
    return;
  }
  const ownScope = typeof value["@type"] === "string" ? { componentType: value["@type"], chain: [] } : childScope;
  out.push("{", EOL);
  keys.forEach((name, index) => {
    if (index > 0) out.push(",", EOL);
    out.push(inner, JSON.stringify(name), ": ");
    writeValue(out, value[name], depth + 1, ownScope, state, value, name);
  });
  out.push(EOL, outer, "}");
}

function numberKind(value, key, owner, scope, state) {
  if (owner === undefined) return undefined;
  let loaded = state.hints ? state.hints.get(hintKey(scope.componentType, scope.chain, key)) : undefined;
  if (loaded === "float" && Number(formatSingle(value)) !== value) loaded = "double";
  return state.classify(key, owner, scope, loaded) || loaded;
}

function stringify(value, classify, hints) {
  const out = [];
  const state = { classify: typeof classify === "function" ? classify : () => undefined, hints: hints || null };
  writeValue(out, value, 0, { componentType: null, chain: [] }, state, undefined, undefined);
  return out.join("");
}

function parse(text) {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return { value: JSON.parse(source), hints: collectNotationHints(source) };
}

// Records the notation the source wrote each number in ("float", "double", or "int"),
// keyed the same way the serializer classifies them, so a loaded file re-serializes
// unchanged even where no type declaration covers the key (script component properties,
// for example). A decimal literal that single precision cannot reproduce counts as double;
// a key the source wrote several ways takes the widest of them.
function collectNotationHints(text) {
  const hints = new Map();
  let pos = 0;
  const skipSpace = () => {
    while (pos < text.length && " \t\r\n".includes(text[pos])) pos++;
  };
  const readString = () => {
    let end = pos + 1;
    while (text[end] !== '"') end += text[end] === "\\" ? 2 : 1;
    const value = JSON.parse(text.slice(pos, end + 1));
    pos = end + 1;
    return value;
  };
  const readValue = (componentType, chain, key) => {
    skipSpace();
    const ch = text[pos];
    if (ch === "{") {
      pos++;
      skipSpace();
      let type = componentType;
      let scope = key === undefined ? chain : chain.concat(key);
      if (text[pos] === "}") {
        pos++;
        return;
      }
      for (;;) {
        skipSpace();
        const name = readString();
        skipSpace();
        pos++;
        skipSpace();
        if (name === "@type" && text[pos] === '"') {
          type = readString();
          scope = [];
        } else {
          readValue(type, scope, name);
        }
        skipSpace();
        if (text[pos] === ",") {
          pos++;
          continue;
        }
        pos++;
        return;
      }
    }
    if (ch === "[") {
      pos++;
      skipSpace();
      const scope = key === undefined ? chain : chain.concat(key);
      if (text[pos] === "]") {
        pos++;
        return;
      }
      for (let index = 0; ; index++) {
        readValue(componentType, scope, index);
        skipSpace();
        if (text[pos] === ",") {
          pos++;
          continue;
        }
        pos++;
        return;
      }
    }
    if (ch === '"') {
      readString();
      return;
    }
    const token = /^-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?|^[a-z]+/.exec(text.slice(pos, pos + 64))[0];
    pos += token.length;
    if (!/^-?\d/.test(token)) return;
    const id = hintKey(componentType, chain, key);
    if (!/[.eE]/.test(token)) {
      if (!hints.has(id)) hints.set(id, "int");
    } else if (formatSingle(Number(token)) !== token) hints.set(id, "double");
    else if (hints.get(id) !== "double") hints.set(id, "float");
  };
  readValue(null, [], undefined);
  return hints;
}

function nativeTypeIndex(workspaceRoot) {
  const base = path.join(workspaceRoot, "Environment", "NativeScripts");
  const cache = new Map();
  const load = (dir, name) => {
    const cacheKey = `${dir}/${name}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);
    let props = null;
    try {
      props = new Map();
      for (const line of fs.readFileSync(path.join(base, dir, `${name}.d.mlua`), "utf8").split(/\r?\n/)) {
        const match = PROPERTY_LINE.exec(line);
        if (match) props.set(match[2], match[1]);
      }
    } catch (_) {
      props = null;
    }
    cache.set(cacheKey, props);
    return props;
  };
  return {
    props: (typeName) => load("Component", typeName) || load("Misc", typeName),
    declares: (componentType) => componentType.startsWith(NATIVE_PREFIX) && load("Component", componentType.slice(NATIVE_PREFIX.length)) !== null,
    isEnum: (typeName) => fs.existsSync(path.join(base, "Enum", `${typeName}.d.mlua`)),
  };
}

function splitTypeArguments(text) {
  const args = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "<") depth++;
    else if (text[i] === ">") depth--;
    else if (text[i] === "," && depth === 0) {
      args.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(text.slice(start).trim());
  return args;
}

function stepInto(index, typeName, step) {
  const generic = GENERIC_TYPE.exec(typeName);
  if (generic) {
    const args = splitTypeArguments(generic[2]);
    if (/List$/.test(generic[1])) return args[0];
    if (/Dictionary$/.test(generic[1])) return args[1];
    return undefined;
  }
  const props = index.props(typeName);
  return props ? props.get(String(step)) : undefined;
}

function leafKind(index, typeName) {
  if (FLOAT_TYPES.has(typeName)) return "float";
  if (DOUBLE_TYPES.has(typeName)) return "double";
  if (INT_TYPES.has(typeName) || index.isEnum(typeName)) return "int";
  return undefined;
}

function declaredKind(index, componentType, chain, key) {
  if (!componentType || !componentType.startsWith(NATIVE_PREFIX)) return undefined;
  let typeName = componentType.slice(NATIVE_PREFIX.length);
  for (const step of chain.concat(key)) {
    typeName = stepInto(index, typeName, step);
    if (!typeName) return undefined;
  }
  return leafKind(index, typeName);
}

function isVectorShape(owner) {
  return Object.keys(owner).every((key) => VECTOR_KEYS.has(key) || key === "$type");
}

// Builds the number classifier used by `stringify`: `specific(key, owner, ctx)` runs first
// for file-format rules the type declarations cannot express, then the workspace's native
// property types, then the notation the loaded file used (`loaded`), then vector/color
// sub-keys.
function classifier(workspaceRoot, specific) {
  const index = workspaceRoot ? nativeTypeIndex(workspaceRoot) : null;
  return (key, owner, ctx, loaded) => {
    if (specific) {
      const kind = specific(key, owner, ctx);
      if (kind) return kind;
    }
    if (index && ctx.componentType && index.declares(ctx.componentType)) {
      const kind = declaredKind(index, ctx.componentType, ctx.chain, key);
      if (kind) return kind;
    }
    if (loaded) return loaded;
    if (VECTOR_KEYS.has(key) && isVectorShape(owner)) return "float";
    return undefined;
  };
}

module.exports = { stringify, parse, classifier, formatSingle, formatDouble };
