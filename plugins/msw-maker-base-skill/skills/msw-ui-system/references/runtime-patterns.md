# UI Runtime Patterns

`.mlua` patterns for controlling UI from scripts. These are **runtime code**, separate from `.ui` file authoring (which goes through the builder — see [`../../msw-general/references/builder-protocol.md`](../../msw-general/references/builder-protocol.md) §3, the unified entry point).

> [!IMPORTANT]
> **`@ExecSpace("ClientOnly")` must be on each method, not on the `script`.** A script-level `@ExecSpace` (above the `script` line) does **not** make lifecycle callbacks client-only — the compiler ignores it, so `OnBeginPlay` / `OnUpdate` / `OnEndPlay` still run on the server, where UI entity refs are `nil` → `[LEA-2007] AttemptToIndex`. Annotate every engine-invoked method (lifecycle callbacks, handlers, and any method that touches UI) individually, exactly as the examples below do. See "Runtime UI Caveats" §3.

---

## 1. Popup Dialog

A modal popup with a message and OK / cancel buttons.

```lua
@Logic
script UIPopup extends Logic

    property TextGUIRendererComponent message = "uuid-text"
    property ButtonComponent btnOk = "uuid-btn-ok"
    property ButtonComponent btnCancel = "uuid-btn-cancel"
    property Entity popupGroup = "uuid-group"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.popupGroup.Enable = false
    end

    @ExecSpace("ClientOnly")
    method void Open(string msg, any onOk, any onCancel)
        self.onOk = onOk
        self.onCancel = onCancel
        self.message.Text = msg
        self.popupGroup.Enable = true

        self.okHandler = self.btnOk.Entity:ConnectEvent(ButtonClickEvent, function()
            if self.onOk ~= nil then self.onOk() end
            self:Close()
        end)
        self.cancelHandler = self.btnCancel.Entity:ConnectEvent(ButtonClickEvent, function()
            if self.onCancel ~= nil then self.onCancel() end
            self:Close()
        end)
    end

    @ExecSpace("ClientOnly")
    method void Close()
        self.btnOk.Entity:DisconnectEvent(ButtonClickEvent, self.okHandler)
        self.btnCancel.Entity:DisconnectEvent(ButtonClickEvent, self.cancelHandler)
        self.popupGroup.Enable = false
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        self:Close()
    end
end
```

---

## 2. Toast Message

A notification that fades out after a fixed duration.

```lua
@Logic
script UIToast extends Logic

    property TextGUIRendererComponent message = "uuid-text"
    property Entity toastGroup = "uuid-group"
    property number duration = 2
    property number fadeDuration = 0.3

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.toastGroup.Enable = false
    end

    @ExecSpace("ClientOnly")
    method void ShowMessage(string msg)
        self.message.Text = msg
        self.toastGroup.Enable = true

        local canvasGroup = self.toastGroup.CanvasGroupComponent
        canvasGroup.GroupAlpha = 1

        if self.timerId then
            _TimerService:ClearTimer(self.timerId)
        end

        local time = 0
        local preTime = _UtilLogic.ElapsedSeconds

        self.timerId = _TimerService:SetTimerRepeat(function()
            local delta = _UtilLogic.ElapsedSeconds - preTime
            time = time + delta
            preTime = _UtilLogic.ElapsedSeconds

            if time >= self.duration + self.fadeDuration then
                canvasGroup.GroupAlpha = 0
                self.toastGroup.Enable = false
                _TimerService:ClearTimer(self.timerId)
                self.timerId = nil
            elseif time >= self.duration then
                canvasGroup.GroupAlpha = 1 - (time - self.duration) / self.fadeDuration
            end
        end, 1/60)
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        if self.timerId then
            _TimerService:ClearTimer(self.timerId)
        end
    end
end
```

---

## 3. HP Bar (Progress Bar)

Implement a linear HP bar with a **Sliced** fill sprite. Use the HP gauge slice sprite (`image_ruid = "f0911af597259044aa624a11332c0595"`), anchor the fill to the left edge (pivot `(0, 0.5)`), and express the fill ratio by resizing its **width** — not `FillAmount` or `SliderComponent.Value`. This keeps the 9-slice borders crisp at every value, instead of the UV-clipping distortion you get with `Type=Filled`.

