# Platform Pitfalls

Confirmed MSW Maker editor behaviors that aren't design rules but will silently break a skill if unaccounted for. See [../SKILL.md](../SKILL.md) for the Domain Reference Files index.

## ⚠ Platform Editor Warning: MLUA Refresh Failure & Component Detachment

**CRITICAL PLATFORM BEHAVIOR**: In the MapleStory Worlds editor, if any `.mlua` script contains a **syntax or compilation error** during a workspace refresh (`refresh_workspace` / `refresh`), the compilation fails. Because the type becomes invalid/unregistered, the editor will **silently detach/delete the script component** from ALL models (such as `DefaultPlayer.model`) and placed entities in the active editor session!

- **Prevention**: Always ensure scripts are syntactically and logically correct before triggering a refresh.
- **Recovery**: If a compilation error occurred and was later fixed, the script compiles successfully, but it may have already been **detached** inside the editor's active memory. You must stop play test, check the model/hierarchy, and **re-attach** the component (e.g. re-add `script.PlayerAttack` to the `DefaultPlayer` component list) if the editor has unlinked it, or do a clean workspace reload.
- **Verification**: Check `./Global/DefaultPlayer.model` to ensure the disk file still has `"script.PlayerAttack"` in its `"Components"` list. If it's missing on disk or in the editor UI, re-add it immediately.
- This detach risk applies to `PlayerAttack.mlua` specifically because it's a `@Component` attached to a model's `"Components"` list. `AttackSkillLogic.mlua` (see [skill-framework.md](skill-framework.md)) is a `@Logic`, not attached to any model, so it isn't subject to this same per-model detachment — but a compile error in it still fails the whole workspace refresh the same way, so the same "fix syntax before refresh" prevention still applies.
