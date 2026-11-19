# UI Motion (Tween)

Animating UI over time — popup enter/exit, button press feedback, gauge fill, idle pulse. All of it runs on `_TweenLogic`; MSW exposes no UI animation timeline and no per-frame UI update hook.

Read this when the request is about how a UI element **moves, scales, fades, or reacts**, as opposed to what it looks like at rest ([`ui-fundamentals.md`](ui-fundamentals.md)) or what it does ([`runtime-patterns.md`](runtime-patterns.md)).

---

## 1. API surface

`_TweenLogic` returns a `Tweener` from every call below. ExecSpace `All`, but UI callers are `@ExecSpace("ClientOnly")` like all UI code.

| Call | Effect |
|------|--------|
| `PlayTween(from, to, duration, EaseType, fn)` | Creates **and starts**. `fn(value)` runs each frame — you apply the value. `from`/`to` are `float`, `Vector2`, or `Vector3` (all three must match). |
| `MakeTween(from, to, duration, EaseType, fn)` | Same, but **does not start** — call `:Play()`. Use when you need `Delay` / `LoopCount` / `LoopType` set before the first frame. |
| `MakeNativeTween(from, to, duration, EaseType, component, methodName)` | Like `MakeTween` (call `:Play()`), but feeds the `float` value to a native component method by name. Native components only. |
| `ScaleTo(entity, Vector2 target, duration, EaseType)` | Scales x/y and leaves scale z at `0`. On UI tween `UIScale` (§2). |
| `RotateTo(entity, angle, duration, EaseType)` | Rotates by `angle` degrees CCW **relative to current**. Safe on UI. |
| `MoveTo(entity, Vector2 dest, duration, EaseType)` · `MoveOffset(entity, Vector2 offset, …)` · `RotateAroundOffset(entity, angle, offset, lookOffset, …)` | World entities only — **see §2**. |
| `Ease(from, to, duration, EaseType, t)` | Pure function, no Tweener. For sampling a curve inside your own loop. |

`Tweener`: `Play()` `Pause()` `Resume()` `Stop()` `Restart()` `Rewind()` `Reverse()` `Complete()` `Destroy()` · `SetOnStartCallback(fn)` `SetOnStepCompleteCallback(fn)` `SetOnEndCallback(fn)` · `Delay` `LoopCount` (`-1` = infinite) `LoopType` (`TweenLoopType.Restart` / `PingPong`) `EaseType` `AutoDestroy` (default `true`) · readonly `IsPlaying` `ProgressRate` `CurrentLoopCount`.

- `duration` is seconds per loop, `>= 0`. A negative value raises an error at the creating call. `0` applies `to` on the first frame and finishes, whatever `LoopCount` says.
- `Delay` is a one-time wait before the first loop, added on top of `duration`: a finite tween takes `Delay + duration × LoopCount`. `fn` does not run during the wait — write the starting value yourself before `Play()`.
- `CurrentLoopCount` is `0` before playback and during `Delay`, `1` on the first loop.
- Callback order: `SetOnStartCallback` once when the first loop begins (after `Delay`, not per loop) → `SetOnStepCompleteCallback` at the end of every loop → `SetOnEndCallback` after the last loop's step callback.
- `Complete()` on a finite tween applies the final value immediately and runs the step and end callbacks once each (the start callback too if it has not fired), playing or not. An infinite tween ends with `Stop()`.

## 2. UI safety — position is the trap

`MoveTo` / `MoveOffset` / `RotateAroundOffset` write the entity's `Position`, never `anchoredPosition`. On a screen-space UI entity that collides with the rule that `Position` is engine-managed ([`SKILL.md`](../SKILL.md) NEVER #3) — the tween appears to work sometimes and not others, with no error and no log, which sends you debugging the duration and the ease instead of the property.

