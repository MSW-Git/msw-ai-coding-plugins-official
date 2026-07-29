# Platform Pitfalls

Confirmed MSW Maker editor behaviors that aren't design rules but will silently break a skill if unaccounted for. See [../../SKILL.md](../../SKILL.md) for the Domain Reference Files index.

## ⚠ Platform Editor Warning: MLUA Refresh Failure & Component Detachment

**CRITICAL PLATFORM BEHAVIOR**: In the MapleStory Worlds editor, if any `.mlua` script contains a **syntax or compilation error** during a workspace refresh (`refresh_workspace` / `refresh`), the compilation fails. Because the type becomes invalid/unregistered, the editor will **silently detach/delete the script component** from ALL models (such as `DefaultPlayer.model`) and placed entities in the active editor session!

- **Prevention**: Always ensure scripts are syntactically and logically correct before triggering a refresh.
- **Recovery**: If a compilation error occurred and was later fixed, the script may already be detached inside the editor's active memory. Stop play, refresh/reload the workspace, and inspect the actual player/model composition. Reattach through the approved model/builder or Maker workflow for that project.
- **Global policy**: `Global/` models are read-only to the agent. They may be inspected to diagnose whether a component is present, but the agent MUST NOT edit `Global/DefaultPlayer.model` or `Global/Player.model` directly. If the required player composition is engine-owned, copy/author the approved user model under `RootDesk/MyDesk/Models/` or ask the user to perform the necessary Maker-side configuration.
- This detach risk applies to the player attack adapter role specifically because it's a `@Component` attached to a model's `"Components"` list. The attack Registry role (see [../architecture/framework.md](../architecture/framework.md)) is a `@Logic`, not attached to any model, so it isn't subject to this same per-model detachment — but a compile error in it still fails the whole workspace refresh the same way, so the same "fix syntax before refresh" prevention still applies.

## ⚠ Controller: cannot disable the native controller and add a subclass

Extending `PlayerControllerComponent` (e.g. for native jump/down-jump interception, see [../player/casting.md](../player/casting.md)) and then **leaving the native `PlayerControllerComponent` attached but `enable(false)`** while adding the subclass is impossible.

- **Cause**: disabling is not removing. Two base-derived controllers coexist on the entity.
- **Fix**: **replace** the native controller rather than attaching both — the base `Player.model` composition must remove/swap the native controller for the subclass. It cannot be removed from an inherited `DefaultPlayer` at runtime; author the approved user model (per the `Global/` read-only policy above) or ask the user to reconfigure the model in Maker.
- This matches [../player/casting.md](../player/casting.md)'s "replace the ordinary controller instead of attaching both" — the `LWA-3048` warning is the concrete signal that the replace step was skipped.

## ⚠ DataSet: Maker uses its own imported copy, not the disk CSV

The editor loads a DataSet from an **imported copy inside the Maker project**, not directly from the `.csv` on disk. So the values a script sees at runtime can differ from what the `.csv` file currently shows — e.g. the file reads `damage=50, attackCount=2` while the running skill uses `damage=5, attackCount=12` because the row was edited in the editor or the CSV was never re-imported.

- **Symptom**: tuned numbers don't match behavior; a long `attackCount` unexpectedly stretches the knockback/hit-reaction/death-hold window and amplifies other bugs.
- **Prevention**: after editing a DataSet CSV, refresh in Maker, and verify the **runtime-loaded** values (log the normalized row at load) match disk before diagnosing any timing/count symptom. Never assume the disk `.csv` is the source of truth for what is running.