```lua
@Component
script HPBar extends Component

    -- Bind both to the same fill entity: the transform drives the width, the
    -- renderer drives the color. fullWidth is the 100% width (matches the bar bg).
    property UITransformComponent fillTransform = "uuid-fill"
    property SpriteGUIRendererComponent fillImage = "uuid-fill"
    property TextGUIRendererComponent hpText = "uuid-text"
    property number fullWidth = 220

    @ExecSpace("ClientOnly")
    method void UpdateHP(number current, number max)
        local ratio = current / max
        ratio = math.max(0, math.min(1, ratio))

        -- Sliced fill: resize width (left edge fixed), so borders stay crisp.
        local size = self.fillTransform.RectSize
        self.fillTransform.RectSize = Vector2(self.fullWidth * ratio, size.y)
        self.hpText.Text = tostring(math.floor(current)) .. " / " .. tostring(math.floor(max))

        -- color transition: green -> yellow -> red
        if ratio > 0.5 then
            self.fillImage.Color = Color(0, 1, 0, 1)
        elseif ratio > 0.2 then
            self.fillImage.Color = Color(1, 1, 0, 1)
        else
            self.fillImage.Color = Color(1, 0, 0, 1)
        end
    end
end
```

**Note:** Set the fill sprite `Type` to `Sliced(1)` (the builder default) and anchor it `middle-left` with pivot `(0, 0.5)` so resizing the width grows it rightward. Do **not** use `Type=Filled` for linear bars. Radial gauges (e.g. §10 cooldown) are the only case that still requires `Filled` + `Radial`, since a 9-slice cannot represent a circular sweep.

---

## 4. Scroll List + Item Cloning

Hide a template and add items via Clone.

```lua
@Logic
script ScrollList extends Logic

    property Entity itemTemplate = "uuid-template"
    property ScrollLayoutGroupComponent scrollLayout = "uuid-scroll"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.itemTemplate:SetEnable(false)  -- hide template
        self.items = {}
    end

    @ExecSpace("ClientOnly")
    method void AddItem(string text)
        local clone = self.itemTemplate:Clone("Item_" .. #self.items)
        clone:SetEnable(true)
        clone.TextGUIRendererComponent.Text = text
        table.insert(self.items, clone)
    end

    @ExecSpace("ClientOnly")
    method void ClearAll()
        for _, item in ipairs(self.items) do
            item:Destroy()
        end
        self.items = {}
    end

    @ExecSpace("ClientOnly")
    method void ScrollToBottom()
        self.scrollLayout:SetScrollNormalizedPosition(UITransformAxis.Vertical, 0.0)
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        self:ClearAll()
    end
end
```

---

## 5. GridView Large List

For 100+ items, use GridView instead of ScrollLayout.

```lua
@Logic
script InventoryGrid extends Logic

    property GridViewComponent gridView = "uuid-gridview"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.data = {}
        -- initialize data
        for i = 1, 200 do
            table.insert(self.data, "Item " .. tostring(i))
        end

        self.gridView.TotalCount = #self.data
        self.gridView.OnRefresh = function(index, entity)
            -- index is 0-based
            entity.TextGUIRendererComponent.Text = self.data[index + 1]
            entity.SpriteGUIRendererComponent.Color = Color.white
        end
        self.gridView.OnClear = function(index, entity)
            -- clean up items that scrolled off-screen (optional)
        end
        self.gridView:Refresh(true, true)
    end

    @ExecSpace("ClientOnly")
    method void RefreshData()
        self.gridView.TotalCount = #self.data
        self.gridView:Refresh(false, true)
    end
end
```

---

## 6. Tab UI (Toggle Group)

Activate only one tab at a time.

```lua
@Logic
script TabUI extends Logic

    property Entity tab1Content = "uuid-content1"
    property Entity tab2Content = "uuid-content2"
    property Entity tab3Content = "uuid-content3"
    property ButtonComponent tab1Btn = "uuid-btn1"
    property ButtonComponent tab2Btn = "uuid-btn2"
    property ButtonComponent tab3Btn = "uuid-btn3"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.tabs = {self.tab1Content, self.tab2Content, self.tab3Content}
        self.tab1Btn.Entity:ConnectEvent(ButtonClickEvent, function() self:SelectTab(1) end)
        self.tab2Btn.Entity:ConnectEvent(ButtonClickEvent, function() self:SelectTab(2) end)
        self.tab3Btn.Entity:ConnectEvent(ButtonClickEvent, function() self:SelectTab(3) end)
        self:SelectTab(1)
    end

    @ExecSpace("ClientOnly")
    method void SelectTab(number index)
        for i, tab in ipairs(self.tabs) do
            tab.Enable = (i == index)
        end
    end
end
```

---

## 7. Runtime Z-Order / Sibling Reorder

Use `_UILogic:SetSiblingIndex(targetUITransform, index)` on the client to reorder UI siblings at runtime. There is no `entity.SetAsLastSibling()` pattern in the public mlua API; reorder through the target entity's `UITransformComponent`. The index is 1-based; a deliberately high index moves the target to the front among siblings.

```lua
@Logic
script UIStackOrder extends Logic

    property UITransformComponent draggingCard = nil

    @ExecSpace("ClientOnly")
    method void BringToFront(UITransformComponent target)
        if target == nil then
            return
        end

        _UILogic:SetSiblingIndex(target, 1000000)
    end

end
```

