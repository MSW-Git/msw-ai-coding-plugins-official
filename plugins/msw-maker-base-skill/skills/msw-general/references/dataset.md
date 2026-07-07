# MSW Datasets (UserDataSet / LocaleDataSet)

Assets in MapleStory Worlds (MSW) for managing static game data and translation strings in tabular form.

**Practical paths for manipulating datasets**

1. Open the dataset view directly in the **Maker editor UI** (prefer this path for create / delete / row / column / cell editing).
2. Read and update at runtime from **scripts (.mlua)** via `_DataService` (UserDataSet table/cell access) and `_LocalizationService` (LocaleDataSet translation lookup, ClientOnly). Use for automation, validation, bulk changes.

---

## Dataset Types Summary

| Type | Extension | Sidecar | EntryKey prefix | Use |
|------|-----------|---------|-----------------|-----|
| **UserDataSet** | `.userdataset` | `.csv` | `userdataset://` | Static game data (item tables, wave settings, balance, etc.) |
| **LocaleDataSet** | `.localedataset` | `.csv` | `localedataset://` | Key-based multi-language translation tables |

---

## File-Pair Structure

A dataset is **not a single file**. It consists of a metadata wrapper + a CSV sidecar that holds the actual data.

```
RootDesk/MyDesk/
  ├─ ItemTable.userdataset   ← metadata (JSON wrapper)
  └─ ItemTable.csv           ← real data (CSV)
```

- Editing cells in the Maker dataset editor updates the `.csv`.
- Changing column names or dataset properties updates the `.userdataset`.
- Both files must share the same base name and reside in the same directory.

> **Note**: Older docs show `columns`/`datas` arrays inline inside `ContentProto.Json`. Current Maker writes row data to the **`.csv` sidecar** instead and strips those keys from the `.userdataset` JSON on save. The engine still falls back to inline `columns`/`datas` if the CSV sidecar is missing, so older single-file datasets continue to load.

---

## UserDataSet (.userdataset)

### Metadata wrapper

```json
{
  "Id": "",
  "GameId": "",
  "EntryKey": "userdataset://93729dda-ef49-403b-86f7-982d08fc353f",
  "ContentType": "x-mod/userdataset",
  "Content": "",
  "Usage": 0,
  "UsePublish": 1,
  "UseService": 0,
  "CoreVersion": "26.5.0.0",
  "StudioVersion": "0.1.0.0",
  "DynamicLoading": 0,
  "ContentProto": {
    "Use": "Json",
    "Json": {
      "name": "dataset_sample",
      "id": "93729dda-ef49-403b-86f7-982d08fc353f",
      "serveronly": false,
      "syncDataSetWebUrl": "",
      "dynamicloading": 0
    }
  }
}
```

Key fields:

| Field | Meaning |
|-------|---------|
| `EntryKey` | `userdataset://<UUID>` — UUID matches `ContentProto.Json.id` |
| `ContentType` | Always `x-mod/userdataset` |
| `ContentProto.Json.name` | **Runtime lookup key.** Used in `_DataService:GetTable("<name>")` and `_DataService:GetCell("<name>", row, col)` |
| `ContentProto.Json.id` | UUID. Stays in sync with EntryKey |
| `ContentProto.Json.serveronly` | `true` = not exposed to client |
| `ContentProto.Json.syncDataSetWebUrl` | External sheet sync URL (Google Sheets, etc.). Leave empty if unused |
| `ContentProto.Json.dynamicloading` | Runtime dynamic-load option (0 = Off) |

### CSV sidecar

```csv
id,a,b,c
row1,1,2,foo
row2,3,4,bar
```

Rules:

- **UTF-8** encoding
- First line = **column header**, subsequent lines = data rows
- All cell values are **strings** (convert to number/boolean at runtime)
- Column names starting with `#` are **memo/comment only** — do not use as game-logic keys
- Blank cells may return **empty string `""`** rather than `nil` — check for both
- Row-identifier column name is free-form; `FindRow` searches by column name so only the header needs to be consistent

### Type conversion pitfalls

```lua
-- string → number
local x = tonumber(ds:GetCell(1, "a")) or 0

-- Integer ID matching: MSW number is float, tostring(3) may yield "3.0"
local key = tostring(math.floor(itemId))
local row = ds:FindRow("id", key)
```

