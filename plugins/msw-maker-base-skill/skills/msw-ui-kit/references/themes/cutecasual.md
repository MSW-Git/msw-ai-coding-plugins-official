# UI Theme — Cute Casual (`ui-resource-cutecasual-package`)

Harmonized UI RUID palette extracted from **ChuChuBurger** (original MSW world), published as [`ui-resource-cutecasual-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-cutecasual-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Base (129)

- **ChatBalloon_Textbox_Small** 100x100 `5000213d7ed4477a9a768736ff0781dd` — text: #FFFFFF@28+o#36240B x4 (Title), #36240B@26 x4 (Desc), #635743@24 x1 (Desc), #635743@27+o#FFFFFF x1 (ItemName) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **ChatBalloon_Textbox_1** 100x100 `277783e1ece94a31935d0d92b0f88768` — text: #635743@24+o#FFFFFF x6 (Title), #635743@26+o#FFFFFF x6 (Value), #72634B@26 x1 (UIText)
- **Panel_BG_Round** 100x100 `fbf4da2cad8e46599e95186e8ca82b54` (Sliced) — text: #FFFFFF@28+o#927338 x1 (EmployeeName), #736752@28 x1 (SkillTitle), #FFFFFF@28+o#7A5D1F x1 (ChuChuLevel), #FFFFFF@28+o#594315 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **ChatBalloon_Price** 100x100 `fa38390b79434182852e89ded7d3067e` — text: #635743@28+o#FFFFFF x1 (Count)
- **ChatBalloon_Tip_Filter** 100x100 `03d991db79bf4348b001270d5d8b6b82` — parts: Icon_Tip_Filter 48x24 `e797792d2c534d0b81e046a2e71c250b` — text: #72634B@24 x49 (9), #72634B@24+o#FFFFFF x4 (Text), #FFFFFF@26+o#918370 x2 (TypeTitle), #635743@24+o#FFFFFF x2 (Title) +3 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Count_Roulette** 100x100 `528f6c23a13e45aebf6e1a0cbf927132` — text: #72634B@24+o#FFFFFF x1 (TimerText)
- **Panel_ChuChu** 100x100 `2106e7b7edb74b8599f029b972315032` (Sliced) — text: #FFFFFF@28+o#8D6C3C x2 (SkillTitle), #8D6932@26 x1 (UIText), #FFFFFF@24+o#927338 x1 (TypeName), #635743@26+o#FFFFFF x1 (Name) +2 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Difficulty_2** 100x100 `10dafcf41c3c48a69a45c670c0601a9d` (Sliced)
- **Panel_Item_Training** 100x100 `99548f8df04d4997b364ab5b0894765d`
- **Panel_Paper_ChuChu** 100x100 `517f55caf96c456b9b66d03c8ac14565` — text: #646262@24 x3 (NoSkillText), #FFFFFF@28+o#735B44 x3 (Title), #856C4C@24 x3 (Desc), #FFFFFF@36+o#9C7B48 x2 (Title) +17 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **ChatBalloon_Panel** 100x100 `7118dda5ec1f4b778d976ee225a8c6d2` — parts: Icon_Tip_ChatBalloon 16x16 `4f1c24cd50fa4c8098b44bfb911a6130` — text: #694723@26+o#FFFFFF x3 (UIText)
- **Panel_Pop_St02** 100x100 `b72a08f5f8204035b120d26f40321e57` — text: #FFFFFF@38+o#64492E x5 (Title), #FFFFFF@30+o#7D5D25 x2 (Money), #FFFFFF@38+o#64492E+s#64492E x1 (Title), #806A5D@28 x1 (EmptyText) +16 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Desc_White** 100x100 `74aca352367d45bb8ad00d223977c296` (Sliced) — text: #4F3924@28 x2 (Name), #816742@24 x2 (Desc), #60503B@32+o#FFFFFF x1 (Title), #8B7B63@26+o#FFFFFF/70% x1 (Desc) +10 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Brown** 100x100 `12c68dd021444b619b9fbb28e9ae1cbe` — text: #FFFFFF@32+o#C15E14 x2 (TryOnceBtn), #FFFFFF@22 x1 (Grade), #FFFFFF@26+o#735747 x1 (Name), #806A5D@26 x1 (Desc) +5 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Hud_Info** 100x100 `24189221debc4b81a4f3d35e6606634a` (Sliced) — text: #FA5246@24 x4 (ItemMonthlyWage), #62543E@26 x4 (ItemMonthlyCustomerCount), #FFFFFF@30+o#36240B x4 (UIText), #36240B@26 x2 (CategoryFinance) +4 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Hud_Money** 100x100 `3d4660a897204faea0eecdd3ad756130` (Sliced) — text: #36240B@32 x4 (Value), #36240B@28 x2 (Tooltip), #574C3E@24 x1 (Text_Info), #36240B@20 x1 (DiamondInfoTooltip)
- **ChatBalloon_Reward_Desc** 100x100 `6acc7b7fdb59436883f66a8dbdca9ea2` (Sliced)
- **Panel_Hint** 100x100 `6a6e329dc1b74c8ab5a44a8745e43371` — text: #FFFFFF@26+o#796848 x3 (CompleteText), #635743@28+o#FFFFFF x3 (LeftDayText), #604F3A@32 x3 (UIText), #FFFFFF@26 x1 (CloseText) +1 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Auto_Result** 100x100 `ddbc3c386a574ea799fe4eb1117dcea2` — text: #FFFFFF@32+o#7A634C x3 (Title), #646262@24 x3 (NoSkillText), #FFFFFF@26+o#776240 x3 (Title), #856C4C@24 x3 (Desc) +5 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_BG_Slot** 100x100 `89862c14198546048a28854f6f81967f` — text: #957958@26 x1 (PolicyExplanationForValueText1), #FFFFFF@32+o#C15E14 x1 (Button)
- **Panel_Recipe_Pad** 100x100 `adf744ac762a4056852a7b32de816342` (Sliced)
- **Panel_Reward_BG** 100x100 `cfc38067d82a4eb0ae888003c5c8edaf` (Sliced)
- **Panel_Tab_StgInfo_Off** 100x100 `189b591b4e694a25a57e7d68aa7e1be1` (Sliced)
- **ChatBalloon_Textbox_2** 100x100 `cd4fc03ceb624ac7a9c5ff76d0f5560f`
- **Panel_Paper_Ingredient** 100x100 `95e67b52f7e146d2802c6845452791bc`
- **Panel_Recipe_Fresh** 100x100 `429ea5587d4046bfbfda7311954a743f` (Sliced) — text: #72634B@26+o#FFFFFF x6 (PriceText), #FFFFFF@26+o#5F6F16 x3 (NameText), #72634B@24+o#FFFFFF x3 (SpicyInfo), #72634B@28+o#FFFFFF x1 (CountText) +2 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Desc_YL** 100x100 `cd3d902c6e454ca5a0c00126476d1d9f` — text: #000000@24 x1 (Title), #72634B@32+o#FFFFFF x1 (PriceText), #FFFFFF@28+o#816449 x1 (Title) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Deco_Grade** 100x100 `fbf0b3d01d9c46419f21ca7855d99635` — text: #FFFFFF@42+o#253F15 x3 (RankText), #D7D7D7@30+o#253F15 x3 (ScoreText)
- **Panel_StageList** 100x100 `ff9b587a776b4a7ab6833a02f6392a03` (Sliced) — text: #4C3319@34+o#FFFFFF x1 (Name), #FFFFFF@26 x1 (Ing), #FDEEBE@38 x1 (ComingSoon), #455F12@28 x1 (Title) +7 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **ChatBalloon_Order_List** 100x100 `71096806821f43eaa19161b441d5b427` — parts: Deco_Order_List_Tip 36x28 `94b893ca52244cdca159f2afd390c81c` — text: #FFFFFF@30+o#978976 x2 (Title), #9C8D7C@26 x2 (Text)
- **Panel_Slot_Bg_01** 100x100 `da17d62eb62e4c83866a45a84cd10f19` — text: #FFFFFF@22+o#C5444E x1 (UISprite), #FFFFFF@22+o#79551B x1 (UIText)
- **Panel_Desc_Training** 100x100 `bf60500a5e61411cbfa7aea1405ec98d`
- **Panel_Training_Upgrade** 100x100 `0bc068b33d154593ba1618259530bfd0` (Sliced)
- **Panel_Pop_Event_btm** 100x100 `021b91cf03044cc1b13654108b429f2c`
- **Panel_Pop_St02_Blue** 100x100 `cb1f9312d3814526be50b6381c574bba` (Sliced) — text: #3E3668@28 x3 (PopupMessage), #FFFFFF@38+o#5C409E x2 (Title), #FFFFFF@32+o#C15E14 x2 (PopupBtnOK), #FFFFFF@32+o#9F1F15 x1 (PopupBtnCancel) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Desc_Roulette** 100x100 `1e891c8c318a43eeb9f239a3688a0069` — text: #72634B@24+o#FFFFFF x10 (Star1), #72634B@24 x1 (Title), #FFDA33@44+o#402F18 x1 (Result) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_ChuChu_List** 100x100 `27322464405d4c19b9e97e88ed0df461` (Sliced)
- **Panel_Stage_BG** 100x100 `2c9042cee22e40738fb3ea7a915a77a0` (Sliced) — text: #FFFFFF@32+o#492302+s#492302 x1 (TitleText), #FFFFFF@40+o#492302+s#492302 x1 (DayText)
- **Panel_Tab_StgInfo_On** 100x100 `4043c56d30de408cb46d83c6eaee1991` (Sliced)
- **Panel_Icon_Tab_On_Small** 100x100 `7a69ab85130e49a9b9d26ae3cc9434f6` — text: #FDEEBE@24 x1 (LockText), #FFFFFF@28+o#985F05 x1 (PassGroupNameText)
- **ChatBalloon_Textbox_3** 100x100 `b92bff63d0f04060bb856109849dec9f`
- **ChatBalloon_Textbox_4** 100x100 `2deb5285914448de9330abc7d129e7a1`
- **ChatBalloon_Textbox_Time** 100x100 `9aa5035c925a4d6f863eda8f59e58d56` — text: #72634B@26+o#FFFFFF+s#72634B x1 (Text)
- **ChatBalloon_Side_Right** 100x100 `af850a6bb76748cd9fb4a7cb7d6c7ec3`
- **ChatBalloon_Lobby_Monthly** 100x100 `f9e454b0ae294220ac048d2ea7e66f63` — text: #FFFFFF@26+o#36240B x1 (Title), #36240B@26 x1 (Record) **[split surface: light AND dark text both used — pick by region, never assume one]**
- …+84 more — grep `data/themes/cutecasual.ruids.json`

## BG (41)

- **Img_Trial_Cooking** 255x150 `16a01821185c49ed8e4cf9e6b7e2c869`
- **BG_Training_1** 222x158 `d9a02a58cc57425598b46d7184bafdfe`
- **BG_Training_5** 222x158 `0a8b71555e7a4f1a8f08a2abdc7320dc`
- **BG_Trial** 222x158 `ba61e6b505b440ad8c57d7d13a2ed542`
- **BG_Training_Foothold_1** 222x158 `11b5d1d0cc244f5b948a679c8a625e01`
- **BG_Training_2** 222x158 `524a3ee37823493893eab99205d7d5b2`
- **BG_Training_Foothold_2** 222x158 `12f18967e1d746e7aa0b37704fe3716e`
- **BG_Training_3** 222x158 `9bca4d2d52fc4a94ba750392d7ee0e28`
- **BG_Training_Foothold_3** 222x158 `070592da56134dbb90753a13876b9a30`
- **BG_Training_4** 222x158 `abe3b9413be44f9a840fee126d2d216d`
- **BG_Training_Foothold_4** 222x158 `a52952dc2691451f9e7c06665d64fd31`
- **BG_Training_Foothold_5** 222x158 `336dfb63714b4e93ad569d6df6a4a1bf`
- **BG_Training_6** 222x158 `f0d7a995a1ab41c49e3b50526dd9d93a`
- **BG_Training_Foothold_6** 222x158 `eafe4d8d3bbb4a9f9b6347a7c2d0d117`
- **BG_Training_7** 222x158 `fabcb5d3bc154bc5aa34afc2892de460`
- **BG_Training_Foothold_7** 222x158 `cce15100f4134c7aa82b372e03486583`
- **BG_Training_8** 222x158 `a1f617b208334b08ab640caa0998e27c`
- **BG_Training_Foothold_8** 222x158 `ba3cd5a97c6341fbb68909b2b0585f8b`
- **BG_Training_9** 222x158 `7cc57dab815f42e2a7ce7d27c277ed87`
- **BG_Training_Foothold_9** 222x158 `ba85ce3cffc440719b61963fb66b2483`
- **BG_Muto** 222x158 `b4c96d1bbdff417386d14b4fe4725e96`
- **Img_Trial_Serving** 255x150 `b00224cb8a55405e9a2579c9bd3a69c4`
- **Img_Trial_Chicken** 255x150 `a2ab8c664be24f20b33f0d4c8451b42f`
- **Img_Trial_Fish** 255x150 `77f88a65f7654e9ab96bbbea21a09b0b`
- **Img_Trial_Hot** 255x150 `653fb43f27394121870b53581ab164ba`
- **Img_Trial_Meat** 255x150 `800ff5c87d5e434da760a34cea5d9109`
- **Img_Trial_Vege** 255x150 `a57fb4afea224fdb8f254623e98f2a7d`
- **Img_Customer_Recipe** 255x150 `5d309facbbd34aff9c1b2cd6bee6e181`
- **Img_Customer_Trend** 255x150 `a9eb93751a4f4872a19cc0425c63f221`
- **Img_Customer_NoTrend** 255x150 `ddc5b9b035e94487bb1d6bfc0aee5ef3`
- **Img_Customer_Vege** 255x150 `93605ba20b144f4e8d663b978ce297e1`
- **Img_Customer_Hot** 255x150 `4321a8e532cd402997bce613c46c749d`
- **Img_Customer_Meat** 255x150 `4e677b896bd24dbb9a83f426bc5dbbec`
- **Img_Customer_Chicken** 255x150 `059f75f3fc0349c2b8e10707890eb7d6`
- **Img_Customer_Fish** 255x150 `8eb5bba6a7a04712bc86d6eb3ec851e7`
- **Img_Customer_Trial** 255x150 `ec63d1f383b24d909eea22cc748bc91b`
- **Img_Customer_Interior** 255x150 `f5761987d2494ca3910b47901a9d6dac`
- **Img_Customer_Furniture** 255x150 `cc234b9eced1437293f89b78b4cc4567`
- **Img_Customer_Expand** 255x150 `0c01799b8f5a41d088c50acd9e2ed031`
- **Img_Btn_BunSkin** 255x150 `3e57b3fbbe2e4cae8268db30d7c90f58`
- **Img_Btn_Equip** 255x150 `bcd4111cf21a4016a325f558ca8cbad0`

## Button (93)

- **Btn_Default_OR** 120x120 `7c014c28f4284370b09fb493f8194202` (Sliced) — text: #FFFFFF@32+o#C15E14 x7 (UIText), #FFFFFF@26+o#C15E14 x5 (UIText), #FFFFFF@28+o#C15E14 x5 (BuyText), #635743@26+o#FFFFFF x3 (CostText) +6 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_Back** 120x120 `8cb32e13e64d434fa1605ffdd0261a72`
- **Btn_Yes_OR** 120x120 `8094f81aa0c2463195e20da6fa046d8f` (Sliced) — text: #FFFFFF@28+o#AF7016 x3 (UIText), #FFFFFF@30+o#AF7016 x3 (ButtonUnlockInfo), #FFFFFF@26+o#AF7016 x2 (CostText), #635743@24+o#FFFFFF x1 (Tooltip) +2 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_Default_RD** 120x120 `1496dcb920b1445bbb06b64b3dc7e16f` (Sliced) — text: #635743@26+o#FFFFFF x3 (CostText), #FFFFFF@26+o#9F1F15 x2 (UIText), #FFFFFF@32+o#9F1F15 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_Tab_On_St2** 120x120 `c126e98243bf4c7cbfa7bcbb278b0f60`
- **Btn_Info** 120x120 `07be8d61ffc841ccbeb24f3ef950a801` — text: #635743@24+o#FFFFFF x9 (ToolTip)
- **Btn_Square_OR** 120x120 `4214714d3bca4cdfb28c3724a8906926` — text: #FFFFFF@28+o#A15205 x3 (Text)
- **Btn_Tab_Off_St2** 120x120 `6cc87742434e42e3b3a988e83142db83`
- **Btn_Brown_St2** 120x120 `84875550e8f54585a2cc4ccf0d71c5d8`
- **Btn_MainMenu_Orange** 120x120 `4bb584fcade34125a388f136a98459d3` (Sliced) — text: #FFFFFF@26+o#6D4D14 x8 (TitleText), #FFFFFF@28+o#6D4D14 x2 (TitleText)
- **Btn_Circle_YL** 120x120 `d0656357750947f68d914321b4994261`
- **Btn_Yellow** 120x120 `ace686d5d348471e941f3778a064c2af` — text: #FFFFFF@30+o#907335 x4 (ButtonText), #FFFFFF@30+o#6C5623 x3 (UIText), #FFFFFF@26+o#907335 x1 (CostText)
- **Btn_Yellow_Small** 120x120 `03bd033900c2489fbe22c7a41fe22a11` (Sliced)
- **Btn_CL_Round** 120x120 `8b45c2cbcd9648e584e40c9df142f491` — text: #BB9A59@30 x3 (UITextDesc), #FFFFFF@28+o#000000 x2 (Text), #FFFFFF@30+o#985F05 x2 (UITextDesc)
- **Btn_Yellow_Small_2** 120x120 `0198d59b48de40799a40002e24361952`
- **Btn_Delete** 120x120 `5aa4a7529dd74d10a9f7971a872b498b`
- **Btn_Skip** 120x120 `32bcc3c8b8e74580a8c7dd3a3eafc255` (Sliced) — text: #FFFFFF@24+o#8A693D x2 (Text)
- **Btn_Yellow_Big** 120x120 `452032ad70d74e008b600ae9038b5802` — text: #FFFFFF@26+o#493511 x1 (PassLevelNameText)
- **Btn_Square_YL** 120x120 `8fdc7881f16b4783ba11803bc14b80dd` — text: #FFFFFF@28+o#BA6909 x1 (Text), #FFFFFF@26+o#BA6909 x1 (Text)
- **Btn_Hud_Square** 120x120 `90e103e8c7f8496c81b05e95b5aa7415`
- **Btn_Hud_Small** 120x120 `181348a4e80c49c09670edd42fda7a50`
- **Btn_Plus_Minus** 120x120 `d48c2bc7370d43158e62ccef8a2a0fb6` (Sliced) — text: #FFFFFF@35 x2 (Minus), #818181@50 x2 (Icon), #72634B@50 x2 (Icon), #8B693E@30 x1 (Max) +1 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_GR** 120x120 `c74198bdd7c84b91864787ee82a22870` — text: #FFFFFF@24+o#2A420B x4 (Title), #FF3F3F@36+o#FFFFFF+s#FFFFFF/90% x2 (Count) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_MainMenu_Blue** 120x120 `d4f8d8d2e3d047729b769cbbd8616077` (Sliced) — text: #FFFFFF@26+o#6D4D14 x4 (TitleText)
- **Btn_MainMenu_Red** 120x120 `3002f830425f4a08a49d5f90b287eaac` (Sliced) — text: #FFFFFF@26+o#6D4D14 x4 (TitleText), #FFFFFF@24+o#6D4D14 x1 (CloseToEndText)
- **Btn_No_RD** 120x120 `856e5ee90b0141b8b089a0d4bca5ce48` (Sliced)
- **Btn_Yellow_Circle** 120x120 `80c84ee4b8544f61a663238f2fdc27a7`
- **Btn_Balloon_Off** 120x120 `ecd48cb0475c4dd698cca2d77d113ae1` — text: #72634B@32+o#FFFFFF x2 (TokenNum), #72634B@24+o#FFFFFF x2 (TokenText)
- **Btn_Auto_Equip** 120x120 `5c5eadf5254b409aa7b5369e09c5a56c`
- **Btn_Trial_Reward** 120x120 `110d33c68cb3443e971899c5913dc93f`
- **Btn_Stroke_Orange** 120x120 `34b472eea94e4369ba9dd9a04e56557b`
- **Btn_RD_Big** 120x120 `5e0e97c792ce43fab0684bf5887ce360`
- **Btn_Yellow** 120x120 `748215f83dd8433593cd68ce0a642fb1`
- **Btn_Yellow_Circle_Small** 120x120 `3a2919d0447841c78817566e3f4110be`
- **Btn_Close_1** 120x120 `9cf419b7ea33487ea792374e99855e66`
- **Btn_Minus_Red** 120x120 `f1dcd3fece0b40fe9b51ef84003de667`
- **Btn_Menu_BL** 120x120 `d34a928a0df54d42aa0d2d9af835dbb4` — text: #FFFFFF@34+o#0B719B x1 (Btn), #72634B@25 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_Square_BL** 120x120 `9bdfdf20e5c548f9a1f9b51acd51ff41` — text: #8C8C8C@30+o#06252D x1 (Text)
- **Btn_Lobby_OR** 120x120 `64f5f2c1837d4e75a67cddbb6f185c2c`
- **Btn_Hud_Big** 120x120 `ade090b3643b4110b470c4483ad2c863` — text: #FFFFFF@30+o#36240B+s#36240B x1 (UIText), #FFFFFF@32+o#36240B+s#36240B x1 (Text)
- **Btn_Default_GR_1** 120x120 `1667de997d3a40d7a08fb9a9c308ec26` — text: #FFFFFF@28+o#536C17 x1 (Text)
- **Btn_Plus_YL** 120x120 `a6eb69c57ad041f7ab9db8dae34bec4a`
- **Btn_Plus** 120x120 `8e66330dfab24da194b036720ba9449e`
- **Btn_White** 120x120 `837ba4b8616c4ac2a9b1f7ffa4a960ab`
- **Btn_Collection** 120x120 `dacf650002884077aad1acdcffc04309`
- …+48 more — grep `data/themes/cutecasual.ruids.json`

## Slot (102)

- **Slot_Dish_2** 100x100 `53de4f9f6e424163b211a32c0ebbcf93` (Sliced)
- **Slot_Square_Selected** 100x100 `ffc51ec23a5c4677b3df8440428f2b25`
- **Slot_Reward_Basic_1** 100x100 `3b8e8d79a18a4b0e8a442f956380f799` (Sliced) — text: #635743@22+o#FFFFFF x30 (CountText), #635743@24+o#FFFFFF x2 (Model_Tooltip_RightOriented), #635743@30+o#FFFFFF x2 (CountText), #FFFFFF@24+o#9D7239 x2 (Info) +1 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_ChuChu_Simple** 100x100 `45ba66b401804e8f8df24d1357dfd864`
- **Slot_ChuChu_List** 100x100 `a4efcb3e9d2e47a3ac47fda81c167aa2` — text: #6B6150@22+o#FFFFFF x3 (Text), #FFFFFF@30 x1 (Disable), #A5DC3C@26+o#253908 x1 (Text) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Dish_Lock** 100x100 `55351e0096c64011ad7b9bb6e0b94901`
- **Slot_Dish_Empty** 100x100 `9a5acfee13f94cbf97aec99616bb607f`
- **Slot_Square** 100x100 `a5b12188ef36466c90ce247212266c5b` — text: #635743@26+o#FFFFFF x9 (CountText), #A5DC3C@26+o#253908 x3 (Disable), #FFFFFF@30 x3 (Disable), #FFFFFF@24+o#9F1F15 x3 (Btn_UnEquiped) +3 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Dish_Reward** 100x100 `d0f1e5ed9f1046869f9836155da8cdb0` — text: #635743@24+o#FFFFFF x31 (CountText), #5E4F35@36+o#FFFFFF x1 (CountText)
- **Slot_Dish_Skin** 100x100 `97947391d0ed45f5973bc057130277e8` — text: #FFFFFF@26 x4 (PurchaseRewardText), #635743@24+o#FFFFFF x1 (Tooltip) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Dish_1** 100x100 `b02d992e118b41d6a9bce359015eba2e` — text: #635743@30+o#FFFFFF x3 (CountText), #635743@24+o#FFFFFF x3 (Tooltip)
- **Slot_Square_Blue** 100x100 `05da28c5137443319d8aea527b749480` — text: #6B6150@28+o#FFFFFF x10 (Quantity), #FFFFFF@24+o#468498 x10 (ExpValue), #FFFFFF@26+o#468498 x10 (ExpText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Circle_Selected** 100x100 `7af0edfdf6054795a6d7e9ba5ecbaf26`
- **Slot_Employment_ChuChu** 100x100 `fc22920926d643759eadc0027b95ec66`
- **Slot_Employment_Select** 100x100 `38fb42081f3c4235a924c60f9a262c81`
- **Slot_Trial_List** 200x200 `96b51c94307a4e2890f47d17a462152d` — text: #FFFFFF@32+o#644C2F x3 (TrialName), #FFFFFF@32+o#AF7016 x3 (SelectBtn)
- **Slot_ChuChu_LVup** 100x100 `638b8111393b44ec91acfee386ab789f` — text: #7D6342@28 x10 (MinButton), #FFFFFF@32+o#9F1F15 x2 (CancelButton), #8B7B63@26+o#FFFFFF x2 (RemainCountText), #72634B@30 x2 (CountSlice) +3 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_BM_Basic** 100x100 `dedf9be979e84c799fa812df4ea9c2f3` — text: #FFFFFF@28+o#594A2F x2 (CountText), #FFFFFF@26+o#665743 x1 (CountText)
- **Slot_Combo_On** 100x100 `eb17e4fba2844c71b467cb84b465d5d7` — text: #5C4C39@30+o#FFFFFF x1 (TxtNum)
- **Slot_Square_Blue_02** 100x100 `ac7789748cf24e948d7af5cd067c6311` — text: #6B6150@22+o#FFFFFF x3 (Text)
- **Slot_Panel_Order** 100x100 `7af20a1ceb514314a56233ac3868d1a5` — text: #000000@24 x3 (OrderType), #FFFFFF@28+o#C15E14 x3 (SubmitBtn), #FFFFFF@28+o#9F1F15 x3 (RerollBtn), #FFFFFF@28+o#796848 x3 (TitleText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Stage_Strategy** 100x100 `2fcf688b0e9847c8b863d691ce3a59f4` — text: #72634B@26 x2 (Desc), #4F3924@26+o#FFFFFF x1 (Name), #816742@26 x1 (Effect), #5E4F37@30 x1 (Name) +1
- **Slot_Stage_BluePass** 100x100 `ee2fe4c593164402a7430d5fbb8fae5c` — text: #FFFFFF@32+o#C15E14 x2 (PriceText), #FFFFFF@32+o#8B0A2E x1 (PurchaseDoneText), #FFFFFF@28+o#B75153 x1 (Title), #FFFFFF@32+o#7171AA x1 (PurchaseDoneText) +1
- **Slot_Stage_OrangePass** 100x100 `b3b4390ef62845549d373270531927fa` — text: #FFFFFF@32+o#C15E14 x2 (PriceText), #FFFFFF@32+o#2A17BB x1 (PurchaseDoneText), #FFFFFF@28+o#2A17BB x1 (Title), #FFFFFF@32+o#BB7107 x1 (PurchaseDoneText) +1
- **Slot_AutoTraining** 200x200 `d58f704efa19433daa46bb200fc8c767`
- **Slot_Deco_Side** 200x200 `ea276181aaf44204933446fc132b0578`
- **Slot_Dish_3** 100x100 `767ba5f8bccd46799529577b12ab4d3b` — text: #FFFFFF@26+o#774C1A x1 (BurgerNum)
- **Slot_Square_Selected_3** 100x100 `3d19c539b6444fc6a9d572da7d7d2ba9`
- **Slot_Achievement** 100x100 `9e87e06427454410a2f8489f7bb45933` (Sliced) — text: #FFFFFF@32+o#C15E14 x1 (Btn), #72634B@30 x1 (Title) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Deco_ChuChu** 100x100 `a6f12a4e7d054e088a3745af740aefdb`
- **Slot_Panel_OrderList** 100x100 `08f65bc4385e4727bc59e3a480e0f90c` — text: #A58F72@28 x2 (NoPinnedOrderText)
- **Slot_Bm_StageClear_Off** 100x100 `41833d99c7dc42ef96836e7b4a2fdfd7` — text: #FFFFFF@22+o#705A45 x1 (CountText), #FFFFFF@20+o#9E805D x1 (Clear)
- **Slot_Square_Selected_2** 100x100 `2fdd34b278594597a5c628264a6749f8`
- **Slot_Reward_Dim** 100x100 `3491171517e844c58db2ebce1884eb39` — text: #635743@26+o#FFFFFF x1 (CountText)
- **Slot_Hud_Info_List** 100x100 `69113f034b954541971ad6b2f8348857`
- **Slot_Stage_RubyPass** 100x100 `4f29ad1207794969bf6584ee796b8542`
- **Slot_Stage_PlatinumPass** 100x100 `355c25684222455689b197ae46bee0c5`
- **Slot_Stage_Side** 200x200 `a972f0517f4c461da8334cb3980a0826` — text: #4F3924@28+o#FFF1CC x1 (Name), #6D4728@26 x1 (Effect)
- **Slot_Dish_4** 100x100 `74d20455f4124065b207d2e7f92ceb5a`
- **Slot_Dish_5** 100x100 `f36edbcc7ac24ea38017ef8a2e381e67`
- **Slot_Dish_6** 100x100 `0fd0744f00d54b12bff53dcafbbc9b47`
- **Slot_Dish_7** 100x100 `a31cebf7f0e5471eb442ca36b00a96a0`
- **Slot_Dish_8** 100x100 `7f0380d8c18b4317b38a81a1814b4cef`
- **Icon_Simple_Normal** 100x45 `71478ce137c24588b78cd8ec445dc403`
- **Icon_Simple_Rare** 100x45 `ef10f80fa2dd45608835a837318b4298`
- …+57 more — grep `data/themes/cutecasual.ruids.json`

## Slider (27)

- **Slider_5** 84x48 `dc650016bb3a4efebfbdb68512d9e2a3` — parts: Gauge_5 84x48 `aa1bee8803814ebc94c3828d32b8bc11` (Filled)
- **Slider_Orange_Frame** 48x32 `4a5d5bf5811044338631ade8ff45b087` (Sliced) — parts: Gauge_Orange_Bar 44x32 `71c082b7efb34a7192a8387c27c0e100` (Filled) — text: #FFFFFF@30+o#714B1F+s#714B1F x1 (EffectText), #FFFFFF@32+o#714B1F+s#714B1F x1 (PercentText), #FFFFFF@24+o#8D6932 x1 (CountText), #FFFFFF@30+o#7B5C27 x1 (LevelTextText) +4
- **Slider_BalanceBar** 196x32 `10aca4ce8bd342ecba36ded9a24e79c6` — parts: Green 95x24 `07ba54a39a4343a3a0667765c90f4113`; Orange 95x24 `71dedfc5d0084193b1e2c7cd214b9200`; BalanceZone 60x24 `cf68b5fe255b46cdbb8f2a775088bcf7`; Left 8x32 `039717b072c94e589a09fcd50be818aa`; Pointer 32x40 `3a178133919e4171a09ce815f6a58a6a` — text: #FFFFFF@26+o#D0791D+s#D0791D x1 (BalanceRight), #FFFFFF@26+o#45750E+s#45750E x1 (BalanceLeft)
- **Slider_Frame_Recipe** 196x32 `10aca4ce8bd342ecba36ded9a24e79c6` — parts: Gauge_Frame_Hot 196x32 `9bf8c8d7e0cf48b8b9a6fe95daf7f263` (Filled) — text: #FFFFFF@26+o#D0791D+s#D0791D x1 (BalanceRight), #FFFFFF@26+o#45750E+s#45750E x1 (BalanceLeft)
- **Slider_Green_Frame** 44x32 `bad929e2e53e44b88e741e92723590b8` (Sliced) — parts: Gauge_Green_Bar 44x32 `0078192ecde6496ea86f6980f69961a3` (Filled) — text: #FFFFFF@26+o#698E10 x2 (GaugeText), #FFFFFF@26+o#577B02 x2 (ProgressText)
- **Slider_6** 480x26 `6a64a9ec85b147628aaa1911195efe35` — parts: Gauge_6 480x26 `fb2bed4627cc490d95b7187d163a9eb1` (Filled)
- **Slider_7** 480x26 `6a64a9ec85b147628aaa1911195efe35` — parts: Gauge_7 480x26 `a041ebad56a94233be26e99b8b353283` (Filled)
- **Slider_8** 480x26 `6a64a9ec85b147628aaa1911195efe35` — parts: Gauge_8 480x26 `f3c56c47f39e4d2d8cafb6daaeeeaf3c` (Filled)
- **Slider_9** 480x26 `6a64a9ec85b147628aaa1911195efe35` — parts: Gauge_9 480x26 `014b98a4b29346e69d6c55fc7995cf8c` (Filled)
- **Slider_10** 480x26 `6a64a9ec85b147628aaa1911195efe35` — parts: Gauge_10 480x26 `5ec1ab1869e144f98c0c83771b5a768d` (Filled)
- **Slider_Green_Frame_H35** 42x35 `34e86e4450634bf8a0d8fe2fbe00caa8` (Sliced) — parts: Gauge_Green_Bar_H35 38x29 `c585cd5d34754ce79d9b253cfdff22ac` (Filled) — text: #FFFFFF@28+o#577B02 x1 (Text), #FFFFFF@26+o#577B02 x1 (ProgressText), #FFFFFF@26+o#597D02 x1 (Text)
- **Slider_Circle_1** 130x130 `f052a9b87d214a2d99e9fcc21a85187e` — parts: Gauge_Circle_Bar_1 130x130 `6267b949bac1446691a2a3b3038aefc9` (Filled)
- **Slider_Circle_2** 130x130 `f052a9b87d214a2d99e9fcc21a85187e` — parts: Gauge_Circle_Bar_2 130x130 `b52778e8c7b642d8aa95588175ca8413` (Filled)
- **Slider_Circle_3** 130x130 `f052a9b87d214a2d99e9fcc21a85187e` — parts: Gauge_Circle_Bar_3 130x130 `f725eac63ef3402a8bf4eab7d9628f3b` (Filled)
- **Slider_Stage_Frame** 20x20 `bb82fbed1f43432d9ce156f8524d93f1` — parts: Gauge_Stage_Bar 20x20 `bcf6996ba2b34dc1a2b3579cb4d4cc58` (Filled) — text: #FFFFFF@26+o#516609 x1 (RewardTimeText)
- **Slider_Circle_Frame_S** 130x130 `b88226cfa2c742f6a16b993e5ec873ed` — parts: Gauge_Circle_Bar_S 130x130 `cb6759307e0f4bb69a4eaec25d457c5a` (Filled) — text: #FFFFFF@30+o#4C6A24 x1 (Text)
- **Slider_Circle_Frame_L** 130x130 `9852de3b58554d1198c9f8692cf74393` — parts: Gauge_Circle_Bar_L 130x130 `4535efd9d32b49b6b3fc2c4abe11de7c` (Filled) — text: #FFFFFF@36+o#4C6A24 x1 (Text)
- **Slider_Hud_Level_Frame** 92x24 `75938ee7904a47c088e0516c6a06848a` — parts: Gauge_Hud_Level_Bar 92x24 `c29e353ce8c54f8891eeb2576e992ad7` (Filled) color:#FEC800
- **Slider_Frame_Process** 68x24 `b6e794fffba841d3ae6f4f00104c1a6b` — parts: Gauge_Bar_Process 68x24 `6b152491e74146b88965e0139ba828ae` (Filled)
- **Slider_1** 32x24 `1eecadea6b3c423089457cb1e7a404d5` — parts: Gauge_1 32x24 `6ba14b88b3b143f498541ec0db1e40f2` (Filled)
- **Slider_3** 84x48 `5931eb9c57c44f3db940ca6aad3f3ac5`
- **Slider_4** 84x48 `5931eb9c57c44f3db940ca6aad3f3ac5`
- **Slider_Circle_Frame** 130x130 `f4ab411ded7f45d2a5e4d0f5a3002777` — parts: Gauge_Circle_Bar 130x130 `9ea42eec0b4c4a1b8ac8fe8d74ddefa0` (Filled)
- **Slider_Circle_Frame_Red** 130x130 `02ec47b5bfc6436ea6473f4aaaf1794c` — parts: Gauge_Circle_Bar_Red 130x130 `16f246a7ea1d4d6abfd16108415d1fec` (Filled)
- **Slider_Hud_Blank** 84x20 `ac0e855ad2a84887ab3cee1223a7ecea` — parts: Gauge_Hud_Green 84x20 `70710a65c8504073970e9732167fc949` (Filled)
- **Slider_2** 200x48 `c2307d4c8368420cb8bdce30afc40d17` — parts: Gauge_2 200x48 `9a8cd089acc747389ffa7cfbd9c8b8eb` (Filled)
- **Roulette** 1050x700 — parts: StarGauge 44x316 `267948ddcbfb42c885fd0cc9d03f7c04`; Gauge 44x316 `9555021207f04ec78eb7b38fb3fccb22` (Filled); StarIcon 36x36 `65943402c82146e6ae6f283abd3d34e9`; MesoIcon 42x42 `6d7ee60988104cf08f9dca77947dac61` (Sliced); BurgerFrame 88x88 `7a0b2d0e8d864b3ea5a22280966acbe8`; BurgerIcon 60x60 `0c110994c1094e4fab29c2b196372807`; +21 more — text: -2Count #FF4855@40B+o#2D1410, 1Count #FFDA33@40B+o#774C1A, 2Count #FFDA33@40B+o#774C1A, 3Count #FFDA33@40B+o#774C1A +1

## Resource (156)

- **Icon_Plate_Flat** 120x40 `47df0ce0fdbe45bfa954c0083915bd64`
- **Icon_Stage_Mini_02** 120x120 `5c9a4b3734bd472fb065ac118f10b59e`
- **Icon_Stage_Mini_0** 120x120 `7a6fee7392974acbb7d565300f36798f`
- **Icon_Stage_03** 250x250 `70818ca5456c4089bcad4891ae8eb1c0`
- **Icon_Stage_06** 250x250 `eeca482088b04b55b703cbea0f91495e`
- **Icon_Stage_Mini_01** 120x120 `c6b929bb96ab4e369e72e604a509ad7e`
- **Icon_Stage_Mini_03** 120x120 `d4c41dc19be34ef6b869c74d15740a7f`
- **Icon_Stage_Mini_04** 120x120 `bdb8723f7375459d8dabffb9b10f900a`
- **Icon_Stage_Mini_05** 120x120 `7049f01d9be34bb19c307b5faa5d1488`
- **Icon_Stage_Mini_06** 120x120 `128f7008e5d3474292da44b911079b08`
- **Icon_Stage_Mini_07** 120x120 `4072a0d192b54dc5bfc2730dc742d2bc`
- **Icon_Stage_Mini_08** 120x120 `d310b5f4083e428d8ba48745aa85f5c0`
- **Icon_Stage_Mini_09** 120x120 `45c31b16c26f451e81cd4df4d55a50d6`
- **Icon_Recipe_Chicken_Nugget** 120x40 `0a10e13bb8d94afd84b31abc641e8160`
- **Icon_Recipe_Mushroom_Button** 120x40 `d03f86e38fc7436cb2128ace9323dd22`
- **Icon_Recipe_Cucumber** 120x40 `36a918647b544ed5ad71f3838934528e`
- **Icon_Recipe_Lettuce_Iceberg** 120x40 `a1bec9edb11b4988a86178a789a7eb66`
- **Icon_Recipe_Cheese_Cheddar** 120x40 `ab2617b5ce134ddf959033bad38369b9`
- **Icon_Recipe_Beef** 120x40 `8ea779878779401b956416cef5ef1645`
- **Icon_Recipe_Shrimp** 120x40 `4edf2f65a2ec4703a76db793123beab3`
- **Icon_Recipe_Onion_Raw** 120x40 `5148d50ae38d477f9ab6588afc43cc19`
- **Icon_Recipe_Garlic_Raw_Slice** 120x40 `49250f32eb964cef8139fb273f518f82`
- **Icon_Recipe_Olive_Black** 120x40 `5893683e459a403eb82340f8f283dc5b`
- **Icon_Recipe_BellPepper_Green** 120x40 `7b91d3d9b8f14ed7a9e5c183cb3831bd`
- **Icon_Recipe_Tomato** 120x40 `49167ba3d0de436ca64c87d058847f86`
- **Icon_Recipe_Chicken_Fried** 120x40 `874d1aec3c394e7691aff19c1cce41a7`
- **Icon_Recipe_Patty_Bulgogi** 120x40 `057cc41616e54abfb96a48c4c49b9efb`
- **Icon_Recipe_Steak_Sirloin** 120x40 `9bf0104ff5874906b916fdd5fe4d7f8c`
- **Icon_Recipe_HashBrown** 120x40 `f3d09598430c4c8994c9068179e9a575`
- **Icon_Recipe_Meatball_Korean** 120x40 `eead7669e934424f8251e2fffa4fdfa7`
- **Icon_Recipe_PorkCutlet** 120x40 `a109287ffefa4537a7565bd1756448f1`
- **Icon_Recipe_Shrimp_Coconut** 120x40 `d5bff13c157d4a139b05e00c70406c02`
- **Icon_Recipe_Shrimp_Hot** 120x40 `1a77b343a047433596a72ddc90818009`
- **Icon_Recipe_Chicken_Fried_Hot** 120x40 `81ba41fbef0943b78773bf443a787a69`
- **Icon_Recipe_Chicken_Seasoned** 120x40 `f6b770213bd149228ba9662980153750`
- **Icon_Recipe_Chicken_WholeLeg** 120x40 `14fbdb99a5494657894f398419717cd7`
- **Icon_Recipe_Ham_Sliced** 120x40 `436f784098a446aaa7af41273e31692c`
- **Icon_Recipe_Ham_Turkey** 120x40 `40acce76ed88403ca0e3923ef42cffb0`
- **Icon_Recipe_Ham_Raw** 120x40 `dd05bb0658e347f3a4deb299dda44cd7`
- **Icon_Recipe_Sausage_Slice** 120x40 `92733498dc4149e1a3aab6c5a0f69881`
- **Icon_Recipe_Sausage_Spicy** 120x40 `1ce32dc7d5194d2181d4bdcd21d3b9bc`
- **Icon_Recipe_Salmon_Raw** 120x40 `25c0fcac6e0d4918b74deb3ba6f491e1`
- **Icon_Recipe_Salmon_Grilled** 120x40 `a332f90c67304ed895a2eb3401b83927`
- **Icon_Recipe_Salmon_FattyBelly** 120x40 `68421086892e4b358573c9aec565378f`
- **Icon_Recipe_Cheese_Mozzarella_Whole** 120x40 `3ac9b3bedd8b4b3c887f08d1ddf9c9f4`
- …+111 more — grep `data/themes/cutecasual.ruids.json`

## Tint (113)

- **Tint_Round_20** 100x100 `d6d1c1080cb742529c3e209d1b937e90` — text: #795A37@24 x1 (CommentText), #FFFFFF@22+o#715A3F x1 (BonusTitle), #FFF728@22+o#715A3F x1 (BonusText), #FFF728@26+o#6C3E02 x1 (RewardMoneyText) +1 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Info** 100x100 `0423dcf92c594efc87944a00028c4ea2`
- **Tint_Round_H50** 64x52 `ad39949a12de4a8584ed8e6eb4cbbe42` (Sliced) — text: #FFFFFF@28+o#8C7352 x10 (TotalMoneyText), #FFFFFF@26+o#7B674E x4 (EmploymentLvText), #FFFFFF@28 x3 (Time), #FFFFFF@26+o#8D6932 x3 (UIText) +24 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Deco_01** 100x100 `4920e8b7ee7643468a5807753bef00d3`
- **Tint_Round_H54** 80x56 `05c5cfd5966d41789e5b1ad47b493739` (Sliced) — text: #736752@28 x9 (Title), #FFFFFF@26+o#987F5F x9 (Value), #FFFFFF@26+o#2B5980 x7 (Grade), #FFFFFF@26+o#AF7E28 x5 (Text) +11 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Circle_36** 100x100 `f59006224a184fdeb8f9ecb09ae3af7d` — text: #635743@24+o#FFFFFF x20 (ToolTip), #635743@26+o#FFFFFF x1 (Tooltip), #FFFFFF@32+o#403939 x1 (TitleText), #FFFFFF@24 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Round_10_2** 100x100 `42f368c0bc0a43e9bcef6debef0314fb` (Sliced) — text: #856C4C@28 x1 (TextOnly)
- **Icon_Dot** 100x100 `4daf2a53501040aa89a8d11ed8388a80`
- **Tint_Circle_44** 100x100 `4eeb98e3c474433caa095add5bf686d1` — text: #FFFFFF@40 x7 (UIText), #635743@24 x1 (Tooltip) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_Brown_Title** 100x100 `a971746cec0946748504f429a777c7c7` (Sliced) — text: #FFFFFF@26+o#8D6932 x2 (Text), #846028@26 x2 (LvText), #FFFFFF@26+o#927338 x1 (GroupName), #9E835E@24 x1 (Desc2) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_BG_Menu** 100x100 `b1c6fe5820f243299aac9b8f2df7a2bf`
- **Icon_Info_2** 100x100 `d84ba7398e154992b2e3395cc38a4b01`
- **Gradient_Scroll** 100x100 `715ba2f9541b424586c970bb547e9036` (Sliced)
- **Panel_Desc_White_Top** 100x100 `ef9ce4170ca3405eac7cae81e7688d21` (Sliced)
- **Icon_Close** 100x100 `0c33c943f60b4c269d9b0130484f006c`
- **Tint_Square_st02** 100x100 `be8782fbef4e4db1ae3f9c6d3590eb02` — text: #463621@26+o#FFFCF3 x3 (RewardSlot1_Name), #FFFFFF@30+o#7B613D x2 (Title), #FFFFFF@28+o#AF7E28 x1 (SubscriptionTitle) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Round_20_Title** 100x100 `36d863dabfeb4e70aee0af058b01ea3e` (Sliced) — text: #78654D@24 x3 (Text), #6D5844@32+o#FFFFFF x1 (StageName), #9D896D@26 x1 (StageDesc), #FFFFFF@22 x1 (Ing) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Plus** 100x100 `c6e810fc41704ad2b744b63c2f22c45a`
- **Icon_Info_Balloon** 100x100 `3ec049c173514dcea835c256f93198e1`
- **Tint_Round_H56** 80x56 `402ec63f19da49e39d43375d21f2702b` (Sliced) — text: #FFFFFF@28+o#AF7E28 x5 (Text), #FFFFFF@28+o#7D5D25 x2 (ScoreText), #FFFFFF@30+o#AF7E28 x1 (CountText), #FFFFFF@30+o#987F5F x1 (CountText) +2 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Deco_Leaf** 100x100 `38d222d1fccd4483afcb6adda6e809a5`
- **Icon_Arrow_Tint_2** 100x100 `b0a74423c30b49bdb418d5937ceb41e5`
- **Panel_ChuChu_Stat** 100x100 `2a6a810a9b484849a0057db28603f97a` (Sliced) — text: #856C4C@26 x9 (Text), #FFFFFF@26+o#8C7352 x9 (Count), #6B6150@26+o#FFFFFF x3 (SpeedLevel) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Round_H44** 60x44 `4596bf7ad73c4627a43bd9aff5c95bdf` (Sliced)
- **Icon_Watch** 100x100 `7209ecd7b44845fb9aaea412c81cfba4`
- **Panel_Desc_White_Side** 100x100 `e5bdbbd4b79f4ce7956f57e12080581e` (Sliced)
- **Tint_Deco_Gradient_StageGauge** 100x100 `e53d6dd932a24381931190333626f3ad`
- **Tint_Round_H38** 48x40 `1a781ce290044d1fa2069b1afb58ba02` (Sliced)
- **Icon_Reset** 100x100 `4234d59ffb744f0394cf5a6694198be7`
- **Icon_Arrow_Tint** 100x100 `c550cadddaa0410ca2c86290e05bf95c`
- **Icon_Type** 100x100 `7582caed7c3e4b69921dd154d90596d4` — text: #FFFFFF@30+o#695133 x2 (Name)
- **Panel_Hud_Info_Pattern** 100x100 `f8881ed3c005472a95134806d8852871`
- **Tint_Round_30** 100x100 `6d025e5609c2430b837b7662689fe0fc` (Sliced) — text: #6B573D@28 x2 (PruchaseDescText1), #FFFFFF@28 x1 (InfoText), #CBC4B2@24+o#000000 x1 (PolicyText), #FFFFFF@28+o#7F623D x1 (LevelUpRewardTitleText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Round_H48** 56x48 `eb4c1db0cddb41f5b032a8b5b54c9b24` (Sliced)
- **Icon_Reset_Big** 100x100 `f5964c1bfc3f41c3b3f60e6a21f4eac7`
- **Icon_Minus** 100x100 `ae7cce9f299344c1ad5adab38b30e880`
- **Icon_Filter** 100x100 `c07af1d03a614dcab4e573cc8f7997bc`
- **Icon_Filter_2** 100x100 `f3ccce2392be4824a66f9ba6884d3487`
- **Icon_Tag_Small** 100x100 `2297ba892dbf4bd09a93d54d045a9066`
- **Deco_Panel** 100x100 `5745fea68cb849c180a4cf9fa2b9f2dc`
- **Deco_Part_Info** 100x100 `82694ea66c2749199275198a0db977bc`
- **Tint_Square_st01** 100x100 `37da3ca1a2e14cae832c03ccec65a094` — text: #FFFFFF@32+o#846840 x2 (Name)
- **Panel_Hud_Info_Bottom** 100x100 `ee4fddbe1d8549ac9758c61cd47fb1e8`
- **Icon_Shadow** 100x100 `1017b56203214f24b30ed211cb20a0b8`
- **Tint_Round_30_Title** 100x100 `a8ab4067794f40af9df54eda4618028a`
- …+68 more — grep `data/themes/cutecasual.ruids.json`

## Icon_1 (382)

- **Icon_Lock** 60x60 `6ed3f4ee6b3e4078be7c7cd1d9e68b5c`
- **Icon_Red_Dot** 60x60 `3af9b8375087419fb1b509de5060f6cf`
- **Icon_Gold** 60x60 `6d7ee60988104cf08f9dca77947dac61` (Sliced)
- **Icon_Chu_Cook** 60x60 `c9b09ef2db2c45a5b0e8c4f8b1827079`
- **Icon_Check** 60x60 `40cf31c68b9c41c381d86f17e4eaa31d`
- **Icon_Check_Small** 60x60 `84e2190c1cb546738f9778fc87e570f3`
- **Icon_LunchBox** 60x60 `bd7ed10738124fe592de0e62400bd26d` (Sliced) — text: #FFFFFF@30+o#907335 x3 (Count)
- **Icon_Cook_Tab** 60x60 `1e41533d59f54cd8901e0bd31bb26961` — text: #000000@20 x1 (EmployeeCount), #FFFFFF@28+o#8C6F53 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Clover** 60x60 `1023fe6739ad4f4f9c985a0d6b98c2df` (Sliced)
- **Icon_ChewSet_On** 60x60 `ffd6bbfb3cc44a86a9ab1989995169d6`
- **Icon_Pin** 60x60 `d9636c1bc954454b81476beb3b44577a` (Sliced)
- **Icon_Dish_Muto** 60x60 `f273000d7e694af496e3f024860aa940`
- **Icon_WorldCoin** 60x60 `a8f3146382c07494d8dbce9b93c1a5c3` (Sliced) — text: #635743@30+o#FFFFFF x1 (ItemCountText)
- **Icon_ChewEquip_On** 60x60 `d2eb9e98c80e43c8ab3be3da9fe553d5`
- **Icon_Order_VIP** 60x60 `6512629e3fbc41088846de3f41089cf7`
- **Icon_Btn_Recipe_Finish_Hover** 60x60 `d8304091ad5945b395d0d53482aa796f`
- **Icon_Chu_Move** 60x60 `f5f867dc77fb4ded8e9bd7a46bd57f58`
- **Icon_Serving_Tab** 60x60 `19b4cbd961934ed387b4ae080435585a` — text: #000000@20 x1 (EmployeeCount), #FFFFFF@28+o#8C6F53 x1 (UIText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Tag_None** 60x60 `fcc3dfb6b07f4159a11e3a145062d27c` (Sliced) — text: #FFFFFF@24+o#B2B2B2 x5 (TagText), #FFFFFF@26+o#B2B2B2 x1 (TagText), #FFFFFF@28+o#594D39 x1 (TagText)
- **Icon_Action_GoOut** 60x60 `af2986d1a1664a4b935addc65915c135`
- **Icon_Preset_Bg** 60x60 `f65cf352af7b4fb585144cceaaaee348` — text: #FFFFFF@18 x2 (UIText)
- **Icon_Heart** 60x60 `b517bb433bd5453e8778a0a22b5734b6` (Sliced)
- **Icon_Star_On** 60x60 `65943402c82146e6ae6f283abd3d34e9`
- **Icon_Type_spicy** 60x60 `9a1150b1d4624e2dbff078cc02b54f10` (Sliced)
- **Icon_Menu_Shop** 60x60 `ed136e5692364d31b2af2c65c2d941cf`
- **Icon_Recipe_Research** 60x60 `5c6a284c715e454686aca1f927c98f3b`
- **Icon_Delivery_Outcall** 60x60 `0d32289149c744c0b09c875fa9afa07f`
- **Icon_Grade_Up** 60x60 `fa19563ce5124b739178b24481dfb927`
- **Icon_Star_Off** 60x60 `951bbeade75f4063a618b30da34bdad2`
- **Icon_Star_On** 60x60 `47036e53ab9f40f687f1aff17cc4078d`
- **Icon_Making_Taste** 60x60 `eb4d76afded8477cb5bf18c8749964a9` (Sliced)
- **Icon_Type_fish** 60x60 `c0829ffb1bd940e6b589121e1897e06a`
- **Icon_Hud_Select** 60x60 `7c5861fd54fd4abda6b1701b377c531f`
- **Icon_Btn_Quit** 60x60 `8e1eb908084c4b54bd8cdc0a06a9092c` — text: #FFFFFF@28+o#6D4D14 x1 (Text)
- **Icon_Preset_On** 60x60 `9a860eab2c514e489b7eef6132b02840`
- **Icon_Arrow_Select** 60x60 `cf274751032e4e60bfa5b5a32e1ee089`
- **Icon_Arrow_Yellow** 60x60 `3a178133919e4171a09ce815f6a58a6a`
- **Icon_Arrow_Analysis** 60x60 `77e33cbeea704bf6a5e8165aaf4aa137` — text: #FFFFFF@30+o#624829 x2 (StartLvText), #F7EDD2@26 x2 (StageBonus)
- **Icon_Arrow_Guide** 60x60 `e999df09c3474ab1a8269e3d6df7de61`
- **Icon_Training_Past** 60x60 `1ef407785ea346798669c5f5b3ab18d7` — text: #36240B@22+o#FFFFFF x4 (TurnName), #FFFFFF+o#911D1D x1 (Finish) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Recommend** 60x60 `6532ebc20a2b44c89210ead4ab7e0a84` — text: #FFFFFF@26+o#A7330B x3 (UIText)
- **Icon_Type_meat** 60x60 `66302220bfdf489ab2d77ecf90246212` (Sliced)
- **Icon_Collection_Ingredient** 60x60 `8b87c4131d82406ebee244021c1a915f` — text: #FFFFFF@28+o#6D4D14 x1 (UIText)
- **Icon_Collection_Chuchu** 60x60 `9c64038a4b3d41959eabe8badf682184`
- **Icon_Sun** 60x60 `33f4a4d126d64ae1ba05a77b4d714a1e` (Sliced)
- …+337 more — grep `data/themes/cutecasual.ruids.json`

## Icon_2 (247)

- **Icon_Ingre_Lettuce_Iceberg** 60x60 `519588f2ed904ae5a4dadcc6ee398ff9` (Sliced)
- **Icon_Text_New** 60x60 `d6e6224a0fb34aba91886886c6f31ee6`
- **Icon_Ingre_Bun_White_Top** 60x60 `a3e409703aac4184827c9cbfca0e4537`
- **Icon_Ingre_Cheese_Cheddar** 60x60 `e0612b576cfc42379ec7579ff4af9ea4`
- **Icon_Text_SP** 60x60 `cc6f5521cbd04100aa7411c06fcf4b97` — text: #FFFFFF@24+o#8A693D x2 (StageLevelText)
- **Icon_ChuChelin_Complete** 100x60 `2434a8446ccb44a28216617db917076b` — text: #C3A878@32 x3 (UIText)
- **Icon_Burger** 60x60 `0c110994c1094e4fab29c2b196372807`
- **Img_Text_3** 60x60 `f9afbe8328e6491683b2f102f754a456`
- **Grade_H** 70x50 `a26d571f935e43d6a6e01b67c1a5fe08`
- **Grade_A_Plus** 70x50 `5c80da1cda4f462fa9fbfde66e334f88`
- **Grade_SS_Plus** 70x50 `fe1777ca147b49358e82f465da1f2734`
- **Icon_Bun_PinkBean** 60x60 `b532cf02f02d4c5c84011c1f5988c4cd`
- **Icon_Bun_RibbonPig** 60x60 `031dd54a42124da1805f572cbd0381c2`
- **Icon_Ingre_Bun_Potato_Top** 60x60 `bd88c52d0525445cb9cd03a3280a39f0`
- **Icon_Text_Max** 60x60 `dc91390c020c421c92775aad7610ad57`
- **Icon_Text_Best** 60x60 `04867236731d46d7944549a42fd96f79`
- **Icon_Text_Bonus** 60x60 `8a8b9eb52bfa402b822e9eee05ce8a34`
- **Img_Text_Combo_1** 60x60 `f776b453abf648889326598650d0ff31`
- **Img_Text_Great** 60x60 `bf011bbd29a84432aaf1fe34fbf4cf61`
- **Img_Text_Hot** 60x60 `08fc8ec3a6a045f2b12d25afd5e185ce`
- **Icon_Text_Italic_Great** 60x60 `7b8234f35a7d4a42aa1b6d3653439af9`
- **Icon_Text_Finish** 60x60 `d84edb857a8d41f993b89f5fb46daf06`
- **Icon_Text_Deco_Clear** 60x60 `3f8a4a4b191f467b90575a3d72c17968`
- **Icon_Deco_Menu_MainTitle** 100x60 `1c8784bd982b4d93a0d53dc0b082434a`
- **Icon_ChuChelin_Winner** 100x60 `5d61bbc6eed34035b6a2aacd79a49c94`
- **Icon_ChuChelin_3** 100x60 `b447001e2ba7417ea7d3c632b1a02348`
- **Icon_Chat_ChuChelin_X** 100x60 `01c3aaf19e9349a2b6955cbfcfb73bd0`
- **Grade_SS** 70x50 `787ab94b4fac4f91827e46b03b175841`
- **Icon_Bun_Cat_Brown** 60x60 `e6d93de8652549c68927a0f5d370f1e5`
- **Icon_Bun_Cat_Black** 60x60 `d99bba38be714a0a96aa1915f78cd691`
- **Icon_Ingre_Lettuce_Butterhead** 60x60 `66df5f5c17fc4399870de8a2ab9ebc68`
- **Icon_Ingre_Cabbage** 60x60 `dc8cd0cb6fb146d0aa957d732997c995`
- **Img_Text_1** 60x60 `57254cf420c649c38610f76f71755cc8`
- **Img_Text_2** 60x60 `5f536843a80c4bb899901bd1baf38ced`
- **Img_Text_4** 60x60 `e62beb4a286642cb8f0fee7e48b16e7d`
- **Img_Text_5** 60x60 `df3c9bf1de524fbea88a7e399bc42633`
- **Img_Text_6** 60x60 `1cb6ac616b0143c4825e0c47d546dd79`
- **Img_Text_7** 60x60 `2352ce09ac754950a0f5588ee1db7a13`
- **Img_Text_8** 60x60 `8f1fa0d9d8d5461d9612de193e9c1b6b`
- **Img_Text_9** 60x60 `6b69c89ea9364ad8af6b4c59b62204f0`
- **Img_Text_0** 60x60 `373983bbc9854f7980e634cbc03ccfde`
- **Icon_Text_Combo_2** 60x60 `40939c80a38a4e0183a76e88370b3068`
- **Img_Text_Bad** 60x60 `56a329ac3c5b4c7d94ef03dc54635eb7`
- **Icon_Text_Italic_Bad** 60x60 `4d00fc736da54dbaa3c282d23b3d795f`
- **Icon_Text_Italic_Good** 60x60 `cd60f19feb5843f4ae685e1aeef81dc4`
- …+202 more — grep `data/themes/cutecasual.ruids.json`

## Icon_3 (133)

- **Icon_Crystal_Cooking_05** 80x80 `3c5d6b299f214cbe81d1edf5b12c13a6`
- **Icon_Diamond** 80x80 `c81394a61a9c40e29841d7169aa5d465` (Sliced) — text: #FFFFFF@24+o#714B1F x6 (Count), #FFFFFF@22+o#714B1F x2 (Count)
- **Icon_Skill_Delivery** 80x80 `54117f06afd24b8e95dce3aa17fe2e11`
- **Icon_Skill_ArcaneBonus** 80x80 `54f62bf596d6421db4a217af094875e8`
- **Icon_Crystal_MoveSpeed_05** 80x80 `49327025c40044b580caf9bfc6c9a3ce`
- **Icon_Skill_Cooking** 80x80 `a3f17829c6c045549fb50a1480273103`
- **Icon_Skill_Recipe** 80x80 `2ec7cd3dedc545a6b35b1050d164ed57`
- **Icon_Skill_CookSpeedUp** 80x80 `adddb55db3204351ad110f628f6e76ef`
- **Icon_DiamondShop** 80x80 `1c864bec5fbd4997930910a6edaffffe`
- **Icon_Suitcase** 80x80 `2fc0645097f74670aea2882166319964`
- **Icon_GoldPig** 80x80 `b4bd5fb3d2134ab6bfd4533a2a5330a4`
- **Icon_StagePass** 80x80 `96d70ce1b9c24f19af4751fd18a4cfe2`
- **Icon_StagePass_2** 80x80 `8e7dca106816432793bd5dc1d7b40a22`
- **Icon_Delivery_Efficiency_Up** 80x80 `f95609244e9c44b2be304cfd0a0b81c3`
- **Icon_Crystal_MoveSpeed_01** 80x80 `e0ac6705eac847038f9d85f03c890b89`
- **Icon_Crystal_MoveSpeed_02** 80x80 `50a49e1ce6c24dd595689bf8f5d5c661`
- **Icon_Crystal_MoveSpeed_03** 80x80 `d11d222d5e564fe8982a5094c5820b47`
- **Icon_Crystal_MoveSpeed_04** 80x80 `10fc8cee80234217852620317da8f0cb`
- **Icon_Money03** 80x80 `70b0cb9789044a9f9df0e55dd1ad9cc2`
- **Icon_Diamond01** 80x80 `11018217aca84c53bce5df36bef1698a`
- **Icon_Diamond02** 80x80 `6746e44d4b9c45ee81f030ba601c6a9e`
- **Icon_Key** 80x80 `ca87423d38c4401c8eaf24ed9b4f6845`
- **Icon_StagePass_Ruby** 80x80 `0d4525d7246d4bc98ac26175bec4a47d`
- **Icon_StagePass_Silver** 80x80 `ed824bc813f843d8a54f9a5b928c9934`
- **Icon_StagePass_Gold** 80x80 `56f1d3b070a8447aacc9fb3ef975acf7`
- **Icon_StagePass_Platinum** 80x80 `8520402600894ea2865b8fe901ed5140`
- **Icon_KitchenCounter_Add** 80x80 `a7440dac81cc44d6aed3086f1975f2f0`
- **Icon_Sub_PremiumIngredients** 80x80 `0c1f80c3c66045b688ef7bafcb9c324a`
- **Icon_Landmark_Whale** 150x150 `53d877ba4e43454ab794d7497f582d47` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Restaurant** 150x150 `6d86637f45984ee8a066228bc91dccff` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_NightMarket** 150x150 `e887fda0ff7347a099b959d6eca72004` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Plaza** 150x150 `75703affe33745a481f4e0ad4b4b359b` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Mooto** 150x150 `6a41e1be667b40efa94ac81d37367d57` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Pond** 150x150 `96e4a57f2d694e95816d663f3663246d` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Trail** 150x150 `5df1142dcee4449389ae2071899b4a61` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Landmark_Forest** 150x150 `58ed89eb2c2c45969b84e09fc233d14c` — text: #72634B@28+o#FFFFFF x1 (NameTag), #635743@24+o#FFFFFF x1 (ItemNameBalloon)
- **Icon_Deco_Stage_Blue_1** 105x105 `de643758da5341d48ad86469bd2b6df7`
- **Icon_Deco_Stage_Blue_2** 105x105 `c1d1ef2477fc40d4941513482006ac24`
- **Icon_Deco_Stage_Orange_1** 105x105 `11e5fc4511eb497888b93d6bd00e4cbc`
- **Icon_Deco_Stage_Orange_2** 105x105 `35a4c76f2c264f2bbe685e69a8615e2f`
- **Icon_Deco_Stage_Orange_3** 105x105 `8abcc9420aa14a599a91ac2cd4d047f8`
- **Icon_Deco_Stage_Orange_4** 105x105 `369a01e94f334bd6893e4af8b665b9fb`
- **Icon_Deco_Stage_Ruby_2** 105x105 `7e989769437044699735ee777dc76f88`
- **Icon_Deco_Stage_Platinum_2** 105x105 `fd33d25d694b4489a3831cc8f50ff427`
- **Icon_Deco_Stage_Platinum_3** 105x105 `0fd201f989934cb4ae0828b6a40099d5`
- …+88 more — grep `data/themes/cutecasual.ruids.json`

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#FFFFFF`** — 756 uses (sizes 18–42; mostly on LobbyHUDGroup, RecipeGroup, TrialGroup)
- **`#635743`** — 164 uses (sizes 22–30; mostly on StageInfoGroup, AutoTrainingResultPopup, VIPOrderGroup)
- **`#72634B`** — 157 uses (sizes 14–50; mostly on RecipeGroup, IngreBunCollectionGroup, TrainingGroup)
- **`#FA5246`** — 28 uses (sizes 22–26; mostly on LobbyHUDGroup, EmployeeManageGroup, AutoTrainingResultPopup)
- **`#736752`** — 28 uses (sizes 26–28; mostly on IngreBunCollectionGroup, OverLimitGroup, RecipeGroup)
- **`#856C4C`** — 23 uses (sizes 24–28; mostly on TrainingResultPopup, TransferGroup, EmployeeManageGroup)
- **`#6B6150`** — 21 uses (sizes 22–28; mostly on EmployeeUpgradeGroup, AutoTrainingGroup, TransferGroup)
- **`#8B7B63`** — 21 uses (sizes 24–26; mostly on AutoTrainingResultPopup, TrainingResultPopup, RecipeGroup)

**Outline: 1135 of 1563 text nodes (73%).** Most used: `#FFFFFF` x344, `#6D4D14` x56, `#7A5D1F` x46; typical `OutlineWidth` 0.36 (also 76 with a `+s` halo — `Underlay` at offset 0, a flat ring, not a drop shadow).

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (28)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/cutecasual/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`AchievementGroup`(56), `AutoTrainingGroup`(133), `AutoTrainingResultPopup`(204), `BMPopupGroup`(14), `BadgeGroup`(57), `ChuchuCollectionGroup`(217), `EmployeeManageGroup`(434), `EmployeeUpgradeGroup`(170), `EmploymentGroup`(186), `ExchangeSettingGroup`(89), `IngreBunCollectionGroup`(302), `LobbyHUDGroup`(589), `ManagementGroup`(61), `OverLimitGroup`(163), `RecipeGroup`(734), `RecipeSetGroup`(216), `StageInfoGroup`(530), `TrainingGroup`(186), `TrainingResultPopup`(147), `TrainingSettingGroup`(140), `TransferGroup`(94), `TrialGroup`(394), `UIPiggyBankGroup`(69), `UIShopGroup`(108), `UIShopPurchasePopup`(33), `UIStagePassGroup`(243), `UpgradeGroup`(104), `VIPOrderGroup`(214)

Long-tail lookup (all 1667 RUIDs incl. every icon): grep `data/themes/cutecasual.ruids.json` by part name keyword.
