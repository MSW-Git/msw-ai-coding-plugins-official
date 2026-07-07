# UI Hierarchy — Layers, Groups & Ordering

A single `.ui` file contains one **UIGroup**, which holds an entity tree inside it. Show/hide, opacity, interaction, and render order are all determined by these hierarchy rules.

---

## 1. Four-Layer Structure

```
.ui file (e.g. PopupGroup.ui)
└── Root entity (UITransform + UIGroup + CanvasGroup)   ← one per file, represents a screen
    └── Panel entity (UITransform, optional CanvasGroup) ← functional grouping
        └── Element entity (UITransform + Text/Sprite/Button)
             └── Child element (icon, text, etc.)
```

- **File = Screen unit** (HUD / Popup / Toast / Menu, etc.)
- **UIGroup** is root-only; use entity `Enable` or `CanvasGroup` for inner chunks
- **CanvasGroup** is the boundary of "a chunk whose opacity and interaction can be controlled at once"

---

## 2. UIGroupComponent — The Identity of a "Screen" Unit

**Must be attached only to the root entity** of a `.ui` file. Do not nest `UIGroupComponent` under another UIGroup; inner `UIGroup` entities are not a supported container pattern and can fail to render correctly. For sub-popups, cards, gauges, tabs, and reusable sections, create an `empty()` / `panel()` container and toggle the container entity or its CanvasGroup.

| Field | Meaning | Default |
|------|------|-------|
| `DefaultShow` | Whether to auto-display on start | `false` recommended (popups/toasts), `true` for HUD |
| `GroupOrder` | **Z-order** among multiple UIGroups. Higher = on top | 3 (UIGroup.ui default) |
| `GroupType` | `DefaultType(1)` = default HUD layer / `UIType(2)` = popup/menu layer | `2` |

### GroupType Selection Criteria

- `DefaultType(1)` : **Always-visible HUD layer** — HP bar, minimap, score
- `UIType(2)` : **Openable/closable screens** — inventory, settings, popups, menus

The two layers are managed separately by the engine. If you want the HUD to remain unobscured when a popup opens, set the popup's GroupType to 2.

### Ordering Within the Same Layer via GroupOrder

Within the same GroupType, a UIGroup with a higher GroupOrder number is rendered on top. Since the default UIGroup value is 3:

| Purpose | Recommended GroupOrder |
|------|----------------|
| Background / World UI | 0 |
| Default HUD | 1~3 |
| Inventory / Menu | 5~7 |
| Popup Dialog | 10 |
| Toast / Notification | 20 |
| System Modal (network error, etc.) | 50+ |

---

## 3. CanvasGroupComponent — Opacity & Interaction Bundle

By default, attached to the root **as a set with UIGroup**. Can also be attached to intermediate Panels.

| Field | Meaning | Propagation |
|------|------|------|
| `GroupAlpha` | Opacity 0~1 | **Multiplied across all children** |
| `Interactable` | Accepts input | If false, all children are blocked |
| `BlocksRaycasts` | Blocks touch pass-through to UI behind | Only within its own Rect area |

### Core Behavior — Values Are Multiplied

```
Root CanvasGroup GroupAlpha = 0.5
  └── Panel CanvasGroup GroupAlpha = 0.5
      → Panel final alpha = 0.5 × 0.5 = 0.25
      → Even if child Text's FontColor.a = 1, actual render alpha = 0.25
```

- Don't touch individual element alphas — use **a single CanvasGroup** for fade in/out
- The standard approach for popup fade animation: just one line — `popupGroup.CanvasGroupComponent.GroupAlpha = t`

### Effect of Interactable = false

- Blocks clicking on all child buttons
- But **rendering remains unchanged** (opacity stays at 1)
- Useful for disabling background HUD buttons when a popup opens

### BlocksRaycasts — Locking the HUD Behind a Popup

Set `BlocksRaycasts = true` on the popup Root + place a semi-transparent Sprite covering the full screen at the bottom of the popup, and the UI behind is automatically input-blocked. This is the standard setup for modal popups.

---

## 4. displayOrder — Sibling Order Within the Same Parent

The `.ui` entity field `displayOrder` is the **render order among siblings under the same parent**. Higher = on top.

```
Popup (UIGroup)
├── Background   (displayOrder=0)   ← furthest back
├── Panel        (displayOrder=1)
│   ├── Title    (displayOrder=0)
│   ├── Message  (displayOrder=1)
│   └── BtnOk    (displayOrder=2)
└── CloseIcon    (displayOrder=2)   ← furthest front (floating above Panel)
```

### GroupOrder vs displayOrder

| Field | Scope | Used For |
|------|------|--------|
| `UIGroupComponent.GroupOrder` | Z-order between different `.ui` files | Screen-level (popup vs HUD) |
| Entity `displayOrder` | Among siblings under the same parent | Layout within a panel |
| `OrderInLayer` (Sprite/Button) | Fine-tuning within the same entity | Rarely needs adjustment |

