# Bundled widget sources

Interaction widget scripts from the official MSWPackages `ui-component-package` (MIT License), bundled for offline integration. Scripts that read text nodes use `TextGUIRendererComponent` where upstream uses `TextComponent`, and `UINumberPadInput` accumulates typed digits in a typing buffer; all other scripts match upstream.

- `UIComponent/**/*.mlua`, `Util/Util.mlua` — copy into the workspace per `references/widgets.md` (no `.codeblock` files here; Maker Refresh generates them).
- `trees/**.txt` — structure digests of the package's prefab models (`Name WxH [scripts] ruid (type) BTN/SLD text:#RRGGBB@size`). The prefab `.model` files themselves are not bundled: rebuild the visual tree with the UIBuilder using your chosen theme's parts, keeping the entity names and component layout shown in the digest.