Use this when creation order is not enough:
- Card/table stacks where later gameplay changes which card should receive input first.
- Dragging an entity that must render above its siblings while held.
- Popup-over-popup flows within the same UIGroup.

Prefer build-time `displayOrder` for static layouts. Use runtime sibling reorder only for dynamic overlap.

---

## 8. Drag and Drop

Implement drag with UITouchReceiveComponent.

```lua
@Component
script Draggable extends Component

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.dragHandler = self.Entity:ConnectEvent(UITouchDragEvent, self.OnDrag)
    end

    @ExecSpace("ClientOnly")
    method void OnDrag(UITouchDragEvent event)
        local transform = self.Entity.UITransformComponent
        local pos = transform.anchoredPosition
        transform.anchoredPosition = Vector2(
            pos.x + event.TouchDelta.x,
            pos.y + event.TouchDelta.y
        )
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        self.Entity:DisconnectEvent(UITouchDragEvent, self.dragHandler)
    end
end
```

---

## 9. Text Input + Chat

```lua
@Logic
script ChatUI extends Logic

    property TextGUIRendererInputComponent chatInput = "uuid-input"
    property TextGUIRendererComponent chatLog = "uuid-log"
    property ScrollLayoutGroupComponent scrollLayout = "uuid-scroll"
    property Entity messageTemplate = "uuid-template"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.messageTemplate:SetEnable(false)
        self.submitHandler = self.chatInput.Entity:ConnectEvent(
            TextInputSubmitEvent, self.OnSubmit)
    end

    @ExecSpace("ClientOnly")
    method void OnSubmit(TextInputSubmitEvent event)
        local text = event.text
        if text == "" then return end

        local msg = self.messageTemplate:Clone("Msg_" .. self.msgCount)
        msg:SetEnable(true)
        msg.TextGUIRendererComponent.Text = text
        self.msgCount = self.msgCount + 1

        -- scroll to bottom
        self.scrollLayout:SetScrollNormalizedPosition(UITransformAxis.Vertical, 0.0)
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        self.chatInput.Entity:DisconnectEvent(TextInputSubmitEvent, self.submitHandler)
    end
end
```

---

## 10. Cooldown Display (Radial FillAmount)

```lua
@Component
script CooldownUI extends Component

    property SpriteGUIRendererComponent cooldownOverlay = "uuid-overlay"
    property TextGUIRendererComponent cooldownText = "uuid-text"

    @ExecSpace("ClientOnly")
    method void StartCooldown(number duration)
        self.cooldownOverlay.Entity:SetEnable(true)
        local time = 0
        local preTime = _UtilLogic.ElapsedSeconds

        self.timerId = _TimerService:SetTimerRepeat(function()
            local delta = _UtilLogic.ElapsedSeconds - preTime
            time = time + delta
            preTime = _UtilLogic.ElapsedSeconds

            local remaining = duration - time
            if remaining <= 0 then
                self.cooldownOverlay.FillAmount = 0
                self.cooldownOverlay.Entity:SetEnable(false)
                self.cooldownText.Text = ""
                _TimerService:ClearTimer(self.timerId)
                return
            end

            self.cooldownOverlay.FillAmount = remaining / duration
            self.cooldownText.Text = tostring(math.ceil(remaining))
        end, 1/60)
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        if self.timerId then
            _TimerService:ClearTimer(self.timerId)
        end
    end
end
```

**Setup:** SpriteGUIRenderer `Type=Filled(3)`, `FillMethod=Radial360(4)`, translucent black. Radial sweeps are the one gauge case where `Filled` is required — a 9-slice cannot draw a circular fill. Linear bars (HP/MP/EXP, §3) use `Sliced` + width resize instead.

---

## 11. World UI (Overhead Name Tag)

Place UI at world coordinates with UIModeType.World.

```lua
@Component
script NameTag extends Component

    property TextGUIRendererComponent nameText = "uuid-text"

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        self.nameText.Text = self.Entity.Name
    end

    @ExecSpace("ClientOnly")
    method void OnUpdate(number dt)
        -- follow the entity position
        local worldPos = self.Entity.TransformComponent.WorldPosition
        local uiTransform = self.nameText.Entity.UITransformComponent
        local screenPos = _UILogic:WorldToScreenPosition(Vector2(worldPos.x, worldPos.y + 1.5))
        local uiPos = _UILogic:ScreenToUIPosition(screenPos)
        uiTransform.anchoredPosition = uiPos
    end
end
```

---

## Event Handler Skeletons

Quick skeletons for the most common UI events. Always store the handler return and `DisconnectEvent` in `OnEndPlay`.

### Button click