Rule: **Group vs group uses GroupOrder; within a group uses displayOrder.**

For runtime reordering of overlapping siblings, use `_UILogic:SetSiblingIndex(UITransformComponent, index)` from client code. See [`runtime-patterns.md`](runtime-patterns.md) §7 for the dynamic card/drag/popup pattern. Do not assume Unity-style `SetAsLastSibling()` exists.

---

## 5. Enable vs Visible — Standard UI Show/Hide

Two flags on `.ui` entities. **The standard for show/hide is `Enable`; `Visible` is an anti-pattern.** Behavior differences:

| Flag | Entity Active State | Child Tree Propagation | Lifecycle (OnUpdate, etc.) | Input (clicks) | Recommended Use |
|-------|------------------|---------------|------------------------|---------|------------|
| **`Enable`** | Inactive (entity entirely off) | Entire child tree deactivated | **Stopped** | **Blocked** | The standard for UIGroup show/hide |
| **`Visible`** | Remains active | Children remain as-is | **Continues running** | **Still active** | Almost never used |

### Behavior Summary

- `Enable = false` → The entity + its entire child subtree are deactivated. OnUpdate, OnComponentEnabled, and input callbacks all stop. `EntityEnabledInHierarchyChangedEvent` is automatically dispatched so other scripts can detect the change.
- `Visible = false` → Only turns off the renderer. Children, input, and OnUpdate all remain active. Depending on the component, there may not even be a visual effect.

→ With `Visible = false`, **button clicks still work, and child UI may still be visible**. If your intent is show/hide, always use `Enable`.

### The Standard Way to Open/Close Popups

```lua
-- Open popup
self.popupGroup.Enable = true      -- Enable on the UIGroup entity
-- Close popup
self.popupGroup.Enable = false
```

- When `Enable = false`, the entire subtree is deactivated at the GameObject level → button clicks, OnUpdate, and OnComponentEnabled callbacks all stop
- When `Enable` changes, `EntityEnabledInHierarchyChangedEvent` is automatically dispatched → other scripts can detect the on/off state

### When to Use Visible

**Almost never.** The only justified cases are roughly:

- When you want to keep the UI tree's lifecycle running (timers, OnUpdate, event subscriptions) while **temporarily hiding just the graphics** (e.g. a one-frame hide trick right before a fade)
- Even in this case, `CanvasGroup.GroupAlpha = 0` is safer — it consistently makes everything transparent including children

**Forbidden pattern**:

```lua
-- ❌ An "invisible popup" where clicks still register
self.popupGroup.Visible = false   -- child buttons still receive raycasts
```

```lua
-- ✅ Standard
self.popupGroup.Enable = false
```

### Caution When Using the Builder

`UIBuilder.patch(visible=False)` writes `"visible": false` into the JSON. The same pitfall applies. **If your intent is show/hide, use `enable=False`, or more generally, set `UIGroupComponent.DefaultShow = False` for hidden-on-start and toggle `Enable` at runtime.**

---

## 6. File Splitting Strategy

**Don't put too much into a single `.ui` file.** It tangles management, fading, and loading units.

### Default 4 Files (starter workspace setup)

| File | GroupType | GroupOrder | Purpose |
|------|-----------|-----------|------|
| `UIGroup.ui` | 2 | 3 | Overall container (for example purposes; rarely used in real apps) |
| `DefaultGroup.ui` | 1 | 1~3 | HP bar, score, minimap, etc. — **always-on HUD** |
| `PopupGroup.ui` | 2 | 10 | Dialogs and confirmation popups |
| `ToastGroup.ui` | 2 | 20 | Toasts and notifications |

### Criteria for Additional File Splits

- **Screens that open/close independently** → separate `.ui` (inventory, shop, quest window)
- **Per menu tab** → tabs internally are child Panels in the same file; tab switching uses `Enable` toggle
- **Reusable widgets** → separate into `.model` (acts as a prefab). Reusing `.ui` files is not recommended

---

## 7. Hierarchy Checklist

When creating or modifying a `.ui` file:

- [ ] Does the root entity have the 3-piece set of `UITransform + UIGroup + CanvasGroup` attached?
- [ ] Is the root `UITransform` set to `stretch` anchor + `RectSize(1920, 1080)`?
- [ ] Does `UIGroup.GroupType` match the purpose (HUD=1, popup/menu=2)?
- [ ] Does `UIGroup.GroupOrder` not conflict with other `.ui` files (per the recommended table above)?
- [ ] If it's a popup/toast, is `UIGroup.DefaultShow = false`? (otherwise it appears immediately on start)
- [ ] If it's a modal, does it have a semi-transparent fullscreen background Sprite + `BlocksRaycasts = true`?
- [ ] Are all inner containers `empty()` / `panel()` entities, not nested UIGroups?
