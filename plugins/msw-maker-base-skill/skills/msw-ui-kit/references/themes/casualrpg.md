# UI Theme — Casual RPG (`ui-resource-casualrpg-package`)

Harmonized UI RUID palette extracted from **MapleSoulHero** (original MSW world), published as [`ui-resource-casualrpg-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-casualrpg-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Panel (5)

- **Panel_1** 666x360 `f47ee45115114234bd8a140b5d02729c` — parts: ExitButton 80x80 `a1a9b34404134537a718f38cdf9d9a02` (Sliced) — text: #7DB3FC@28 x19 (Title), #FFFFFF@26+o#000000/20% x7 (CategoryButton), #FFFFFF@24+o#589334 x7 (Button_Equip), #899BBF@24 x6 (Empty) +18 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_4** 1161x516 `c5df9f2ce82141d999f6c8a17fd78268` (Sliced) — parts: Ok 328x90 `fc7aab99a8e549e58d891d50f594ecd6` (Sliced); No 328x90 `ab05ba935aeb49448a9dda69998e20fa` — text: #7DB3FC@28 x14 (Title), #899BBF@24 x11 (PopupMessage), #FFFFFF@24+o#589334 x10 (Ok), #FFFFFF@24 x7 (GuideText) +9
- **Panel_3** 631x316 `98f27273363b4f089b980d1538e6b432` (Sliced) — parts: TopPanel 631x98 `4d156f1ac7e34018801a8d72ff44a599`; ExitButton 80x80 `5b1bb1bcbd304e5991c58d72b1df06c9` — text: #FFFFFF@32+s#0874DE/50% x1 (TopPanel), #FF0000@45 x1 (PopupMessage) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_2** 648x308 `72da16ab71a74cf392404b91a4916940` — text: #899BBF@28 x2 (Text_Title), #FFFFFF@40+s#000000/72% x1 (ExitButton), #B1BFDF@24 x1 (Text_Guide_Hammer)
- **Panel_5** 1177x537 `785cacd8c36b4e1bb9040df26683f949` (Sliced) — parts: UIText_1 1156x100 `c2c6e3d00c4340ce97f91a50b7d89fb8`; ExitButton_1 130x101 `3fa84442296e4a59bcc5ed6e7ba632f6` (Sliced); Icon_X 36x35 `c6ac7299e3174a9e9e1fff0de8adfdec` (Sliced) color:#E7E7E7 — text: #FFFFFF@20+o#416CB9 x6 (PauseButton), #FFFFFF@40 x1 (UIText_1), #FFFFFF@24 x1 (CharacteristicCoin)

## BG (1)

- **BG_1** 647x473 `5daa2b4312cf4d3ab0555661027a45d3`

## Button (13)

- **Group_1** 681x97 — parts: Button_1 200x75 `97489de646b843b5afe0fd30677988de`; Button_2 200x75 `53535e31b205418aaa2410b4f671fc30`; Button_3 200x75 `64fbe1caf483408f949ad5200b554ba7` (Sliced)
- **Group_2** 1154x97 — parts: Button_4 200x75 `680e8f1997ed470a8f599c1f671a36a8`; Button_5 200x75 `8b409ad1b4024963b5854cfab6452762`; Button_6 200x75 `c7b38a460c434e0aa6901e187062ff10` (Sliced); Button_7 200x75 `2adacd69ad85477ea61bb31d49b0bcf6`; Button_8 200x75 `1b817e998fc340709279e8d9b92b4b8e` (Sliced)
- **Group_3** 1850x104 — parts: Button_10 200x75 `f18c71f5f4944a17ab3ad127e09b5529`; Button_11 200x75 `9d76e8f269f3437ab99cd72b5e76814a`; Button_13 200x75 `a96386f9ef2148f48aef7b33234fe032`; Button_14 200x75 `6b99a36e97c94303a2d7dd75c3453096`; Button_15 200x75 `dcb7b47e9c5048e09f56691f1b29fd29` (Sliced)
- **Group_4** 1603x156 — parts: Button_16 300x130 `345bb836122d431881f04f4603f0ea1f`; Button_17 300x130 `a921b49abb4c4808a9749bdfa1bd049d` (Sliced); Button_18 300x130 `7fac58a22128418aa7c9f843facfd4ce`; Button_19 300x130 `7dc0a010da0a48539e4a9aa69184afc9` (Sliced); Button_20 300x130 `5e6ddfb6e9314f5c9c4f57fd576c94a2` (Sliced)
- **Group_5** 1054x142 — parts: Button_21 100x100 `25c8903550a44121a19713d45485193f`; Button_22 100x100 `63606ce01e07416aaf7186e454a8879c`; Button_23 100x100 `5813bc6bd7524f51951d11faa534eb56`; Button_24 100x100 `affef48538564b6f9c55695a6096a0dd`; Button_25 100x100 `6e4ce9a60f3c4f949ceb073cab3e61f5`; Button_26 100x100 `efa9c46318a448c5b8ea2e5d4f414fc6` (Sliced); +3 more
- **Group_6** 535x142 — parts: Button_30 200x100 `bf5103e7f62948999e355c322dfbff4c`; Button_31 200x100 `ebf5e286d16447ff8f01a44f009723e8`
- **Group_7** 235x124 — parts: Button_32 100x100 `7d63a1abcd6b481595287cae63f5837d` (Sliced); Img_Icon_Auto_1 40x37 `4e39e50e5b7246acb1eab518362943d7`; Eff_Auto 146x146 `1354242afedc477eaa907d8b56f49d26`; Keyboard_1 22x22 `bfd698656dbc4c888676a9763a004698`; Eff_Skill 206x204 `37ffe7b28c7b4549b83614f859979a39`; Icon_Skill 70x70 `ca8585d627be449eb97fb4269a4f55eb` color:#818181; +1 more
- **Group_8** 235x190 — parts: Eff_Extra 330x330 `0244f9410c41466392dd1ac7179ebeb5`; Skill_Cover 160x160 `b4257635e2b444e8ae052b9aa283c0fd` (Filled) color:#008AFF/60%
- **Group_9** 580x200 — parts: Button_35 250x109 `994e2ad676fe4b4c9782186b06f02a4a` (Sliced); Button_36 250x109 `6cb1470eea884424886399b0fc9f3c95` (Sliced)
- **Group_10** 580x276 — parts: Button_37 305x108 `a98b037c6b0f45288ce63cb8414b83b5` (Sliced); Button_38 305x108 `75ff2132ace346358699f21009389b99` (Sliced) color:#A0ACCA
- **Group_11** 1260x150 — parts: Button_39 100x100 `696e733ea814437aabf5787d87a05f31`; Button_40 100x100 `ceae3d16e44c4451ad2f00f892660854`; Button_41 81x88 `eae769d4347244f7ae705feaf2907c05`; Button_42 88x87 `5c1b7afbdab74cd6b2552eef5f601516`; Button_43 78x79 `c3c8e41b557142b9a60bcecec9c0f947`; Button_44 81x85 `006fef164b24486fb14cb4e0d9936698`; +6 more
- **Group_12** 1260x150 — parts: Button_51 71x86 `e68223a4393d411486e01b7e8a3da26b`; Button_52 91x95 `4365086454a34750b5585f987ab300ad`; Button_53 89x97 `6ed2ac5197a7447abdb14cc645590e9c`; Button_54 100x100 `999582d2244f46b5aaa1761df6c9805a`; Button_55 100x100 `9423a5b194cd41bcb9f2ef8b802929d5`; Button_56 100x100 `d3820b8a4b054234a70b0afbab15b6db`; +5 more
- **Group_13** 1260x150 — parts: Button_62 50x62 `3c97d9d55e814174ad04a38ebe3e9127` (Sliced); Button_64 61x60 `fa84845ce37841129187340e92667b2b`; Button_66 50x50 `42bd41a15d05485a9950173c09527e7c`; Button_67 50x50 `033fda676a434a11be518dfa45e2d3e2`; Button_68 50x50 `60630efead6f4327adec33f9fb006b29`; Button_69 50x50 `2dacf012eb87469fbecea84018117365`; +7 more

## Slot (3)

- **Group_1** 618x150 — parts: Slot_1 100x100 `2502dac4d15a46f4ab26445abd1cc7f9` (Sliced); Equipped 106x106 `49cdc13b44ee4b6db236ff7dc8e9efc5` color:#B3E825; Category 42x42 `f8410525a90f4e2e8be0ae22623944f3`; CategoryIcon 32x32 `9e43df083ac14fdf9927c04fe947ad71`; Level 30x22 `4ec480eced2b46d2832287d622cf77f2`; Grade 32x32 `7a78a348c0e5489aabab7c6ecb8a79ff`; +7 more — text: Pet_Level #FFFFFF@18B, Usable_Count #FFFFFF@18B+o#000000/50%
- **Group_2** 1731x215 — parts: Icon 130x130 `8a89eee4b5ee41b7890e3a8b9c4e4b4a`; Count 83x50 `9f591a9cdc3149859c8c91c3fdea6f80`; Cover 150x150 `eb122a1efc00481c86efe2696d20771a` color:#000000/70%; Icon 34x43 `b754262471af48769ea7fd3e1cd2a76a`; Icon 70x70 `d53743969d364b98925d31bbca0cb9f8`; Dot 25x28 `e1005c6204da49428aab3cca2cb982ee`; +19 more — text: Count #FFFFFF@24B+o#000000/70%, UIText #FFFFFF@18B+o#000000+s#000000
- **Group_3** 625x185 — parts: Slot_18 140x140 `8122dd6f67f3d9b4db8a3152172f9063`; ItemSprite 75x78 `c0a5ee2465734773bbab5a2a86e42b1f`; Grade_Alphabet 60x32 `182e895cb2b144d1bb5247469220e5c8` (Sliced)

## Slider (1)

- **Group** 1255x1053 — parts: Slider_1 1118x26 `68221c9a70128be45b3e1d383c6fc6d4` (Sliced) color:#838383; GaugeBox 1162x30 `f7964d3e9b344d5daa7d663a10557837` (Sliced); Gauge_Filled 1158x24 `2a09ffb9bcb34759abb63b1c18a44c4d` (Filled); Icon_AbilityLevel 76x67 `e9ed843e33c44024b71a463ddec7db30`; Slider_3 1121x40 `107ef62684ec4ceab3ecb71b9dad4d12` (Sliced); Img_Gauge_Acc 1105x7 `9158d77e7b71ce747a7cfa12f35b7a74` color:#FFFFFF/10%; +26 more — text: Counting_1 #FFFFFF@24B+o#000000/70%, HP_Text_1 #ECEDED@24B+o#000000+s#000000/72%, HpText #FFFFFF@22+o#000000, IconLevel_Text #FFFFFF@24B+o#402B0E +2

## Unit (15)

- **Unit_8** 400x170 `eb122a1efc00481c86efe2696d20771a` color:#000000/50% — parts: SuddenMissionTitle 400x50 `6a769454862a41c6bfd47aaada576b43` color:#000000/60%; Reward 366x80 `ecabb6fff10ac864697292bdbeda2606` color:#CDCDCD/0%; Icon 346x60 `0d9121e290f04851b7b4ee208f06c442` color:#FFFFFF/0%; TimerSprite 72x76 `92e557c68b6c4aada42de42f7361820f` — text: #FFFFFF@24+o#000000/30% x32 (StatTitle), #B5FA4C@24+o#000000/30% x32 (StatText), #FFFFFF@24+o#000000/50%+s#000000/30% x15 (StatTitle), #B5FA4D@24+o#000000/50%+s#000000/30% x15 (StatText) +7
- **Unit_9** 205x340 `d685ceb1beb9492ea5dd6ec905a1fbce` color:#232C40/50% — parts: DailyGiftDayNum 205x68 `2eafd799f3ff4b478fd2ed5019699e0d` (Sliced) color:#000000/50%; DailyGiftSprite 120x120 `0f878c5370e54070a96c9ff7df688140`; Stamp 71x49 `46c34255c019473482b09e491cf1ec73` — text: #FFFFFF@24 x33 (DailyGiftName), #FFFFFF@28 x12 (Ability_Hp), #899BBF@28 x8 (DailyGiftDayNum), #FFFFFF@24+o#589334 x8 (DailyGiftButton) +10 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Unit_1** 1044x120 `f2d0c8898b634b028c791f573d7f4a68` (Sliced) — parts: Star_1 23x24 `877d010d8bfe46bc881f26f1c7adc3ba`; CompleteEffect 187x140 `df8379ac2f9d41c28ffef124a70b502f` — text: #FFFFFF@24 x12 (Count), #FFFFFF@28 x10 (Title), #B3E825@24 x5 (Ability), #FFFFFF@24+o#000000/80% x2 (Progress) +4
- **Unit_2** 930x120 `f2d0c8898b634b028c791f573d7f4a68` (Sliced) — parts: MissionRewardButton 90x90 `c58c6f4200d4b7341ba11994d157ce12` color:#23252D; ClearRewardEffect 92x92 `8b8b29976a784279885f1bc595146f3b` color:#FFE633; RewardSprite 70x70 `cba4f8c4a4104443862d7db244848cf4`; RerollButtonIcon 90x90 `c0c177f1ff344930a9a6ca5ff011bb5b`; Icon_Info 34x31 `01a50e24d1f74b609bb9a9c6697b09d8` — text: #FFFFFF@24 x12 (Count), #FFFFFF@28 x10 (Title), #B3E825@24 x5 (Ability), #FFFFFF@24+o#000000/80% x2 (Progress) +4
- **Unit_3** 700x100 `f2d0c8898b634b028c791f573d7f4a68` (Sliced) — parts: Sprite 70x72 `04fbf96cc136489d88933efd9bf96eb0`; Count 150x60 `b4dd050e16504159a521c0e6e769bcb6`; UISprite 32x8 `ea1605bebcd7441fae0b05e824d8726e` color:#FFFFFF/90% — text: #FFFFFF@24 x12 (Count), #FFFFFF@28 x10 (Title), #B3E825@24 x5 (Ability), #FFFFFF@24+o#000000/80% x2 (Progress) +4
- **Unit_5** 1166x120 `f2d0c8898b634b028c791f573d7f4a68` (Sliced) — parts: NewbieEventPointPanel 100x100 `f2b45b4042254ef0a9c0138067a2392b` — text: #FFFFFF@24 x12 (Count), #FFFFFF@28 x10 (Title), #B3E825@24 x5 (Ability), #FFFFFF@24+o#000000/80% x2 (Progress) +4
- **Unit_14** 200x660 `52849ae90e6e4aa392d5cf856f5e359c` — parts: Cover_3 200x121 `9ff12837c41a4eff9c5331412caa3a57`; PhysicsType 200x541 `3e9d52ed52d64794bbd6f72bab8ee3d9` (Sliced) color:#FFFFFF/0%; Icon 130x130 `ffa35056d0e24c48a3a342bc7193e221`; Icon 130x130 `ab1c5650d3074d43b5ae2d94fadec43a`; Icon 130x130 `b0e74e62aa984ae387ed3882bb7a7d82`; Icon 130x130 `70880f8842d541db9eb7b7c4c78b49a7` — text: #D4D4D4@32 x5 (Title), #899BBF@24 x1 (LeftTImeText), #53596B@24 x1 (NewbieEventRemainTimeText) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Unit_4** 360x74 `9a50c1ca754f41ecb326256631542bf4` color:#000000/50% — text: #FFFFFF@28 x7 (Title_Panel), #FFFFFF@24 x6 (LevelText), #899BBF@24 x3 (LevelTitle), #7DE9FC@24+o#000000/70% x2 (ChapterTitle) +1
- **Unit_15** 469x666 `6343362b32894c5c8ac8890e25a38b28` — parts: Deco_Dark 435x264 `e31b84b71a994737b92ce5047b71a6c5`; Icon_Category 36x36 `d37581d4124c4a1cab93912154f01a2a`; Type_Buff 130x130 `01258e98da494e75886d2ba135b8edc9`; Type_1 402x247 `a5bcc5882785429aa14a40620bc8ce7b` (Sliced); Category_Magic 402x44 `f4d22c41d4eb4071b93205edd0a6e4d2`; Title 379x85 `6fc91a7377b94070a60cb35d3d8ed7b7` (Sliced) color:#1E1F20; +8 more — text: #FFFFFF@28 x8 (Type_1), #FFFFFF@28+s#000000/72% x4 (Title), #2A2D34@28 x4 (Keyboard) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Unit_11** 258x456 `6e058e4a3fec401ba2c6619f35c38fee` (Sliced) — parts: ProductSprite 148x148 `77ac57dc9e0a48f1854b86466314e5d6`; Icon_World_Coin 34x34 `7c2da7edef9c421792b42328aa349d0e`; Icon_World_Dia 34x33 `55cf3dd8c012429fb092b38af6ec0ede` — text: #605049@24 x2 (ProductNameText), #605049@20 x2 (ProductCautionText), #BC8245@20 x2 (ProductLimitText), #FFFFFF@24+o#589334 x2 (ProductPriceText) +1 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Unit_6** 528x92 `890cc18c22ad42d3bea9967b110289ad` — parts: Deco_Shadow 83x25 `a6022c4a8b90429b9bcf0854f9aa95c1` color:#000000/30%; TextCount 43x33 `129f02486c2baef49a41b31ce16171f6` (Sliced) color:#000000/60% — text: #FFFFFF@20+o#1A1A1A x2 (TextCount), #FFFFFF@20+o#5F9A3C x2 (Button_Use), #FFFFFF@25 x2 (Button_Use_All), #FFFFFF@24 x2 (TextEggName) +1
- **Unit_12** 240x320 `358e355e9933465da0a00874c09c8637` — parts: Deco_Slot 250x390 `45e9323867014623af61dbbe53971ed0`; Effect 556x556 `7b990261ad53482faf340e6e29ad29e0`; Equipped 247x300 `d091cf28ab72bcc499a0506ad7bacf98` color:#FFFFFF/50%; ExWeaponIcon 60x60 `c09fa65be7a04114805e791d443b0b7f` color:#788FC0; Outline 227x46 `02ba8404a6f547b4a233ac4e08eb7666`; ARROW 41x50 `e8d77a2ca5184a19a69725a14d765781`; +2 more — text: #FFFFFF@24+o#000000+s#000000/72% x4 (Level), #70FF00@32+o#000000+s#000000 x2 (Equipped), #FFFFFF@24+s#000000/72% x2 (Name), #FFFFFF@24+o#000000 x2 (State) +2
- **Unit_13** 274x355 `2c1345f8c3d847f8b07306cdacbff6f0` (Sliced) — parts: ProductPriceText 223x43 `a6b8019acf0f47b8b8c0fc6c47e6dba7`; Icon 44x23 `896fde94230644b79a8a994c104452ee` — text: #FFFFFF@24 x1 (ProductNameText), #6DAC0C@20 x1 (ProductLimitText), #FFFFFF@24+o#000000 x1 (ProductPriceText)
- **Unit_7** 580x135 — parts: FieldItemSprite 70x70 `thumbnail://0460288ca21e42398850a0b55938e522`; CategoryIcon 32x32 `87cf429145814827a1b159aac55234b3`; FieldItemPrice 184x50 `5a990aca536417e40bb5e01452fe374e` color:#212733/50%; Icon_Price 28x37 `c65ac390fbfd4e97963c711c05ebaac5` — text: FieldItemName #899BBF@24, FieldItemdescription #FFFFFF@22
- **Unit_10** 384x89 — parts: Icon_Quest 31x31 `8cbf1555026540569c7bc81e97e97074`; Badge_Clear 42x45 `e9dbec048cf5422883590e230934c2ee` — text: Summary #FFFFFF@20+s#000000/50%

## Base_1 (2)

- **Group_1** 783x1041 — parts: Base_1 720x150 `5af4157ff49e4d97b1d2986267848697`; Base_3 720x150 `14d21a0f23984de1b6de183a0c97e530`; Base_5 720x150 `8f037a750bfe4bad95c1a570b7450c94`; Base_6 720x150 `d6f63d4a091f4ebab1831d928f11ee71`
- **Group_2** 1070x1035 — parts: Base_7 1000x200 `d178e94695d7e354b97a29230afe77e8`; Base_9 1000x204 `5c8c164dc0fb48409dd9029b1e1af062` (Sliced); Base_10 1000x200 `8f35027df24c4376b2776202d5f5304f`

## Base_2 (4)

- **Group_3** 625x650 — parts: Base_11 590x300 `1db16c8faf594ffa8915e84d2e804e02` (Sliced)
- **Group_4** 619x650 — parts: Base_13 590x300 `21c7d9422a8c4f4da6a6af6dc23b9313`; Base_14 590x300 `788439cb3ad94c41b0ade30f989a3b2d`
- **Group_5** 620x650 — parts: Base_16 590x300 `1e5e576fa39554b4a9d4b356354219c6`
- **Group_6** 1880x380 — parts: Base_17 900x320 `9fc787336d8e462885d2a44157e971af` (Sliced); Base_18 900x323 `623bedf7ac5641a0ae6ff8ac4132bf74`

## Base_3 (1)

- **Group_7** 1847x515 — parts: Base_20 270x450 `32db959f9c474e5096e4826241e987bf` (Sliced); Base_21 270x450 `2c3c6c1336844271aa84080b2317d824`; Base_23 270x450 `fe2907f4ad614f3eb28ace458be59fb2`

## Icon_1 (8)

- **Group_1** 1850x100 — parts: Icon_1 60x60 `b256c74411674081b6f6a91d508466c3`; Icon_2 60x60 `a2567dfe4406429daf05e30bc26166ee`; Icon_3 60x60 `479f99000a41493ab60431bff706c895`; Icon_4 60x60 `002b920e8e6148e88233bf1001250bed`; Icon_5 60x60 `859f471b54d94720adfabffeb7947175`; Icon_6 60x60 `fa912ac1756d4b6dbfa02333ea93f2e4`; +19 more
- **Group_2** 1850x100 — parts: Icon_28 68x75 `5da6290efb324112a1e9df61b5aac471`; Icon_29 47x45 `bdac712ae9564f6c88e1bb2c7387d61a`; Icon_31 51x48 `065d2794b61842539640a7d71992809d`; Icon_32 48x46 `5eb88c5c48ad4b4e92ad6eed9683b2ca`; Icon_33 45x44 `4d30fa0d97494d2887ef100e305c7247`; Icon_34 48x48 `25cd5dd3ba5b491da908ff6be0a3bcb6`; +5 more
- **Group_3** 1850x182 — parts: Icon_44 80x80 `cf8b9b2806a24081aa6ca9f8d3839d26`; Icon_45 80x80 `eb7f2e475ac34aa597e08dcc508cc4c1`; Icon_46 80x80 `f3016accb3d04988b77af201678eac6a`; Icon_47 80x80 `28145fc80c784312979e4542d0e7f99a` (Sliced); Icon_49 80x80 `9cff692190eb472fba4f6d0e68f213a7`; Icon_50 80x80 `46b7da69a2c141a6854abd436a70af8a`; +16 more
- **Group_4** 1850x100 — parts: Icon_67 80x46 `a0175616badf4993b0facfb5dbea0ed1`; Icon_68 58x32 `c81824b8090e4472ba218bad12f207d3`; Icon_69 47x47 `713a318768154a1cab09636a45f3a6da`; Icon_70 39x42 `3a2b728f90144aca97f04f96e91a645b`; Icon_71 47x35 `fc5b9fccddd34f899d3f807c1f476c70`; Icon_72 39x23 `ae1ed24af8cd45c0a433732291da1203`; +5 more
- **Group_5** 1850x100 — parts: Icon_82 32x32 `d361f6a0859f48b8a5c7fcfd2a06e2d9` (Sliced); Icon_83 45x32 `f08e8e6d509745918691c3140a9054a5` (Sliced); Icon_84 45x32 `d990e606d152483390373baf339fe14a`; Icon_85 45x32 `e68baaa4531b4fa793f2b577811b1b28`; Icon_87 42x40 `eb60250e4d9f4cf890e0a51b46a2f3dd`; Icon_88 42x40 `73e570067c524dc295ad2cd5a5ed2f16` (Sliced); +18 more
- **Group_6** 1850x100 — parts: Icon_111 66x66 `ef08cfd3bd334736877b4dfc3a982b48`; Icon_112 76x87 `cf19d7b9b18c40e08f2f3c21a8543566`; Icon_114 35x43 `fac471fa6056439ea98345c998465384`; Icon_116 50x50 `09ce54e6dda040dcac8a2cdf2d558579`; Icon_117 50x50 `cdc2214ca7334b42aee12ab295b9d2c8`; Icon_118 50x50 `418b381709a647f7a20ec725a4b9b731`; +10 more
- **Group_7** 1850x100 — parts: Icon_129 60x60 `97fcb02e28fb4215bef1b1a4859f4b38`; Icon_130 60x60 `65fc3371b0c94513ab2077fb66ac8385`; Icon_131 60x60 `7337363e86fb4ba7a4d1ebc8794d7b50`; Icon_132 60x60 `5abf4b477fd946f2a6091f16ea64e0d2`; Icon_133 60x60 `305f7aeb598e4ef79f3b983ef73b702a`; Icon_134 60x60 `d5c304dfa5024c1686a06b670d7bcb03`; +5 more
- **Group_8** 1850x100 — parts: Icon_140 80x80 `d1e16fe8275549cfb1ccb74ec2161cf5`; Icon_141 80x80 `4409643fdd834f23b775661bc71cc320`; Icon_142 80x80 `f646555c90a2421a8143ef280d0149d8`; Icon_143 80x80 `0b4cfd4052fc43768cf52c1b96a0c922`; Icon_144 80x80 `04c25e388c71475bbdb41732ef5eb5d8`; Icon_145 80x80 `3a4620925a8a4ca182812fc222de4f57`; +8 more

## Icon_2 (3)

- **Group_9** 1850x185 — parts: Icon_155 80x80 `32773813706f430db7bc9cb14e30480a`; Icon_156 80x80 `6cad8831ac144e2c88aa76e5d9d95942`; Icon_158 80x80 `3379ace452914603bd333b90e3714f17`; Icon_159 80x80 `a44d20d4666d45afbcc4967f7bc830e2`; Icon_160 80x80 `39df9830d42c4bc0b6d5984ceb0e393b`; Icon_161 80x80 `b9b6daa2479c453aa0ff627b03c2c3aa`; +21 more
- **Group_10** 588x731 — parts: Icon_188 100x100 `3e06cb70335e407dbe190117345e7375`; Icon_189 100x100 `7593a46f6c774030b67db570ad34307a`; Icon_190 100x100 `5c419e4e006e4b37b4738f7293b3197a`; Icon_191 100x100 `ee3d08daa3164da3a08caaa7642df98f`; Icon_192 100x100 `9c0ef8c6cc9c4189979e263f7c9c3409`; Icon_193 100x100 `4a635df90c784fa9aaff4a3ea774d6f3`; +24 more
- **Group_11** 1130x718 — parts: Icon_218 100x100 `d8bd5f08d6c44f3b95f93805c5dbc6a8`; Icon_219 100x100 `f13fa49658ec45f38ff8f8c832ba67c8`; Icon_220 100x100 `6075ec95e7294c0c8b56cf4a78d5cfbb`; Icon_221 100x100 `a0636906edc6440caa7fed4508435e21`; Icon_222 100x100 `72be57aa8da240c4a2ce3aa36d0ecfa8`; Icon_223 100x100 `542eb89fdde6449a9f449ad4cdf02f7f`; +33 more

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#FFFFFF`** — 887 uses (sizes 15–56; mostly on Inventory, Soul, Unit)
- **`#899BBF`** — 86 uses (sizes 20–28; mostly on Inventory, Soul, Ranking)
- **`#7DB3FC`** — 40 uses (sizes 24–32; mostly on Inventory, Soul, Panel)
- **`#B5FA4D`** — 38 uses (sizes 18–40; mostly on InGameLevelUp, StageMap, Soul)
- **`#B3E825`** — 34 uses (sizes 18–24; mostly on Inventory, Collection, Slot)
- **`#B5FA4C`** — 32 uses (size 24; mostly on InGameBossHUD, InGameHUD)
- **`#CDEB30`** — 21 uses (sizes 24–26; mostly on Inventory)
- **`#2900FF`** — 16 uses (; mostly on PlayerCharacteristic, Unit)

**Outline: 623 of 1315 text nodes (47%).** Most used: `#000000` x167, `#000000/50%` x124, `#000000/30%` x65; typical `OutlineWidth` 0.2 (also 160 with a `+s` halo — `Underlay` at offset 0, a flat ring, not a drop shadow).

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (20)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/casualrpg/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`CashShop`(164), `Collection`(298), `Crafting`(164), `DailyGift`(69), `DailyMission`(56), `DialogueBox`(16), `InGameBossHUD`(113), `InGameHUD`(137), `InGameLevelUp`(203), `InGameResult`(39), `Inventory`(1227), `LobbyHUD`(143), `NewbieEvent`(71), `Option`(44), `PlayerCharacteristic`(137), `Quest`(36), `Ranking`(88), `Soul`(436), `StageMap`(188), `WeaponStorage`(262)

Long-tail lookup (all 619 RUIDs incl. every icon): grep `data/themes/casualrpg.ruids.json` by part name keyword.
