# UI Theme — Super Simple (`ui-resource-supersimple-package`)

Harmonized UI RUID palette extracted from **Getting Over It Maker** (original MSW world), published as [`ui-resource-supersimple-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-supersimple-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Panel (4)

- **Panel_01** 483x348 `d666dc7e4fc84bffa95dede21cc316e6` (Sliced) — parts: CancelButton 50x50 `d9ccefd2469048ebbfbf4a07f5a5b583` (Sliced); SaveButton 237x72 `762648601a704516a395792e0e46d74c` (Sliced) color:#12C4B6 — text: #847252@30 x33 (TitleText), #FFFFFF@34 x8 (Title), #847252@70 x8 (Text_SlotNumber), #FFFFFF@28 x5 (SaveButton) +29
- **Panel_03** 851x577 `d666dc7e4fc84bffa95dede21cc316e6` (Sliced) — parts: InputText_1 700x65 `694f1c3b44b846fa9ceb55718a6492ba` (Sliced) color:#E9EDC5; InputText_2 700x134 `bdd5cc037155465f88f5d843789e57d6` (Sliced) color:#E9EDC5 — text: #847252@30 x33 (TitleText), #FFFFFF@34 x8 (Title), #847252@70 x8 (Text_SlotNumber), #FFFFFF@28 x5 (SaveButton) +29
- **Panel_04** 981x754 `d666dc7e4fc84bffa95dede21cc316e6` (Sliced) — parts: DescBG 854x264 `c83d901bab8547cf96443030d8ef50d7` (Sliced) color:#E6EBBB — text: #847252@30 x33 (TitleText), #FFFFFF@34 x8 (Title), #847252@70 x8 (Text_SlotNumber), #FFFFFF@28 x5 (SaveButton) +29
- **Panel_02** 486x204 `1770565d64de4bd49c5584ea8e465a75` — text: #FFFFFF@30 x3 (YesButton), #847252@28 x3 (MapNameText), #847252@30 x3 (PhysicsEnable), #807663@30 x2 (DescText) +5

## Base (5)

- **Base_01** 719x164 `70488759d34a4e65ac76bc3a18c30fe0` (Sliced)
- **Base_03** 630x174 `bf40f2310a0341bcb18a26022288854f` — text: #847252@26 x2 (UIText)
- **Base_04** 364x142 `d4edf8038db5411e884326a4f26a8cb3` — text: #FFFFFF@36 x1 (Title_Text)
- **Base_05** 216x52 `73e30cdad5da4060b6756ef5c301d0e0` (Sliced)
- **Base_02** 756x228 `197efc0ad455470887cd872e9078a582` — text: #847252@22 x1 (Text), #CC9C48@22 x1 (User)

## BG (3)

- **BG_03** 600x400 — parts: BG_Pattern 600x400 `0bde4eff9aa64eae8a4e30c65d223ba9` (Tiled) color:#E7D95E — also: BG_04
- **BG_01** 600x400 — parts: BG_Top 600x140 `8c9f4def2c6e4368b50d3546207273a9`
- **BG_02** 600x400 — parts: BG_Top 600x140 `7d3374f6fae147feb3dfc5648e89ab65`

## Button (25)

- **Button_01** 240x72 `762648601a704516a395792e0e46d74c` (Sliced) — text: #FFFFFF@28 x8 (UIText), #847252@28 x5 (TextEquipCostume), #BBAE96@20 x3 (NameText), #BBAE96@24 x3 (UIText) +11 — also: Button_02, Button_03, Button_04, Button_05 +1
- **Button_Add** 56x56 `af4ed64ca7e74f07af6586b85b79c048` color:#12C4B6 — parts: Icon 50x50 `1db43baf7086484a9a7baa126ad7da76` — text: #BBAE96@24 x6 (UIText), #FFFFFF@30 x3 (UIText)
- **Button_Sort** 72x72 `af4ed64ca7e74f07af6586b85b79c048` color:#12C4B6 — parts: Icon 40x40 `e0153c2b1ac5418381dc35f95653e3d4` — text: #BBAE96@24 x6 (UIText), #FFFFFF@30 x3 (UIText)
- **Button_PlayerHistory** 80x80 `06a927e839d347b7ab9a92cc9f8e4109` (Sliced) — parts: Icon 50x50 `def4295c7827480190f7e5bdb01f5c10`
- **Button_Objective** 80x80 `06a927e839d347b7ab9a92cc9f8e4109` (Sliced) — parts: Icon 56x56 `9b4f04da4685483d8c1b62c6fbf7955f`
- **FoldTimecheck** 80x80 `06a927e839d347b7ab9a92cc9f8e4109` (Sliced) — parts: Icon 52x52 `1cf3009dde94404899bcdfd0d270b77c`
- **Button_GMTool** 80x80 `e2c7e53d4def4108ba8da6ff5b8c3912` — parts: Icon 35x35 `9d0d70fcd1f74ec0a8e654e30cc67895`
- **Button_Storage** 80x80 `e2c7e53d4def4108ba8da6ff5b8c3912` — parts: Icon 61x61 `0fd0ee91762549dfa3263fa7aefb081d`
- **Button_MyMapInventory** 80x80 `e2c7e53d4def4108ba8da6ff5b8c3912` — parts: Icon 55x55 `db59eedb467a41699b23c87ae0ac6570`
- **Button_MyInventory** 80x80 `844cfce409344d839bb5d9a4088761ff` — parts: Icon 55x55 `1cee502208874eca8b38f720631f7b84`
- **Button_Shop** 80x80 `844cfce409344d839bb5d9a4088761ff` — parts: Icon 55x55 `f9e3861365f048bda2b41afb15fa8af0`
- **Button_Storage** 80x80 `844cfce409344d839bb5d9a4088761ff`
- **Button_Check** 50x50 `c83d901bab8547cf96443030d8ef50d7` (Sliced) color:#C7BDA5 — parts: Icon 42x42 `bbc23188bd544d5a9dec38e25e3082bd`
- **Button_Play** 80x80 `7cd390bc21f64dad9c74745e75ca2192` — parts: Icon 55x55 `654f8b920bb24d109d34066f8f54daf9`
- **Button_Rotation** 100x100 `559b26f008b34a378a15eb44cf3dae2f`
- **Button_Size** 100x100 `bd95e77993bc4e06a3cd6edaef402c10` — btn states: pressed `c245ff6521b54310a33f3d5d64389796`
- **Button_Flip** 100x100 `a3a81f058fe64dd6acdac600a8cfb7b7`
- **Button_Copy** 100x100 `a32aaeda97ce4afd88c155b2c7f12c76`
- **Button_LayerUp** 100x100 `b23899ed251741e1b00ad26186387ae9`
- **Button_LayerDown** 100x100 `ca699bccf1144ff59fecf66e40ef752a`
- **Button_Trash** 100x100 `4f4f1d07f9124f38809cfe9834017ada`
- **Button_Property** 100x100 `5315ade0b175483da2fb2fcafcc3fbb3`
- **Button** 240x91 `7461df59bbc84cafacd8bba31dc8737d` (Sliced) — text: #FFFFFF@30 x1 (Text)
- **Btn_SizeDown** 96x62 — parts: Img 40x40 `099328f05bb64390b8d9510eebdb7369`
- **Btn_SizeUp** 96x90 — parts: Img 76x40 `32df228fdce44aaeaec2cf6d5b861cda`

## Slot (9)

- **Slot_EquipCostume** 206x305 `762648601a704516a395792e0e46d74c` (Sliced) color:#EAEEC8 — parts: Item 160x160 `293164fc7a7845ed8041be934fb4a693` — text: #FFFFFF@28 x8 (UIText), #847252@28 x5 (TextEquipCostume), #BBAE96@20 x3 (NameText), #BBAE96@24 x3 (UIText) +11
- **Slot_01** 100x100 `cc3457b8e97b3e14f9d5c39ccdd640bf` — text: #847252@28 x7 (UIText)
- **Slot_Avatar** 108x116 `516b89d1635e4d7db32be5e2b6d4b04b` — parts: Thumbnail_Empty 56x72 `39c1a4fc8dcc49239fff30dd9459ee1b` color:#A9C6D7
- **Slot_Achievement** 288x342 `d178e94695d7e354b97a29230afe77e8` color:#FFFFFF/0% — parts: Default_Bg 288x342 `a7c5f38f6eb74336bbb069a57594e372` color:#E6EBBB; Badge_Img 142x142 `cf580a234d844a7c864a2f351c6710a2`; Complete_Bg 288x342 `cf5fdb06fd6b4e2698db608bb4c35daf`; Badge_Img 400x388 `150004257c3e44858e0ce0c08d47dd58`; Badge 142x142 `9900f47cf24d4b69a68394f5b3b9b684`; Item_Img 197x197 `b4f292b801c24d44ac5ad44e89ead342`; +2 more — text: #FFFFFF@28 x4 (Btn_Get), #847252@28 x2 (Title), #5A8452@28 x2 (UIText), #FFFFFF@36 x2 (Btn_Info)
- **Slot_02** 100x100 `e75c54db1fe7f7c4eb8e60e52a24623b`
- **Slot_Interaction** 150x150 `40616ad64b7f4d37951edbca1658edce` — parts: Icon 70x70 `9df74121d0dd472b89b8efa7120594e4` — text: #636363@30+o#E7E7E7 x2 (UISprite)
- **Slot_Item** 160x160 — parts: Icon 80x80 `14d135968aa141e8ab5086a2b2a56819`; Count 82x36 `6b27cbb384744cfa9b5e3546b8ed72f2` (Sliced); Equip 160x160 `53570cfe2f684ee6a993ac544233a7c2` — text: Service #9F9786@20B
- **Slot_Item_Preset** 160x160 — parts: Outline 168x169 `dec8b822696e4cad8842e92c2d5124d3`; Bg 160x160 `55bc4fdb7c83413b80c420aa5a4e750c`
- **Slot_Item_Simple** 160x160 — parts: Icon 90x90 `a9318e0c75c3409797f249302b4722ea`

## Slider (4)

- **Slider_1** 670x16 `03f6d71230384c808632bdb6dab56096` (Sliced) color:#BBAE96 — FillRect `06a927e839d347b7ab9a92cc9f8e4109` — Handle `06a927e839d347b7ab9a92cc9f8e4109`
- **Slider_3** 669x22 `54862ac688aa4844bc167796e49e26f6` (Sliced) color:#E6EBBB — text: #847252@22 x2 (Text)
- **Slider_2** 669x80 — parts: Icon 52x52 `ebb2d070b51e4fc387fdc8155892c0ee`; Icon 52x52 `8530ce8f5e9740a88f339c364a039701` — text: UIText #BBAE96@24B
- **Slider_4** 25x660 — parts: BG 52x660 `af14b4137f4a4f4d84718ef27da439a0` (Sliced); Icon 32x32 `3d2baf5d43f64f189571eb28197a5815` — text: EndPoint #FFFFFF@20B+o#26231E, StartPoint #FFFFFF@20B+o#26231E

## Unit (5)

- **Unit_02** 332x597 `762648601a704516a395792e0e46d74c` (Sliced) color:#E6EBBB — parts: Line 312x4 `6bd1f8ad60a44bcca3e177a04970c304` (Tiled) color:#CCD1A4; Icon 40x40 `e026395977704770bfc95fbdcdc3fe70` — text: #FFFFFF@28 x8 (UIText), #847252@28 x5 (TextEquipCostume), #BBAE96@20 x3 (NameText), #BBAE96@24 x3 (UIText) +11
- **Unit_04** 543x72 `762648601a704516a395792e0e46d74c` (Sliced) color:#000000/60% — parts: Icon 42x42 `96841dd80ba04fff97cf57468d3187f8` — text: #FFFFFF@28 x8 (UIText), #847252@28 x5 (TextEquipCostume), #BBAE96@20 x3 (NameText), #BBAE96@24 x3 (UIText) +11
- **Unit_01** 880x128 `1770565d64de4bd49c5584ea8e465a75` — parts: ProfileCodeBG 120x36 `8e33ebcb96034af893995195af9c7e53` color:#E6EBB9 — text: #FFFFFF@30 x3 (YesButton), #847252@28 x3 (MapNameText), #847252@30 x3 (PhysicsEnable), #807663@30 x2 (DescText) +5
- **Unit_03** 374x164 `70488759d34a4e65ac76bc3a18c30fe0` (Sliced) — text: BestTimeTitle #FFDEA2@26B+o#51504E, MyTimeTitle #E6EBBB@26B+o#51504E, Time #FFFFFF@26B+o#51504E
- **Unit_05** 300x1078 — parts: Nametag_1 218x40 `9c43d47df43047109b3e3cd548c7cd79`; Cam 64x64 `6d1b91dd63f24ad385f7fd6729b338cf`; Icon 54x35 `f875342972fd46d090187ea8b3b5a67b`; Nametag_2 218x40 `16c84bb635da49f493c791982f04bb19` — text: EndPoint #FFFFFF@20B+o#26231E, StartPoint #FFFFFF@20B+o#26231E, Text #847252@18B

## Tint (52)

- **Tint_RoundRect_4** 100x100 `762648601a704516a395792e0e46d74c` (Sliced) — text: #FFFFFF@28 x8 (UIText), #847252@28 x5 (TextEquipCostume), #BBAE96@20 x3 (NameText), #BBAE96@24 x3 (UIText) +11
- **Tint_Tab** 261x72 `bbff40bff00c43bb99eee92899dd0df5` — text: #FFFFFF@28 x11 (UIText), #847252@28 x2 (UIText), #A28F6F@30 x1 (UIText)
- **Tint_RoundRect_2** 100x100 `bdd5cc037155465f88f5d843789e57d6` (Sliced) — text: #847252@24 x12 (UIText_TotalMapClearData_Title), #F3B55A@24 x10 (UIText_TotalMapClearData_Result), #6DBB28@24 x2 (UIText_FirstClearData_Result)
- **Tint_RoundRect_3** 100x100 `694f1c3b44b846fa9ceb55718a6492ba` (Sliced) — text: #4F9C04@28 x3 (UIText), #847252@20 x2 (UIText), #BBAE96@30 x2 (Recommend), #847252@30 x2 (UIText) +1
- **Tint_RoundRect_H36** 220x36 `8e33ebcb96034af893995195af9c7e53` — text: #FFFFFF@20+o#26231E x9 (UIText), #B9A075@20 x2 (UIText), #FFFFFF@26+o#51504E x2 (Time), #E6EBBB@26+o#51504E x1 (MyTimeTitle) +2
- **Tint_Close** 80x80 `d9ccefd2469048ebbfbf4a07f5a5b583` (Sliced)
- **Tint_Pot** 102x102 `5217a9f151dd4da4a6d126467a6477df`
- **Tint_Hammer** 246x300 `e0fa44845a614f96b64b1313c9d0a125`
- **Tint_Plus** 80x80 `1db43baf7086484a9a7baa126ad7da76`
- **Tint_Arrow_Right** 80x80 `654f8b920bb24d109d34066f8f54daf9`
- **Tint_Arrow_Up** 80x80 `3c12779ab98d40a5958072c981916e26` — also: Tint_Arrow_Down
- **Tint_RoundRect_6** 100x100 `3691eb0e2f42440ea7e9725438d5de88` (Sliced) — text: #FFFFFF@26 x1 (UIText), #847252@30 x1 (PageNumText)
- **Tint_RoundRect_1** 100x100 `c83d901bab8547cf96443030d8ef50d7` (Sliced)
- **Tint_Check** 80x80 `bbc23188bd544d5a9dec38e25e3082bd`
- **Tint_Storage** 80x80 `0fd0ee91762549dfa3263fa7aefb081d`
- **Tint_Hand** 80x80 `9df74121d0dd472b89b8efa7120594e4`
- **Tint_Label** 88x54 `84ed705a098742b6aaba18c1ff68488d` (Sliced) — text: #FFFFFF@20 x2 (UIText), #FFFFFF@22 x1 (UIText), #FFFFFF@18 x1 (UIText)
- **Tint_Arrow_Left** 80x80 `96841dd80ba04fff97cf57468d3187f8`
- **Tint_Inven** 80x80 `1cee502208874eca8b38f720631f7b84`
- **Tint_Copy** 80x80 `2728468aa07e43968c4dafbd48dbb52a`
- **Tint_RoundRect_H88_1** 220x88 `dec9e874622a4b269fab6552a126e0c9` (Sliced) — text: #847252@30 x4 (Default)
- **Tint_Shop** 80x80 `f9e3861365f048bda2b41afb15fa8af0`
- **Tint_Mark** 80x80 `db59eedb467a41699b23c87ae0ac6570`
- **Tint_Challenge** 80x80 `9b4f04da4685483d8c1b62c6fbf7955f`
- **Tint_Book** 80x80 `def4295c7827480190f7e5bdb01f5c10`
- **Tint_Setting** 80x80 `9d0d70fcd1f74ec0a8e654e30cc67895`
- **Tint_Filter_2** 80x80 `e0153c2b1ac5418381dc35f95653e3d4`
- **Tint_Slippery** 80x80 `ebb2d070b51e4fc387fdc8155892c0ee`
- **Tint_Rough** 80x80 `8530ce8f5e9740a88f339c364a039701`
- **Tint_Bubble_2** 200x100 `e01ff4abe78546ff807e0031f4165df4` — text: #847252@26 x2 (Recommend_Title), #6DBB28@28 x2 (Recommend_Text)
- **Tint_Play** 80x80 `2339b0f708964add873dd566c1f63037`
- **Tint_Todo** 80x80 `1cf3009dde94404899bcdfd0d270b77c`
- **Tint_Filter_1** 80x80 `80fcb2e0e235412a9e8dcc6821925a47`
- **Tint_Delete** 80x80 `c01b8dd18a7c4c00ba976720f64189b6`
- **Tint_Search** 80x80 `cea0473a89f74a48845301114c6919c2` — text: #12C4B6@26 x1 (UIText)
- **Tint_Statistic** 80x80 `434a1a94ffc54184aa303b0d19748127`
- **Tint_Refresh** 80x80 `4ef31ce06bd34f8d83b8eb2e91c19b41`
- **Tint_Edit** 80x80 `4d9b207cdc5d4e0e9b7b95cef2d52bef`
- **Tint_Trend** 80x80 `081a66edb9da40eca41b180e37e08d2c`
- **Tint_Flat** 80x80 `58e8407333d94ea4bd70b23865f1eb99`
- **Tint_Bouncy** 80x80 `53569eff70e5457dafce55d0b3c3d33e`
- **Tint_RoundRect_5** 100x100 `f51159ec72df4b628633edd0e9fee0f5` (Sliced)
- **Tint_Circle** 100x100 `edb1da4314584887b45854f8c5eca0da` — text: #847252@30 x3 (MapCode)
- **Tint_RoundRect_H88_2** 220x88 `b71b01d30a3d457aa177b51531baa2e1` (Sliced) — text: #847252@30 x2 (Default)
- **Tint_Square** 100x100 `f8c7c91bc5054280a7fb0e6ddffa66e3` — text: #847252@20 x2 (UIText_1)
- …+7 more — grep `data/themes/supersimple.ruids.json`

## Icon (15)

- **Icon_Rank_1** 56x72 `7250562fb4e7402685c8a238e5ca9992`
- **Icon_Rank_2** 56x72 `0037515e9ca4436285cf6fe962cb7cf1`
- **Icon_Rank_3** 56x72 `cc7cc5ee553f4cf6a3954f91491c3e7e`
- **Icon_Tag** 130x43 `e3237e5ba12e4f719c4d4be899930736`
- **Icon_Authorized** 45x45 `ec3017f95f784498abcef95164dc4820`
- **Resource_Pot** 220x216 `4d416fb653194c0886c10ab5514847b6`
- **Resource_Hammer** 96x452 `4c054f181e984fd98594dc89c0fd94e5`
- **Icon_ETC** 80x80 `32b5379471a3457faea03d11a647c9e6` (Sliced) — text: #FFFFFF@28 x1 (BtnReport)
- **Icon_Shrink** 100x100 `0116952f619643fca492d34cfad466fb`
- **Icon_Expand** 100x100 `3297808b800a4a668b62d8bbe0b60d9b`
- **Icon_Report** 60x60 `07cf796566f9460eb27978537b41aff7`
- **Icon_Handle_1** 100x100 `8284d57889444935bc66789fe3a2bbac`
- **Icon_Handle_2** 100x100 `7c5958ff6ef743b1b786fcfb6646e2a8`
- **Icon_Flag** 74x74 `162b2bad9b89459eb524a4f24361ef9f`
- **Icon_Key** 100x100 `10ca44149ac34921b9f754f3a7e93901`

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#847252`** — 155 uses (sizes 18–140; mostly on Ranking, PlayerHistoryPanel, Inventory)
- **`#FFFFFF`** — 101 uses (sizes 15–70; mostly on HUD, Panel, Unit)
- **`#BBAE96`** — 34 uses (sizes 20–30; mostly on MapInventory, PublishMapinfo, ObjectHandler)
- **`#F3B55A`** — 11 uses (sizes 20–24; mostly on PlayerHistoryPanel)
- **`#807663`** — 6 uses (sizes 25–30; mostly on Panel, Button, PublishMapinfo)
- **`#F3855A`** — 6 uses (sizes 22–100; mostly on Panel, ClearStatus, MapInventory)
- **`#6DBB28`** — 5 uses (sizes 24–28; mostly on PlayerHistoryPanel, RankEvent_Rank, Event)
- **`#A28F6F`** — 5 uses (sizes 28–30; mostly on Objective, PlayerHistoryPanel, MapInventory)

**Outline: 21 of 363 text nodes (6%).** Most used: `#26231E` x13, `#51504E` x4, `#E7E7E7` x2; typical `OutlineWidth` 0.2.

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (19)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/supersimple/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`ClearStatus`(45), `ClearUI`(28), `Event`(35), `HUD`(56), `Inventory`(74), `Loading_Play`(6), `Loading_Wisesaying`(6), `MapInventory`(68), `ObjectHandler`(47), `Objective`(54), `PlayerHistoryPanel`(82), `PublishCheckPopup`(16), `PublishMapList`(47), `PublishMapinfo`(37), `RankEvent_Main`(35), `RankEvent_Rank`(30), `RankEvent_Result`(23), `Ranking`(56), `Shop`(47)

Long-tail lookup (all 145 RUIDs incl. every icon): grep `data/themes/supersimple.ruids.json` by part name keyword.