| Property to animate | How |
|---|---|
| Position | `PlayTween(Vector2, Vector2, …, function(v) self.tf.anchoredPosition = v end)` — **never** `MoveTo`/`MoveOffset` |
| Scale | `PlayTween(float, float, …, function(s) self.tf.UIScale = Vector3(s, s, 1) end)` |
| Rotation | `RotateTo(entity, …)` |
| Opacity | tween `CanvasGroupComponent.GroupAlpha` (`float`) — one write fades the whole subtree; do not tween element alphas individually |
| Fill / gauge | tween `SpriteGUIRendererComponent.FillAmount` (`float`; requires that component's `Type = ImageType.Filled`) |
| Color | tween a `float` `0→1` and rebuild the `Color` in the callback; `Color` is not a tweenable value type |

An entity under a layout group has its position owned by the group — animate `UIScale` / `GroupAlpha`, or move a child inside the slot.

## 3. Lifecycle — a Tweener is not owned by its target

The Tweener lives in `_TweenLogic`, not on the entity. Closing the popup, disabling the group, or unloading the script does **not** stop it — the callback keeps firing every frame against whatever it captured. Reaching the end of the tween is the only thing that stops one on its own, so a `LoopCount = -1` tween runs until you stop it.

- Store the Tweener in a `property` and `Stop()` it in `OnEndPlay` — same obligation as `DisconnectEvent` and `_TimerService:ClearTimer`.
- Stop the previous Tweener before starting a new one on the same property. Two live tweens writing one `anchoredPosition` produce intermittent jitter that looks like a physics bug.
- `Stop()` does **not** run `SetOnEndCallback` — only natural completion does. That is what makes it safe to interrupt a close animation with a reopen.
- With the default `AutoDestroy = true`, a stopped or finished Tweener is spent — build a new one to replay. The one way to reuse it is `Restart()` from inside its own end callback, which replays it from the top (`Delay` and start callback included).
- `AutoDestroy = false` keeps the Tweener for reuse: `Stop()` only pauses it, a finished one ignores `Play()` / `Resume()` / `Complete()` and replays with `Restart()`, and it stays in `_TweenLogic` until `Destroy()` — call that in `OnEndPlay`.
- Symptom of skipping this: frame rate decays across a session as every popup open leaks one more looping tween.

## 4. Choosing an EaseType

41 values, four families that matter:

| Intent | Use |
|---|---|
| Element **entering** (popup, toast, tooltip) | `BackEaseOut` — overshoots then settles; reads as "arrived". `QuadEaseOut` when the overshoot is too playful for the theme. |
| Element **leaving** | `QuadEaseIn` at ~60% of the enter duration. Exits should be faster than entrances. |
| Value **counting** (score, gauge, damage total) | `QuintEaseOut` — fast start makes a big number feel responsive. |
| Reward / celebration landing | `BounceEaseOut` or `ElasticEaseOut`. One per screen; they are loud. |
| Continuous / looping (pulse, spinner) | `SineEaseInOut` with `LoopType.PingPong`. `Linear` only for genuine constant motion. |

Naming is `<Family>Ease<In|Out|InOut|OutIn>`, where **`In` accelerates from rest and `Out` decelerates into rest** — for a popup that lands, you want `Out`. Curve steepness runs `Expo > Quint > Quart > Cubic > Quad > Sine > Linear`.

Durations: press feedback `0.06–0.1s`, popup enter `0.2–0.3s`, popup exit `0.12–0.18s`, gauge fill `0.3–0.5s`. Past `0.4s` an interaction stops feeling like a response and starts feeling like a wait.

## 5. Recipe — popup enter / exit

Slide-and-fade with correct cleanup. Substitute a `UIScale` tween for the position tween if the theme calls for a pop rather than a slide.

Both Tweeners are stored in `property any` fields; `StopTweens()` calls `Stop()` on each and also runs in `OnEndPlay` (§3).

```lua
@ExecSpace("ClientOnly")
method void Open()
    self:StopTweens()
    self.popupGroup.Enable = true
    self.canvas.GroupAlpha = 0
    self.moveTween = _TweenLogic:PlayTween(
        self.restPos + Vector2(0, -60), self.restPos, 0.25, EaseType.BackEaseOut,
        function(v) self.tf.anchoredPosition = v end)
    self.fadeTween = _TweenLogic:PlayTween(0, 1, 0.15, EaseType.QuadEaseOut,
        function(a) self.canvas.GroupAlpha = a end)
end

@ExecSpace("ClientOnly")
method void Close()
    self:StopTweens()
    self.fadeTween = _TweenLogic:PlayTween(self.canvas.GroupAlpha, 0, 0.15, EaseType.QuadEaseIn,
        function(a) self.canvas.GroupAlpha = a end)
    self.fadeTween:SetOnEndCallback(function() self.popupGroup.Enable = false end)
end
```

`Enable = false` must wait for `SetOnEndCallback` — flipping it up front kills the group before a frame of the fade renders.

## 6. Recipe — press feedback and readiness pulse

Press feedback: shrink on touch down, release on touch up. Requires `UITouchReceiveComponent` on the button (same component [`ui-sound.md`](ui-sound.md) uses for hover SFX).

```lua
local function press(to, duration, ease)
    if self.pressTween ~= nil then self.pressTween:Stop() end
    self.pressTween = _TweenLogic:PlayTween(self.btnTf.UIScale.x, to, duration, ease,
        function(s) self.btnTf.UIScale = Vector3(s, s, 1) end)
end
self.btn.Entity:ConnectEvent(UITouchDownEvent, function() press(0.94, 0.06, EaseType.QuadEaseOut) end)
self.btn.Entity:ConnectEvent(UITouchUpEvent, function() press(1, 0.08, EaseType.BackEaseOut) end)
```

Readiness pulse — "this button just became usable" (resource filled, cooldown ended). Start it when the gate opens, stop it the moment the player acts, otherwise it draws attention forever:

```lua
self.pulse = _TweenLogic:MakeTween(1.0, 1.06, 0.5, EaseType.SineEaseInOut,
    function(s) self.iconTf.UIScale = Vector3(s, s, 1) end)
self.pulse.LoopCount = -1
self.pulse.LoopType = TweenLoopType.PingPong
self.pulse:Play()
```

`LoopCount = -1` never self-destroys — §3 applies with full force.

Gauge fill: tween `FillAmount` from its current value to the new ratio with `QuintEaseOut`, and pair the completion with the pulse above via `SetOnEndCallback`. Read the gauge from state, never from the widget — the widget lags behind mid-tween.

For world-space effects — hit stop, camera shake, particles, sprite flash — see [`msw-combat-system`](../../msw-combat-system/SKILL.md) §4 rather than tweening.