```lua
property ButtonComponent btnOk = "uuid"
property any clickHandler = nil

@ExecSpace("ClientOnly")
method void OnBeginPlay()
    self.clickHandler = self.btnOk.Entity:ConnectEvent(ButtonClickEvent, self.OnClick)
end

@ExecSpace("ClientOnly")
method void OnClick() end

@ExecSpace("ClientOnly")
method void OnEndPlay()
    self.btnOk.Entity:DisconnectEvent(ButtonClickEvent, self.clickHandler)
end
```

### Text input

```lua
property TextGUIRendererInputComponent input = "uuid"
property any submitHandler = nil

@ExecSpace("ClientOnly")
method void OnBeginPlay()
    self.submitHandler = self.input.Entity:ConnectEvent(TextInputSubmitEvent, self.OnSubmit)
end

@ExecSpace("ClientOnly")
method void OnSubmit(TextInputSubmitEvent event)
    local text = event.text
end
```

### Slider

```lua
property SliderComponent slider = "uuid"
property any sliderHandler = nil

@ExecSpace("ClientOnly")
method void OnBeginPlay()
    self.sliderHandler = self.slider.Entity:ConnectEvent(SliderValueChangedEvent, self.OnValueChanged)
end

@ExecSpace("ClientOnly")
method void OnValueChanged(SliderValueChangedEvent event)
    local value = event.Value
end
```

### Touch / drag

```lua
-- attach UITouchReceiveComponent on the entity first (use the builder's touchReceive())
entity:ConnectEvent(UITouchDownEvent, handler)
entity:ConnectEvent(UITouchDragEvent, handler)
entity:ConnectEvent(UITouchUpEvent, handler)
```

---

## Runtime UI Caveats

Hard rules that show up as "UI doesn't respond" or "Server can't see UI". Memorize.

### Hard constraints (silent failure if broken)

1. **UI entities are client-only.** If an `@Component` on a UI entity defines `@ExecSpace("Server")`, `@ExecSpace("ServerOnly")`, or `@ExecSpace("Multicast")` methods, the runtime emits `'<entity>' is client only. '<component>.<method>' doesn't work normally.` and **RPCs do not work**. `@Sync` properties are also not synchronized. Route UI-to-server communication through an `@Logic` outside the UI entity, or a map entity `@Component`, then call the Server RPC.
2. **No UI entity access from server.** Referencing a UI entity in `@ExecSpace("Server")` / `@ExecSpace("ServerOnly")` returns **nil**. For server-to-UI updates, route through an `@ExecSpace("Client")` RPC.
3. **Put `@ExecSpace("ClientOnly")` on each method — a script-level annotation is a no-op for lifecycle callbacks.** `@ExecSpace` above the `script` line does **not** propagate to methods: `OnBeginPlay` / `OnUpdate` / `OnEndPlay` default to running on **both** server and client, and on the server every UI entity ref is `nil` → the first `self.<uiProp>.X` throws `[LEA-2007] AttemptToIndex`. Annotate every engine-invoked method (lifecycle callbacks, handlers, and any method that touches UI) with method-level `@ExecSpace("ClientOnly")`, as every example above does. As a defensive fallback you can also guard the first line: `if not isvalid(self.<uiProp>) then return end`.
4. **Do not attach UI components (ButtonComponent, etc.) to map / world entities** — UI-only. Trying to attach via builder/runtime silently misbehaves.
5. **`UIGroup DefaultShow=false`** — not visible until `Enable=true`. Also, if `DefaultShow=false` AND the group has no controller script outside to flip `Enable`, scripts inside the group never run `OnBeginPlay` / `OnUpdate` (typical symptom: "level-up popup never shows"). See [`ui-hierarchy.md`](ui-hierarchy.md) for the standard pattern.

### Movement / fade / visibility

6. **Move via `anchoredPosition`** — never set `Position` directly (engine treats it as a derived cache, your writes get overwritten).
7. **Fade via `CanvasGroupComponent.GroupAlpha`** — don't tween individual element alphas. One write covers the whole subtree consistently.
8. **Show/hide via `Enable`** — `popupGroup.Enable = true/false`. `Visible = false` keeps clicks alive and OnUpdate running (see [`ui-hierarchy.md`](ui-hierarchy.md) §5).

### Resource cleanup

9. **Always `DisconnectEvent` in `OnEndPlay`** — otherwise event handlers leak across script reloads / popup re-opens.
10. **`_TimerService:ClearTimer` in `OnEndPlay`** — store the timer ID returned by `SetTimerRepeat` and clear it.

### Animation timing

11. **Use a 1/60 repeating timer** for per-frame UI animation (`_TimerService:SetTimerRepeat(fn, 1/60)`). MSW doesn't expose a global UI Update hook.
12. **Measure delta with `_UtilLogic.ElapsedSeconds`** — diff between frames, never assume the timer interval is exact.
