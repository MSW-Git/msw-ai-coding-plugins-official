// Project-agnostic BehaviourTree spec generator.
// Scans a project for BT codeblocks (.codeblock with paired .mlua extending
// ActionNode/DecoratorNode/CompositeNode), parses property declarations, and emits a Markdown
// spec consumed by the msw-behaviourtree-creator skill.
//
// Output: <ProjectRoot>/.behaviourDocs/bt-spec.md (created if missing).
//
// Usage:
//   node build-spec.cjs
//   node build-spec.cjs --projectRoot "C:/path/to/project" --outputPath "./bt-spec.md"
//   node build-spec.cjs --coreVersion 1.2.3.4

'use strict';

const fs = require('fs');
const path = require('path');

// --- Arg parsing -------------------------------------------------------------
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith('-')) continue;
        const key = a.replace(/^-+/, '');
        const next = argv[i + 1];
        if (next !== undefined && !next.startsWith('-')) {
            out[key.toLowerCase()] = next;
            i++;
        } else {
            out[key.toLowerCase()] = true;
        }
    }
    return out;
}

const args = parseArgs(process.argv.slice(2));
let projectRoot = args.projectroot;
let outputPath = args.outputpath;
let coreVersion = args.coreversion;

if (!projectRoot) {
    projectRoot = process.cwd();
}
projectRoot = fs.realpathSync(projectRoot).replace(/[\\/]+$/, '');

if (!outputPath) {
    const docsDir = path.join(projectRoot, '.behaviourDocs');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    outputPath = path.join(docsDir, 'bt-spec.md');
}

// --- Read CoreVersion from project config -----------------------------------
if (!coreVersion) {
    const configPath = path.join(projectRoot, 'Environment', 'config');
    if (!fs.existsSync(configPath)) {
        throw new Error(`CoreVersion config not found at ${configPath}. Pass --coreVersion explicitly.`);
    }
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!cfg.CoreVersion) {
        throw new Error(`CoreVersion field missing in ${configPath}.`);
    }
    coreVersion = cfg.CoreVersion;
}

// --- mlua type -> propertyType.type / Blackboard Type.type / value-shape map -
// Order is preserved (Map keeps insertion order) so the output table matches the ps1 script.
const mluaTypeMap = new Map([
    ['bool',         { TypeStr: 'System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089', ValueShape: 'true / false' }],
    ['boolean',      { TypeStr: 'System.Boolean, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089', ValueShape: 'true / false' }],
    ['string',       { TypeStr: 'System.String, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089',  ValueShape: '"<string>"' }],
    ['integer',      { TypeStr: 'System.Int64, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089',   ValueShape: '<int>' }],
    ['number',       { TypeStr: 'System.Double, mscorlib, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b77a5c561934e089',  ValueShape: '<num> (use 3.0 not 3)' }],
    ['Vector2',      { TypeStr: `MOD.Core.MODVector2, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`, ValueShape: '{ "x": <num>, "y": <num> }' }],
    ['Vector3',      { TypeStr: `MOD.Core.MODVector3, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`, ValueShape: '{ "x": <num>, "y": <num>, "z": <num> }' }],
    ['Vector4',      { TypeStr: `MOD.Core.MODVector4, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`, ValueShape: '{ "x": <num>, "y": <num>, "z": <num>, "w": <num> }' }],
    ['Color',        { TypeStr: `MOD.Core.MODColor, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`,   ValueShape: '{ "r": <0..1>, "g": <0..1>, "b": <0..1>, "a": <0..1> }' }],
    ['Entity',       { TypeStr: `MOD.Core.MODEntity, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`,  ValueShape: '{ "tempEntityId": null, "IsRelative": false, "EntityId": "<entity-uuid>", "Version2": false }' }],
    ['Component',    { TypeStr: `MOD.Core.Component.MODComponent, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`, ValueShape: '{ "IsRelative": false, "ComponentId": "<entity-uuid>:<ComponentName>", "UseNested": false }' }],
    ['ComponentRef', { TypeStr: `MOD.Core.MODComponentRef, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`,        ValueShape: '{ "IsRelative": false, "ComponentId": "<entity-uuid>:<ComponentName>", "UseNested": false }' }],
    ['EntityRef',    { TypeStr: `MOD.Core.MODEntityRef, MOD.Core, Version=${coreVersion}, Culture=neutral, PublicKeyToken=null`, ValueShape: '(verify against an existing serialized example before use)' }],
]);

