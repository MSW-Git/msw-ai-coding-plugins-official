# UI Sound Integration

Pattern for attaching sounds to UI button / touch interactions.

## API

- `_SoundService:PlaySound(id: string, volume: number)` — ExecSpace("Client")
- `volume` range: `0.0 ~ 1.0`
- RUID acquisition: `msw-search` resource API (type=sound), or use the default UI SFX RUIDs below

## Default UI SFX RUIDs

Project-standard button sounds:

| Purpose | RUID |
|---------|------|
| Hover (pointer/touch enter) | `159bf70a74634bfc8e91a29e527a4be5` |
| Click (button click) | `972843e759204d3e9ad84e7d3fa94f83` |

When creating a new button without a specific sound requirement, reuse these two RUIDs as-is.

## Hook Points

| Event | Required Component | Purpose |
|-------|-------------------|---------|
| `ButtonClickEvent` | `ButtonComponent` | Click SFX |
| `UITouchEnterEvent` | `UITouchReceiveComponent` (required) | Hover SFX |

Without `UITouchReceiveComponent`, `UITouchEnterEvent` is never fired — check this first if hover SFX is silent. The component also needs a raycast-enabled GUI renderer on the same entity (or a child) — a sibling renderer does not work (see [`component-api.md`](component-api.md) §UITouchReceiveComponent).

## Pattern (Full Sample)

Complete copy-paste-ready implementation:

```lua
@Logic
script UISoundSample extends Logic

    property Entity btn = "<button entity uuid>"
    property string hoverSoundRUID = "159bf70a74634bfc8e91a29e527a4be5"
    property string clickSoundRUID = "972843e759204d3e9ad84e7d3fa94f83"
    property number volume = 1.0
    property any clickHandler = nil
    property any hoverHandler = nil

    @ExecSpace("ClientOnly")
    method void OnBeginPlay()
        if isvalid(self.btn) == false then
            return
        end
        self.clickHandler = self.btn:ConnectEvent(ButtonClickEvent, self.OnClick)
        self.hoverHandler = self.btn:ConnectEvent(UITouchEnterEvent, self.OnHover)
    end

    @ExecSpace("ClientOnly")
    method void OnClick()
        _SoundService:PlaySound(self.clickSoundRUID, self.volume)
    end

    @ExecSpace("ClientOnly")
    method void OnHover()
        _SoundService:PlaySound(self.hoverSoundRUID, self.volume)
    end

    @ExecSpace("ClientOnly")
    method void OnEndPlay()
        if self.clickHandler ~= nil and isvalid(self.btn) then
            self.btn:DisconnectEvent(ButtonClickEvent, self.clickHandler)
        end
        if self.hoverHandler ~= nil and isvalid(self.btn) then
            self.btn:DisconnectEvent(UITouchEnterEvent, self.hoverHandler)
        end
        self.clickHandler = nil
        self.hoverHandler = nil
    end

end
```

**Required components on the button entity:**
- `ButtonComponent` — fires `ButtonClickEvent`
- `UITouchReceiveComponent` — fires `UITouchEnterEvent` (hover)

## Gotchas

- **ClientOnly script context** — UI itself is client-only, so sound-calling scripts should use `@ExecSpace("ClientOnly")`. `PlaySound` is `ExecSpace("Client")` but there is no reason to trigger UI SFX directly from the server.
- **Missing hover events** — When building a button via the `.ui` builder, `UITouchReceiveComponent` is not always added automatically. Add it explicitly with `b.addComponent(identifier, "MOD.Core.UITouchReceiveComponent")`.
- **Overlapping SFX on rapid input** — `PlaySound` spawns a new instance on every call. Short SFX is fine; guard long sounds with a cooldown variable.

## Reference

- `Environment/NativeScripts/Service/SoundService.d.mlua` — Full SoundService API
- `Environment/NativeScripts/Component/SoundComponent.d.mlua` — Entity-attached sound (for 3D positional, etc.)
