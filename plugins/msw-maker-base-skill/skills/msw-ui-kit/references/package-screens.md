# Official Package Screens

Entity-tree digests of the **official MSWPackages** feature-package UIs — the reference structure for a screen the platform already ships a system for (inventory, shop, mail, ranking…). Same digest format as the per-theme sample screens, and the same rule: **structure only, rebuild with the UIBuilder.**

Use these over a theme's sample screen when the feature itself comes from a package (routed via `msw-packages`) — the tree here is what that package's scripts expect to bind against, so matching it avoids reworking the layout after the logic lands.

> [!IMPORTANT]
> Every RUID in these digests is the package's own art, not a theme part. Take the
> composition — node hierarchy, sizes, what sits next to what — and pass your chosen
> theme's RUIDs instead. Mixing package art into a themed screen breaks ALWAYS #1.

`UIGM*Tool` screens are the package's admin/GM tooling, not the player-facing screen — useful as dense list/form composition, but pick the plain-named screen for player UI.

- **`dialog`** — NPC conversation box, typewriter body, choice buttons
  - `UIDialog`(21)
- **`droptable-resolver`** — Drop table preview rows, probability labels
  - `UIDropTableResolverHUD`(15)
- **`game-event`** — Event banners, schedule list, detail popup
  - `UIGMGameEventTool`(230), `UIGameEvent`(12), `UIGameEventLoginBoard`(21)
- **`global-config`** — Settings rows, toggles, value steppers
  - `UIGlobalConfigSetTool`(22)
- **`gm-message`** — Announcement banner, system message queue
  - `UIGMMessageTool`(60)
- **`inventory`** — Item bag grid, equip slots, item detail popup
  - `UICommonPopup`(10), `UIGMInventoryTool`(52), `UIInventory`(93), `UIItemSlot`(8)
- **`key-binding`** — Key list rows, rebind capture popup, virtual pad
  - `UICommonPopup`(10), `UIGameOption`(50), `UIVirtualButtonWindow`(38)
- **`mail`** — Mail list rows, attachment claim, empty state
  - `UIGMMailTool`(57), `UIGMMailTool_DetailPopup`(31), `UIGMMailTool_ItemAddPopup`(28), `UIMailBox`(26)
- **`player-data`** — Profile panel, stat rows, save/load feedback
  - `UIGMPlayerBanTool`(94), `UIGMPlayerDataTool`(66), `UIPopupConfirm`(12)
- **`quest-achievement`** — Quest list, progress rows, reward claim, categories
  - `UIAchievement`(44), `UIGMAchievementTool`(91), `UIGMQuestTool`(96), `UIHUD`(13), `UIQuest`(31)
- **`ranking-advanced`** — Multi-board tabs, season header, rank rows
  - `UIGMRankingTool`(148), `UIRanking`(39), `UIRankingHUD`(12)
- **`ranking-basic`** — Leaderboard rows, own-rank pinned footer
  - `UIGMRankingTool`(68), `UIRanking`(23), `UIRankingHUD`(8)
- **`resource`** — Currency/energy headers, refill timer, gain popup
  - `UIGMResourceTool`(37)
- **`shop`** — Product list, purchase confirm, currency header
  - `UIGMShopTool`(27), `UIShop`(16), `UIShop_Purchase`(18)
- **`worldshop`** — Premium shop tabs, item cards, price pills
  - `UIGMWorldShopTool`(27), `UIWorldShop`(23)

Digests live at `data/packages/<package>/<Screen>.txt` (38 screens). Read only the screen you are building.