// --- mlua property parser -----------------------------------------------------
// Returns array of { Name, Type, Default }. Skips properties annotated with
// @HideFromInspector on a preceding line.
function getMluaProperties(mluaPath) {
    const result = [];
    if (!fs.existsSync(mluaPath)) return result;

    const text = fs.readFileSync(mluaPath, 'utf8');
    const lines = text.split(/\r?\n/);
    let pendingAnnotations = [];
    const propRe = /^property\s+(\w+)\s+(\w+)\s*(?:=\s*(.+?))?\s*$/;

    for (const raw of lines) {
        const line = raw.trim();
        if (line === '') continue;
        if (line.startsWith('@')) {
            pendingAnnotations.push(line);
            continue;
        }
        const m = line.match(propRe);
        if (m) {
            const hidden = pendingAnnotations.includes('@HideFromInspector');
            if (!hidden) {
                result.push({
                    Name: m[2],
                    Type: m[1],
                    Default: m[3] !== undefined ? m[3] : '',
                });
            }
            pendingAnnotations = [];
            continue;
        }
        if (!line.startsWith('--')) {
            pendingAnnotations = [];
        }
    }
    return result;
}

// --- Recursive file walker (avoids node_modules / .git churn) ----------------
function* walkCodeblocks(dir) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return;
    }
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name === 'node_modules' || e.name === '.git') continue;
            yield* walkCodeblocks(full);
        } else if (e.isFile() && e.name.toLowerCase().endsWith('.codeblock')) {
            yield full;
        }
    }
}

// --- Discover BT codeblocks ---------------------------------------------------
console.log(`Scanning ${projectRoot} for *.codeblock ...`);
const btNodes = [];
let nonBtCount = 0;
let failCount = 0;

const scriptActionRe    = /^\s*script\s+\w+\s+extends\s+ActionNode\b/m;
const scriptDecoratorRe = /^\s*script\s+\w+\s+extends\s+DecoratorNode\b/m;
const scriptCompositeRe = /^\s*script\s+\w+\s+extends\s+CompositeNode\b/m;

for (const fullPath of walkCodeblocks(projectRoot)) {
    try {
        const j = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const cp = j && j.ContentProto && j.ContentProto.Json;
        if (!cp) { nonBtCount++; continue; }

        const mluaPath = fullPath.replace(/\.codeblock$/i, '.mlua');
        const mluaExists = fs.existsSync(mluaPath);

        let kind = null;
        if (mluaExists) {
            const mluaText = fs.readFileSync(mluaPath, 'utf8');
            if      (scriptActionRe.test(mluaText))    kind = 'Action';
            else if (scriptDecoratorRe.test(mluaText)) kind = 'Decorator';
            else if (scriptCompositeRe.test(mluaText)) kind = 'Composite';
        }
        if (!kind) {
            const tgt = cp.Target;
            if      (tgt === 'MOD.Core.BTNodes.ActionNode')    kind = 'Action';
            else if (tgt === 'MOD.Core.BTNodes.DecoratorNode') kind = 'Decorator';
            else if (tgt === 'MOD.Core.BTNodes.CompositeNode') kind = 'Composite';
        }
        if (!kind) { nonBtCount++; continue; }

        const props = getMluaProperties(mluaPath);

        btNodes.push({
            Name:       cp.Name,
            Id:         cp.Id,
            Kind:       kind,
            BtNodeType: kind === 'Action' ? 0 : kind === 'Composite' ? 1 : 2,
            RelPath:    fullPath.substring(projectRoot.length).replace(/^[\\/]+/, ''),
            MluaExists: mluaExists,
            Properties: props,
        });
    } catch (err) {
        failCount++;
        console.warn(`Failed to parse ${fullPath}: ${err.message}`);
    }
}

const byName = (a, b) => (a.Name || '').localeCompare(b.Name || '');
const actions    = btNodes.filter(n => n.Kind === 'Action').sort(byName);
const decorators = btNodes.filter(n => n.Kind === 'Decorator').sort(byName);
const composites = btNodes.filter(n => n.Kind === 'Composite').sort(byName);