### Runtime Lua access

`_DataService` is the runtime entry point for UserDataSet access.

```lua
-- Table-object style: fetch once, call methods on it
local ds = _DataService:GetTable("ItemTable")    -- returns UserDataSet

local count = ds:GetRowCount()
local value = ds:GetCell(1, "Price")             -- 1-based row index, column name
local row   = ds:GetRow(1)                       -- UserDataRow
local found = ds:FindRow("ItemID", "003")        -- search by column value, returns UserDataRow or nil
local col   = ds:GetColumn("Price")              -- table<string>
local all   = ds:GetAllRow()                     -- table<UserDataRow>

-- Service-direct style: pass dataset name on every call
local n    = _DataService:GetRowCount("ItemTable")
local cell = _DataService:GetCell("ItemTable", 1, "Price")
local cell2 = _DataService:GetCell("ItemTable", 1, 3)  -- col index also OK (1-based)
```

`UserDataSet` and `UserDataRow` return all cell values as `string`; convert with `tonumber()` etc. as needed.

---

## LocaleDataSet (.localedataset)

### Metadata wrapper

Same structure as UserDataSet except:

- **`ContentType`**: `x-mod/localedataset`
- **`EntryKey`**: `localedataset://<UUID>`

### CSV column rules

| Column | Position | Role |
|--------|----------|------|
| `Key` | 1st (required) | Lookup key |
| `Source` | 2nd (required) | Source/reference text |
| `Note` | 3rd (required) | Translator notes |
| `ko`, `en`, … | 4th+ (at least one required) | Per-language translation columns |

The first three columns have fixed order and role; locale columns follow after them.

### Runtime Lua access

`LocaleDataSet` is queried through **`_LocalizationService`** (all methods `ClientOnly`). The service reads from whichever LocaleDataSet asset is in the workspace; you do not specify a dataset name.

```lua
-- Current client locale (uses _LocalizationService.CurrentLocaleId column)
local text = _LocalizationService:GetText("ui_start")

-- Format placeholders {0}, {1}, …
local greet = _LocalizationService:GetTextFormat("hello_user", playerName)

-- Force a specific language column via Translator
local en = _LocalizationService:GetTranslatorForLocale("en")
local enText = en:GetText("ui_start")
local enFmt  = en:GetTextFormat("hello_user", playerName)

-- Local (current-locale) Translator shortcut
local koText = _LocalizationService.LocalTranslator:GetText("ui_start")

-- TextGUIRendererComponent with the localization-key flag set in the Maker editor:
-- GetLocalizedText() (no args) resolves the component's Text property as the key.
-- The flag is a Maker-editor setting, not a runtime .mlua property.
local rendered = self.Entity.TextGUIRendererComponent:GetLocalizedText()
```

> Calling `_LocalizationService:GetText` from a server-only context fails — translation is a client concern. For server-side localized messaging, send the key over RPC and let the client resolve it.

---

## Creating a Dataset

### Recommended: Maker UI

Let the editor handle UUID generation, EntryKey consistency, and CSV creation.

### Manual creation

1. Generate a UUID with a cross-platform command: `node -e "console.log(require('node:crypto').randomUUID())"`
2. Write `<Name>.userdataset` using the template above — fill in `name`, `id`, `EntryKey`
3. Write `<Name>.csv` — UTF-8, first line = header, then data rows
4. Place both in the same folder under `RootDesk/MyDesk/` and hit **Refresh** in Maker

---

## What Does NOT Work

| Approach | Status |
|----------|--------|
| HTTP RPC for dataset CRUD | **Removed** — old API no longer exists |
| Dedicated MCP tool for datasets | **None** — use Maker UI or script API only |

The agent must **not assume any arbitrary HTTP RPC endpoint** — only the two paths above (UI / script).

---

## Recommended Use Cases

- Wave config (enemy composition, spawn intervals, type weights)
- Skill balance (cost, damage, cooldown, RUID)
- Item pricing and effects
- Boss pattern thresholds (HP %, range, interval)
- Multi-language UI strings (LocaleDataSet)

Separating balance data into `.userdataset` + `.csv` allows patching by swapping CSV alone — fast iteration without code changes.