console.log(`Found ${actions.length} action nodes, ${decorators.length} decorator nodes, ${composites.length} custom composite nodes`);
console.log(`Non-BT codeblocks: ${nonBtCount}, parse failures: ${failCount}`);

if (actions.length === 0 && decorators.length === 0 && composites.length === 0) {
    console.warn('');
    console.warn('WARNING: zero Action, zero Decorator, and zero custom Composite nodes discovered.');
    console.warn('  - If the project genuinely has no BT codeblocks yet, create them in the Maker BehaviourTree editor first, then re-run this script.');
    console.warn('  - If you expected nodes here, the mlua-lsp environment may be rejecting `script <Name> extends ActionNode`/`extends DecoratorNode`/`extends CompositeNode` declarations. In that case, the .codeblock + .mlua pairs must be created through the Maker BT editor GUI (the agent cannot author them directly). Falling back to a code-driven AI pattern (@BTNode extends BTNode + AIComponent:CreateNode) is an alternative.');
    console.warn('');
}

// --- Emit markdown ------------------------------------------------------------
function pad2(n) { return String(n).padStart(2, '0'); }
function nowStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

const lines = [];
const push = (s = '') => lines.push(s);

push('# BehaviourTree Authoring Spec');
push();
push(`- **Project root**: \`${projectRoot}\``);
push(`- **Engine CoreVersion**: \`${coreVersion}\``);
push(`- **Generated**: ${nowStamp()}`);
push(`- **Discovered**: ${actions.length} action nodes, ${decorators.length} decorator nodes, ${composites.length} custom composite nodes`);
push();
push('> Compact catalog for tree construction. Custom-node UUIDs were read from real `.codeblock` files in this project -- never invent them.');
push();
push('---');
push();

// 1. Composites (built-in + discovered custom `extends CompositeNode`)
push('## 1. Composite nodes');
push();
push('| nodeName | definitionId | btNodeType |');
push('|---|---|---|');
push('| `SequenceNode` | `SequenceNode` | 1 |');
push('| `SelectorNode` | `SelectorNode` | 1 |');
push('| `ParallelNode` | `ParallelNode` | 1 |');
push();

if (composites.length > 0) {
    push('### Custom composite nodes (`extends CompositeNode`)');
    push();
    push('| Name | definitionId | btNodeType | Properties |');
    push('|---|---|---|---|');
    for (const n of composites) {
        push(`| \`${n.Name}\` | \`codeblock://${n.Id}\` | ${n.BtNodeType} | ${formatPropertyList(n)} |`);
    }
    push();
}

function formatPropertyList(node) {
    if (!node.MluaExists) return '(!) paired .mlua not found';
    if (node.Properties.length === 0) return '(none)';
    return node.Properties.map(p => `\`${p.Name}\``).join('<br>');
}

function emitNodeSection(title, list) {
    push(`## ${title}`);
    push();
    if (list.length === 0) { push('_(none discovered)_'); push(); return; }
    push('| Name | definitionId | btNodeType | Properties |');
    push('|---|---|---|---|');
    for (const n of list) {
        push(`| \`${n.Name}\` | \`codeblock://${n.Id}\` | ${n.BtNodeType} | ${formatPropertyList(n)} |`);
    }
    push();
}

emitNodeSection('2. Custom action nodes',    actions);
emitNodeSection('3. Custom decorator nodes', decorators);

// 4. Type map
push('## 4. Type map');
push();
push('Use this for `nodeProperties[].propertyType.type` and `Blackboard.Variables[].Type.type`. `ObjectValue shape` applies to Blackboard variables.');
push();
push('| mlua type | serialized type | ObjectValue shape |');
push('|---|---|---|');
for (const [k, info] of mluaTypeMap) {
    push(`| \`${k}\` | \`${info.TypeStr}\` | \`${info.ValueShape}\` |`);
}
push();

// Write file (BOM-less UTF-8)
fs.writeFileSync(outputPath, lines.join('\r\n') + '\r\n', { encoding: 'utf8' });
const sizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`Wrote ${outputPath} (${sizeKb} KB)`);
