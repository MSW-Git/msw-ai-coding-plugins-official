# UI Theme — Simple Fantasy (`ui-resource-simplefantasy-package`)

Harmonized UI RUID palette extracted from **MapleSlash** (original MSW world), published as [`ui-resource-simplefantasy-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-simplefantasy-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Panel (4)

- **Panel_05** 500x360 `9eee37f21d974889947d021f08bcda62` (Sliced) color:#CAC7B9/74% — parts: Img_Deco 16x16 `36338acb0cfe498cac27bf667fc29979` color:#EEEDE8; Img_Bg 32x32 `9f12067b1cfc4c4b8c745e4f66275f18`; Img_Check 36x28 `5da3f043b3bc4c179d2d1b67b2fb0ccf` — text: #757474@24 x13 (Text_Title), #757474@28 x10 (Text_Title), #FFFFFF@26 x9 (Btn_01), #EF8A59@22 x3 (Text_Value) +3
- **Panel_01** 500x360 `0f4b90db8a87477e9c7a962b045f90eb` (Sliced) — parts: Btn_Close 72x72 `07096261a9944312b01dee501fed7599` (Sliced); Btn_OK 230x88 `c2660e96661c4a6e8dc8eaa17eb0655c` (Sliced) — text: #FFFFFF@26 x19 (Text_Title), #757474@26 x10 (Text_Desc), #FFFFFF@25 x10 (Btn_StarForce), #999689@22 x6 (Label_Class) +47 **[split surface: light AND dark text both used — pick by region, never assume one]** — also: Panel_02
- **Panel_04** 500x360 `6e8e561a4582462eaad762cb11d1f835` (Sliced) color:#171F2D/90% — text: #FFFFFF@25 x3 (Text_Title), #FEFAE8@22 x3 (Text_Empty), #BBBBBB@26 x3 (BuffGroupName), #EEEDE8@30 x3 (Text_BossName) +13 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Panel_03** 500x360 `0f4b90db8a87477e9c7a962b045f90eb` (Sliced) — parts: Img_Bg 437x200 `9ca6545756a645dbaaf7da3a796546ef` (Sliced) color:#DBDBDB — text: #FFFFFF@26 x19 (Text_Title), #757474@26 x10 (Text_Desc), #FFFFFF@25 x10 (Btn_StarForce), #999689@22 x6 (Label_Class) +47 **[split surface: light AND dark text both used — pick by region, never assume one]**

## Base (12)

- **Base_Blue_03** 282x289 `e9291ac7c7c14578a46b484436c758d7` — text: #D46C50@32+o#311F11 x2 (Text), #FFFFFF@24 x1 (Text_Price), #FFFFFF@23 x1 (Text_SaledPrice), #FFFFFF@20 x1 (Text_OriginPrice) +4
- **Base_White_01** 370x150 `c26a3cc43a2347979a54ad4d35292271` (Sliced) — text: #FFFFFF@26 x4 (Btn_Receive), #6C7995@30 x2 (Text_Title), #8C99B4@26 x2 (Text_Desc), #FFFFFF x1 (Btn_ShowChild)
- **Base_Card_01** 196x264 `552a11490267476daec41dac4e8fd920` (Sliced) — text: #757474@22 x4 (Text_StatTitle), #FFFFFF@25 x2 (Btn_Select), #AB977E@26 x2 (Text), #757474@24 x1 (StatTitle) +1
- **Base_Blue_01** 301x245 `99fe6885881f4f3c9cdb1fd94a0b8f5f` — text: #FFFFFF@24 x2 (Text_Price), #FFFFFF@23 x2 (Text_SaledPrice), #FFFFFF x2 (Text_OriginPrice), #FFFFFF@20+o#607418 x2 (Label_Sale) +2
- **Base_White_02** 524x128 `56bfbdd3503340ba978baeac40681ce7` — text: #6C7995@23 x1 (Text_AbilityName), #8C99B4@20 x1 (Text_AbilityDesc)
- **Base_Info_01** 501x128 `2ea3f873108a4538849929efeb21df38`
- **Base_White_05** 364x248 `54a83e91d2c34a7bb54fe7d86f8b96bd` — text: #6C7995@30 x1 (Text_Name), #8C99B4@24 x1 (Img_ReqText), #FFFFFF@26 x1 (Btn_Exchange)
- **Base_Card_02** 544x556 `7de538928bbf45738d050d7d6e5d9b75`
- **Base_Blue_02** 300x300 `8cbc09b165434584ab615d4a9322838a`
- **Base_Info_02** 500x128 `eb4981a6029e4d4eaba58a3842766e49`
- **Base_White_03** 524x128 `f3cfdf57940b496887e0c88e21b51982`
- **Base_White_04** 524x128 `2c4bb775c9d84ce9bb89cf6dd5f7354c`

## BG (4)

- **BG_Normal** 768x432 `766893751a134664ba8849f38311021a` — text: #42526A@25 x3 (Btn_SubTab1), #FFFFFF@25 x2 (Text_Empty), #91EEF4@22 x1 (Text_JobName), #FFFFFF@30 x1 (Text_CharLevel) +5 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **BG_Dead** 768x432 `4e841a44c833450fa3abd852e6c52c5e` (Sliced)
- **BG_Success** 768x432 `20db8120574449e4b7e97ef58b9a5c5c`
- **BG_Fail** 768x432 `8ea299849bac42fe9d7243d36a2695c8`

## Button (79)

- **Btn_W190_01** 190x88 `c2660e96661c4a6e8dc8eaa17eb0655c` (Sliced) — btn states: highlighted `null`, pressed `3f1488d7416a4d62b3c4a6dc4042ad22` — text: #FFFFFF@26 x13 (Text_Sort), #FFFFFF@24 x1 (Text_AbilityDetail), #494B3F@24 x1 (Text_RemainTimeEntryCount) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Btn_Drop** 190x88 `c2660e96661c4a6e8dc8eaa17eb0655c` (Sliced) — btn states: highlighted `null`, pressed `3f1488d7416a4d62b3c4a6dc4042ad22` — parts: Img_Arrow 24x20 `5ec39b7aca674908bbdb4a7ef3e68340` (Sliced) — text: #FFFFFF@26 x13 (Text_Sort), #FFFFFF@24 x1 (Text_AbilityDetail), #494B3F@24 x1 (Text_RemainTimeEntryCount) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Button_Close** 70x70 `07096261a9944312b01dee501fed7599` (Sliced) — btn states: highlighted `null`, pressed `283fd3419a8349e683df222362652e1d`
- **Btn_W60_01** 60x60 `a284a5997dd24bf3927f8b71887c322f` (Sliced) — btn states: highlighted `null`, pressed `b6dc5346bcf044a99ba00a502e3c3f31` — text: #F3F1F1@24 x1 (Text_BattleScore)
- **Btn_Check** 70x70 `cea88f94d3dd499dad1d8664cbcef81f` (Sliced) color:#15233C — text: #FFFFFF@26 x1 (Text_MultiSelect)
- **Btn_W86** 86x86 `60b3dacf1291422a91897d49422ae16f` (Sliced) — btn states: highlighted `null`, pressed `62106a4f0e434060a4d92a7afe3596b0`
- **Btn_Return** 88x88 `60b3dacf1291422a91897d49422ae16f` (Sliced) — btn states: pressed `62106a4f0e434060a4d92a7afe3596b0` — parts: Img_Return 36x36 `4948bd19e6cd459da09b7e06796b8b35`
- **Btn_Filter** 88x88 `60b3dacf1291422a91897d49422ae16f` (Sliced) — btn states: pressed `62106a4f0e434060a4d92a7afe3596b0` — parts: Img_Filter 36x40 `fafc87dfc7354354b8b2d63ae75fd4f6`
- **Btn_Tab_02** 320x120 `ec83f469ce1440208cd5dd49cb5ddb0f` (Sliced) — text: #B3D4EC@30 x3 (Text_ShopName), #FFFFFF@30 x1 (Text)
- **Toggle_02** 115x60 `bc1d674f8f0748d3a2ebec68b1561784` (Sliced) color:#253250/0% — parts: Img_On 59x115 `2f6b4fc7c1524ed191f7552a4cd4ace5` (Sliced) color:#253250/70%; Img_Btn 60x60 `a7bc30a4e30d43abb4a52fe70537992c` (Sliced); Img_Btn 60x60 `ae87047170e84b84b44a04af194ccfca` (Sliced) — text: #FFFFFF@24 x2 (Text_Count), #84C1E7@30 x1 (Text_Piece), #FFFFFF@26 x1 (Text_PieceName)
- **Toggle_01** 84x164 `2f6b4fc7c1524ed191f7552a4cd4ace5` (Sliced) color:#253250 — text: #FFFFFF@36 x4 (Img_Preset1), #C3BFC3@36 x2 (Preset1)
- **Btn_W190_06** 190x88 `d3c485285afd4d8b9b2c0cbbfd8bd88c` (Sliced) — btn states: highlighted `null` — parts: Img_Select 212x108 `1f08c23598f04b2ab479c025ed4af1fd` (Sliced); Img_Check 42x42 `53da838e788e4d6eb7f08fa69cacaac1` — text: #FFFFFF@24 x2 (Text_Diff)
- **Btn_Tab_01** 320x120 `51a162cf670544aa87ccb1ec9cb9e3f8` (Sliced) — btn states: pressed `dda584f2e94c48e3bf9bb8ce0dfd2ade`
- **Btn_Tab_05** 320x120 `1983ab40892144f490764b16a454c032` (Sliced)
- **Btn_Cap** 72x72 `cc3e39ff09844be6884440bffad2a481` (Sliced) — btn states: highlighted `null`, pressed `06d188bb13754d87b5273be71a01f359`
- **Btn_W190_02** 190x88 `50426b5b1ee44bc5a1c10355b0e9ad03` (Sliced) — btn states: highlighted `null`, pressed `b5ce0faaa7ed411db61c022e60feadaa`
- **Btn_W190_03** 190x88 `3a72c0cef5c94f7b9b6491a997f12fb9` (Sliced) — btn states: highlighted `null`, pressed `97697b7587564251ab837713b0e5c0a6` — text: #FFFFFF@26 x2 (UIText)
- **Btn_W190_04** 190x88 `501210f182594602b16e083351ea3ab3` (Sliced) — btn states: highlighted `null`, pressed `00afa05edae044839424ba9e78053f67`
- **Btn_All** 80x80 `34781b95771d41f7a5568b88d5659a56` (Sliced) — btn states: highlighted `null`, pressed `638950a2ffe74f88a0feca0530476e20`
- **Btn_Necklace** 72x72 `f32d6dcdcdd44a98b579d06f8e3e99e9` (Sliced) — btn states: highlighted `null`
- **Btn_Shoulder** 72x72 `c9124ecda2dc42788e87e9c81cf2423f` (Sliced) — btn states: highlighted `null`
- **Btn_W156** 156x88 `0cedbf7ed89245b1ac8a4c4d7ad62f9e` (Sliced) — btn states: highlighted `null`, pressed `43e062b84ca44d539a3b9663ba6cc1df`
- **Btn_W190_08** 190x88 `d583d93f095148868a52da1cd4a932b9` (Sliced) — btn states: highlighted `null` — text: #FFFFFF@24 x2 (Text_Diff)
- **Btn_Mailbox** 70x70 `ddd22765340c4c31b6a8a01a3d902e5d` (Sliced) — btn states: highlighted `null`, pressed `ad42b142f6a34431ac32b7860552002a`
- **Btn_Plus** 70x70 `2a68a67547bc42ad8b065b95f7ff2d67` (Sliced) — btn states: highlighted `null`, pressed `b588cd70a7044b119914755c541a519d`
- **Btn_Archer** 80x80 `9554c441583b40d6896116ea3d607f40` (Sliced) — btn states: highlighted `null`, pressed `bd3165a7d9e246eb86d226111714f32e`
- **Btn_Assassin** 80x80 `06ac9b8fa75042f0b82a278bfca66d3b` (Sliced) — btn states: highlighted `null`, pressed `793cf4e2fb2142e7b9d4be1d4700300d`
- **Btn_Pirate** 80x80 `7975eff948d44351b5f08d692a98872a` (Sliced) — btn states: highlighted `null`, pressed `6ab1ca10e362416cbde68e981ed41906`
- **Btn_Warrior** 80x80 `d64d0971fc774627a2240ff7067931d0` (Sliced) — btn states: highlighted `null`, pressed `703fd5ca4e4e4c348e3353cbbabec5bb`
- **Btn_Wizard** 80x80 `db8bdc14dd454b39ad259e82276bc7dd` (Sliced) — btn states: highlighted `null`, pressed `27e54730fb5e445f99d28a4597fce238`
- **Btn_Tab_07** 320x120 `35e2ce6ee9de4a44a3448a43f8c06248` (Sliced) — btn states: pressed `0e9b951c0f334da7b30f1cc23af8a496`, selected `null` — text: #757474@32 x1 (Selected), #FFFFFF@28 x1 (Text_Name), #B1B1B1@24 x1 (Level), #CDC9C9@22 x1 (Text_Desc)
- **Btn_Cape** 72x72 `b9727d71f412438bac9906ee33c6f94d` (Sliced) — btn states: highlighted `null`, pressed `ca762680b025459c85e70e997f6330c2`
- **Btn_Glove** 72x72 `a9f0c56879dd4fc7afd0a8fa4c7eb94f` (Sliced) — btn states: highlighted `null`, pressed `18a599cb5bc94f0e93461c354fda53cf`
- **Btn_LongCoat** 72x72 `4dcf6a3ae60745e8919d19eb947e2cee` (Sliced) — btn states: highlighted `null`, pressed `c6fbafce4bbd4c478402f7cc99694bc1`
- **Btn_Shoes** 72x72 `7c9e49db961241ed9e07b10186d401ea` (Sliced) — btn states: highlighted `null`, pressed `5696abe8b7bb494a883746d3b4d4cf90`
- **Btn_Weapon_A** 72x72 `b3db6c16a7094d8ba404ebbc165cc4c4` (Sliced) — btn states: highlighted `null`, pressed `70396566cae1475fb86200bb2f2e6723`
- **Btn_EarAcc** 72x72 `514ec3f1bd1648d4bdb094924f7f2438` (Sliced) — btn states: highlighted `null`, pressed `125a42d60f7f41b1bac20810847495fc`
- **Btn_Mustache** 72x72 `27197eca67764ea9bda1196b403abbfe` (Sliced) — btn states: highlighted `null`, pressed `55a42a986ba44dc9a9f7f26384c32253`
- **Btn_W190_07** 190x88 `afa28786b49c4d17850eff171e1b211a` (Sliced) — btn states: highlighted `null` — text: #FFFFFF@24 x1 (Text_Diff)
- **Btn_Exit** 70x70 `197011b959f54703a1703639f52e6105` (Sliced) — btn states: highlighted `null`, pressed `8fadb381e50347438061629534be07fe`
- **Btn_Arrow** 70x70 `913a39bdc24b481c8dd63621d32c998d` (Sliced) — btn states: highlighted `null`, pressed `0a3e1de2c216460d800e93b9670fe4dd`
- **Btn_Option** 70x70 `65ee9c7adabc415fa233aa8373ab3380` (Sliced) — btn states: highlighted `null`, pressed `3d24f0dbe945418da8de6c9496b679be`
- **Btn_Menu** 80x80 `9b5537505c4e4ceebbbef50e8cc19248` (Sliced) — btn states: highlighted `null`, pressed `33840b755d5e4c1a92edcf062a61bcae` — text: #FFFFFF@22+o#2D2D2D x1 (Text_Menu)
- **Btn_Character_01** 80x80 `0e8c32028d234a3389d85a856b2b7564` (Sliced) — btn states: highlighted `null`, pressed `8925ec94a6894c29807453eed3c0706a`
- **Btn_Character_02** 80x80 `2594eb2c0eb94a8c910f4ea924dd0b96` (Sliced) — btn states: highlighted `null`, pressed `7351a4d3f76f4865996088e4b06560da`
- …+34 more — grep `data/themes/simplefantasy.ruids.json`

## Slot (21)

- **Img_Normal** 108x108 `aa931a755e5949699233b817029a3e36` (Sliced) — text: #343434 x7 (Text_Name), #FFFFFF+o#5B5B5B x7 (Text_Count), #626F83@17 x2 (Text_Name), #FFFFFF@24+o#4D4D4D x2 (Text_Count) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Item** 120x120 `aa931a755e5949699233b817029a3e36` (Sliced) — parts: Img_Icon 51x51 `d6ad676a0b7045e0a994285b3c092218` (Sliced); Img_Check 60x48 `2e36df32385a4026a963af9e552b06df` — text: #343434 x7 (Text_Name), #FFFFFF+o#5B5B5B x7 (Text_Count), #626F83@17 x2 (Text_Name), #FFFFFF@24+o#4D4D4D x2 (Text_Count) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Reward** 120x120 `aa931a755e5949699233b817029a3e36` (Sliced) — parts: Img_Select02 150x150 `c59afc900ba04483a9b64fb391c5c627`; Img_RedDot 30x30 `2860136c06ab075439721c027de365af` color:#E4573B; Img_Lock 32x32 `092a1d9b68524f83ba3a3e8e0c0f482b` (Sliced) — text: #343434 x7 (Text_Name), #FFFFFF+o#5B5B5B x7 (Text_Count), #626F83@17 x2 (Text_Name), #FFFFFF@24+o#4D4D4D x2 (Text_Count) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_ItemBig** 120x120 `6e8e561a4582462eaad762cb11d1f835` (Sliced) color:#000000/20% — parts: Img_BG 120x120 `3bee7ba0853b4fe698ff6adb5c65480e` (Sliced) — text: #FFFFFF@25 x3 (Text_Title), #FEFAE8@22 x3 (Text_Empty), #BBBBBB@26 x3 (BuffGroupName), #EEEDE8@30 x3 (Text_BossName) +13 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Slot_Normal** 510x148 `1a30dc3b686a446a8d3c353ea55e6064` (Sliced) — parts: Img_Selected 510x148 `17cc9c3e65ab404dbfd4918befec018c` (Sliced) — text: #FFFFFF@30 x2 (Text_StageName), #FFFFFF/0%@22 x1 (Text_StageLevel), #FFFFFF@40 x1 (Text_Order), #FFFFFF@22 x1 (Img_StageLevel) +1
- **Slot_Character** 120x120 `676ac9ceb90e4f19aa47490747a34d2e` (Sliced) — parts: Img_Selected 120x120 `6fd455aea0a642a0b2471d7a4215e597`
- **Item_Slot** 108x108 `3bee7ba0853b4fe698ff6adb5c65480e` (Sliced) — parts: Img_Icon 60x60 `d712e76fb66e38140adf81cba8b0068c` (Sliced); Img_Break 108x108 `530a3374ed3a49758db56e1a2157e9c6` (Sliced); Img_Star 40x40 `a80c808cc5a443c482ab8beab205c068`; Img_Timer 32x32 `28483898db384102bee6fba90bf45439`; Img_Belonging 32x32 `06eca80f7f5143f48e3bd7baa733a40a` — text: #FFFFFF@23+o#404040 x2 (Text_Count), #FFFFFF+o#5B5B5B x1 (Text_Count)
- **Slot_01** 120x120 `30dbddd9ee1a4058a35a5b9926cc1234` (Sliced)
- **Slot_02** 120x120 `0e76343b07704cffa28a2653920ba25b` — text: #FFFFFF@18+o#040404 x5 (Text_SkillLevel)
- **Slot_03** 120x120 `e314c09b9b39486bb1c68d018b2abded` (Sliced) — btn states: highlighted `null`, pressed `4eed2985436c4007890c3314c4d42dc0`
- **Slot_Start_02** 120x120 `8ef52f2274d440e1ba8939c738ab46aa` (Sliced) — btn states: highlighted `null`, pressed `ee360078f54f4bb9ad761d5bfaece4ac`
- **Img_Rare** 108x108 `dcbbede8a7a0478b97e2ffa23b7fc14a`
- **Slot_Start_01** 120x120 `6fb5e0856ebd460abd45f595c194d70d` (Sliced) — btn states: highlighted `null`, pressed `b7cb9fca562c4b9caa57d3419f0949dc`
- **Img_Epic** 108x108 `90c4bb16c95a4ae3916098b6ffb4d0e4`
- **Img_Unique** 108x108 `74d4021ef1794501acb73b78d267574e`
- **Img_Legendary** 108x108 `70565cb756634ae7a168975f7a18fb1d`
- **Slot_Costume** 120x120 `e4707072341941f9a769546d77d2b2dc` (Sliced) — btn states: pressed `7dbcf2e566684008a343032239a0f82a` — parts: Img_SelectBG 120x120 `35d8c180b4544d798b1e77315523ff76`
- **Slot_Skill_01** 120x120 `cb9af186b6064ab3af9f1791a6d58e30` — parts: Img_Icon 108x108 `9b7fc0e820d7471d99dc36f5affa5763` — text: #FFF200@23+o#000000 x1 (Text_Time)
- **Slot_Job** 120x120
- **Slot_Skill_02** 120x120 — parts: Img_BG 80x80 `8e59874c8b644dd2b0b2e673032f848a`; Img_Icon 60x60 `8598af8e001f4aca9be71ce85e03b505`; Img_Effect 80x80 `03b735ce321f4884b3759bc30128807b` — text: Text_NextSkill #83FFFF@21+o#232323/80%
- **Slot_Char** 120x120 — parts: Img_SlotFrame 120x120 `45ad8a610bfb4482a5b512febc9d61ae`; Img_Alert 32x32 `0c63b557ed0b4fc2b163760297ba3e54`; Text_Info 125x30 `a1e671ef281642b6bb0d15754f0137a1` (Sliced) color:#323232/0%; Img_Select 146x146 `7235e2b78c444546a65147c19d0255c6`; Img_Path 104x55 `637b146839954bd1a7da437f3874aaa1` (Sliced) color:#FB9935 — text: Text_Alert #EF7C59@26B+o#3A3A3A, Text_Path #FFFFFF@B+o#000000/20%

## Slider (21)

- **Slider_03** 440x35 `f8c075c3f94a478087b53e0b33f6a3c2`
- **Slider_06** 440x25 `a40db267d5044076954c1ffa2f4ca862` color:#C7D2DB — text: #8C99B4@23 x2 (Text_Count)
- **Slider_Effect** 150x150 `3400889e6fd64b189e54c134041f6a2f`
- **Slider_Progress** 440x28 `144b1561436c4a199c24c0fc193212c7` — parts: Img_Bar 440x28 `8defedf8352946208545f880a29db4c5` (Filled) — text: #4F679C@26 x2 (Text)
- **Gauge_RareToEpic** 500x24 `0b43bd87fe2345ac854fec4c92e417b7`
- **Slider_HP_02** 440x24 `830981fae72b4f31bf94a95f7cb45c36` — parts: Img_Bar 432x24 `7b617f65408d4e3a8879892b8499c684` (Filled); Img_Light 24x44 `1da58ff113a644feb55653385afde829` — text: #FFFFFF x1 (Text_Value), #FFFFFF@20 x1 (Text_Value)
- **Slider_HP_03** 440x24 `830981fae72b4f31bf94a95f7cb45c36` — parts: Img_Bar 432x24 `3b67edc286a64f5e88a2a4615be2ec75` (Filled) — text: #FFFFFF x1 (Text_Value), #FFFFFF@20 x1 (Text_Value)
- **Slider_04** 368x24 `37bf4e285fbc42c596b2b83e8405bf65` (Tiled) color:#FFFFFF/35% — parts: Img_Icon 32x32 `0b978562b9a84fdb94d87db73cd3b900`; Img_Effect 408x48 `c01a8548d5ef44bba76c000311e26e23`
- **Slider_05** 154x32 `707b1774701c4c7db95633a5598d438d` (Tiled) — parts: Img_Icon 32x32 `ad93f34c842e48389dba24b88a7f6d5b`; Img_Effect 408x48 `f93c5ce74772481aba2f005899fa798e`
- **Slider_BG** 150x150 `e299cdb910ea4a488025f1cffe092304`
- **Slider_01** 150x150 `c6c079d2eec042c29b45e6de47b36b76` (Sliced)
- **Slider_02** 150x150 `4fae70775a8042c7a2fa73434b7cbc5e`
- **Slider_03** 150x150 `094486385585495ab8f7d71c097e1790`
- **Slider_04** 150x150 `916a1201548046ae9a08b51545ce6c64`
- **Gauge_UniqueToLegendary** 500x24 `6d9a352207c845f892751de63b2e496f`
- **Gauge_EpicToUnique** 500x24 `071c408472c84f238a3786bf8a462493` (Sliced)
- **Slider_05** 150x150 `24b7ac2f2ace4f2d9e426fc2c91b6e01`
- **Slider_HP_01** 440x50 — parts: Img_BG 408x32 `43cdc2e197284fb0bf38df527fc2b07b`; Img_Bar 392x16 `abb4776c564b4afea134319bb2dd65f2` (Filled) color:#FF0000 — text: Text_Value #FFFFFF@24
- **Slider_Exp** 560x33 — text: Text_Exp #58B024@B
- **Slider_01** 408x42 — parts: Img_Back 408x32 `657b7cfd04194c96a535284c8a31a82e`; Img_Eff 412x36 `3760ac1482da4dba8aaffb1d77561e5e`; Bar_Back 392x16 `b40fb4e695224780b6cdb59e46e42ace` (Filled); Bar_Back_1 392x16 `849954dc21a140ad8b6dedda52583a2f` (Filled); Bar_Back_2 392x16 `e7abc7cb836c48d2ba705727041939e3` (Filled); Bar_Back_3 392x16 `5a17b366943444c39746691afd7cf3f1`; +3 more — text: Text_Level #FFFFFF@24
- **Slider_02** 440x50 — parts: Img_Back 408x32 `1e7c2efabffa43ac8dcc057b62b47ab4` (Sliced); Img_Bar 200x16 `8f21c691ff7e444499dc764f661d1dbd` (Sliced); Img_Indicator 20x20 `0c2db2ad2c694210ba492d0ab060b5e7`

## Unit (8)

- **Unit_Stat** 618x48 `a1e671ef281642b6bb0d15754f0137a1` (Sliced) color:#E7E5DC — text: #9F9F9F@22 x6 (Text), #8897B9@28 x4 (Text_Stat), #757474@28 x4 (Text_Value), #FFFFFF@22 x4 (Text_Power) +31
- **Unit_Record** 799x180 `a1e671ef281642b6bb0d15754f0137a1` (Sliced) color:#000000/10% — parts: Img_Deco_RankBg 164x168 `e9bc82f71c264739a70fe4fc7c9a72f1` color:#FFFFFF/50%; Img_Deco_Wing 72x68 `71088697a6af454e98d5590a43aa9c93` color:#FFFFFF/30%; Img_Rank 95x95 `1a9d3ab3fc7f4c74b1f491fffd65c9d1`; Img_Light 330x330 `66702c2a58c049c499badb29103e7b1c` color:#FFFFFF/29% — text: #9F9F9F@22 x6 (Text), #8897B9@28 x4 (Text_Stat), #757474@28 x4 (Text_Value), #FFFFFF@22 x4 (Text_Power) +31
- **Unit_Desc** 680x86 `ab58be1f40d845c8ab987c0bb915927a` color:#E5E2D4 — text: #A9A8A5@26 x5 (Text), #60FFC5@78 x1 (Text_Result), #FFFFFF@25 x1 (Text_ResultDesc), #F4ED83@25 x1 (Text_Title) +1
- **Unit_Achievement** 1200x200 `c26a3cc43a2347979a54ad4d35292271` (Sliced) — parts: Btn_Info 25x25 `d8f842cdebe445d9b4a76f932eb9358a` — text: #FFFFFF@26 x4 (Btn_Receive), #6C7995@30 x2 (Text_Title), #8C99B4@26 x2 (Text_Desc), #FFFFFF x1 (Btn_ShowChild)
- **Unit_ShopItem** 516x420 `99fe6885881f4f3c9cdb1fd94a0b8f5f` — parts: Img_BG 516x100 `8b01a37df2a24dbb9e752276d62c9fe2` (Sliced) color:#0074A4/50%; Img_Deco_LineR 125x2 `7f867c5525ad4830889d445835d9b5b4` color:#000000/20%; Img_ResIcon 37x37 `a8f3146382c07494d8dbce9b93c1a5c3`; Img_SaledLine 166x3 `e4ce1ef6edfa4a838d483d13c8e1ff4e` color:#9EBA3B; Label_Sale 76x36 `0ffe39ffdb2f4d72abf111f2e644eaf3`; Img_Balloon 260x60 `e385d19a080e405a8e9e96972954e9d9` (Sliced) color:#EBE3C5; +1 more — text: #FFFFFF@24 x2 (Text_Price), #FFFFFF@23 x2 (Text_SaledPrice), #FFFFFF x2 (Text_OriginPrice), #FFFFFF@20+o#607418 x2 (Label_Sale) +2
- **Unit_Balloon** 478x144 `b198532014c04356b02093282af01a0e` (Sliced) — parts: Img_BG 444x120 `0889d462fb7a46bcb4c04f9a46f5e3f1`; Text_Step 160x26 `fb270c91dd5ece34ab03cbb662d9bab3` color:#0E121A/60%; Img_Reward 96x96 `e6df4b7e0f694359a62863815bf94029` — text: #9ADB62@25 x1 (Text_Description), #C3CCE0@24 x1 (Text_Title), #86B5D8 x1 (Text_Step)
- **Unit_Rank_01** 1051x200 — parts: Btn_Thumbnail 140x140 `1e5e576fa39554b4a9d4b356354219c6` (Sliced) color:#CED2D6/0%; Img_Score_BG 420x50 `a2366d534ad0428882308c1404ef9e57` (Sliced) color:#E0EBF5 — text: Label_Score #8C99B4@24B, Text_Nick #8C99B4@30B, Text_Rank #6C7995@36B, Text_Score #6C7995@24B
- **Unit_Rank_02** 1051x200 — parts: Empty 100x100 `b441627f58b9435ba2771b8f30ddf0e7` color:#000000/20% — text: Label_Score #A39F8A@24B, Text_Nick #757474@30B, Text_Rank #757474@36B, Text_Score #757474@24B

## Card (14)

- **Card_BG_SSR** 210x280 `65a384b45d154481a7daf6297bebf170`
- **Card_Frame_SSR** 210x280 `505e73171fa64a50943f4477999fcb3a` (Sliced)
- **Card_Slot_03** 210x280 `51b2b1bf61934e1a8e2df141d2b3aee3` — text: #FFFFFF@21 x2 (Text), #FFACAC/50%@20 x1 (Text_CardSlot), #ACFFDD/50%@20 x1 (Text_CardSlot)
- **Card_Slot_04** 210x280 `a3608009c2294206a8cdbc9773ca8282` (Sliced) — text: #FFACAC@20+o#A09889 x1 (Text_CardSlot), #ACFFDD@20+o#A09889 x1 (Text_CardSlot)
- **Card_Slot_05** 210x280 `1f0a4a52e38a4b2a972a28b943ef2849` — text: #486192@24 x4 (Text_Grade), #757474@26 x4 (Text_Name), #757474@24 x4 (Text_Desc)
- **Card** 208x280 `65a384b45d154481a7daf6297bebf170` color:#FFFFFF/0% — parts: Img_SSR 54x54 `2058341fc4ef4e2cad0a3c6fc02ef330`; Eff_light 39x39 `3fa7574e95df430295d99d40b9272766`; Img_CardLight 208x280 `b811e7e7f33b4261b87f14f4a792f0fe`; Card_Back 208x280 `c535f1d3b0de40359215657db6a4c75b` — text: Text_CardName #FFFFFF@18B+o#3A3A3A
- **Card_Slot_01** 210x280 `60af1785ba8e4ce69c2ef06b58a2abd3` — text: #FFFFFF@20+o#373D49 x2 (Text_CharLevel), #8CE6EE@20+o#373D49 x1 (Text_JobName), #FFFFFF@18 x1 (Text_Power), #EF7C59@24+o#000000 x1 (Text_LockLevel) +1
- **Card_BG_N** 210x280 `7420586117b740d4b09e7dc1aba53435`
- **Card_BG_R** 210x280 `f33e49b1b7e64fc69d12e47d3bfc3df5`
- **Card_BG_SR** 210x280 `61467f0b811a4165835a38d112a3abec`
- **Card_Frame_N** 210x280 `55c6767f436442119fb848f3a42e1645`
- **Card_Frame_R** 210x280 `25ef5604e98b4dcabfea13024483fe79`
- **Card_Frame_SR** 210x280 `37fc71b0ea7c4555a7f306957fe391d1`
- **Card_Slot_02** 210x280 `1fe377abe7ce4b0c974fa200e2603bc7`

## Tint (57)

- **Icon_Star** 60x60 `36338acb0cfe498cac27bf667fc29979`
- **Tint_Gradient_Bg** 522x50 `a1e671ef281642b6bb0d15754f0137a1` (Sliced) — text: #9F9F9F@22 x6 (Text), #8897B9@28 x4 (Text_Stat), #757474@28 x4 (Text_Value), #FFFFFF@22 x4 (Text_Power) +31
- **Tint_RoundRect_H40** 100x40 `a2366d534ad0428882308c1404ef9e57` (Sliced) — text: #757474@30 x12 (Text_Reward), #CECECE@24 x3 (Text_Cost), #FFFFFF@22 x3 (Text), #99EBFF@22 x3 (Text) +10
- **Tint_RoundRect_H30** 100x30 `7fb7e33dd3a64870a6aba7fc41828d42` (Sliced) — text: #FFFFFF@27 x3 (Text_Cost), #FFFFFF@22 x2 (Text_BaseRquire), #EEEDE8@24 x2 (Text_Level), #50D285@22 x1 (Text_Require) +2
- **Tint_Square_R10** 100x100 `9eee37f21d974889947d021f08bcda62` (Sliced) — text: #757474@24 x13 (Text_Title), #757474@28 x10 (Text_Title), #FFFFFF@26 x9 (Btn_01), #EF8A59@22 x3 (Text_Value) +3
- **Tint_Tab_St01** 200x60 `36ad9f62ab654c6ca946ca654f232c24` (Sliced) — text: #475674@30 x2 (Item_Theme1), #FFFFFF@30 x1 (Text_Capacity), #293753@27 x1 (Text), #EEEDE8@27 x1 (Text) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Tint_Square_R15** 100x100 `6e8e561a4582462eaad762cb11d1f835` (Sliced) — text: #FFFFFF@25 x3 (Text_Title), #FEFAE8@22 x3 (Text_Empty), #BBBBBB@26 x3 (BuffGroupName), #EEEDE8@30 x3 (Text_BossName) +13 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Sword** 60x60 `3119d2807ea7466e8e9056d0590a35cc`
- **Icon_Triangle** 60x60 `5ec39b7aca674908bbdb4a7ef3e68340` (Sliced)
- **Tint_Horizontal_54** 300x80 `bc1d674f8f0748d3a2ebec68b1561784` (Sliced) — text: #FFFFFF@24 x2 (Text_Count), #84C1E7@30 x1 (Text_Piece), #FFFFFF@26 x1 (Text_PieceName)
- **Tint_Toggle_Bg** 59x100 `2f6b4fc7c1524ed191f7552a4cd4ace5` (Sliced) — text: #FFFFFF@36 x4 (Img_Preset1), #C3BFC3@36 x2 (Preset1)
- **Tint_Tab_St02** 200x60 `84e53d9ca4ca4b84b1189d8e7a860dbc` (Sliced) — text: #FFFFFF@28 x3 (Btn_Reset), #FFFFFF@26 x2 (Btn_Delete), #DEDEDE@30 x2 (Text_BagInfo), #FFFFFF@27 x1 (Text_Empty) +4
- **Icon_Dot** 60x60 `5206778466fe4ccd94696968848766bc`
- **Icon_Reset** 60x60 `4948bd19e6cd459da09b7e06796b8b35`
- **Tint_RoundRect_H26** 100x26 `466c1f1dc119420e98251fbf068f89be` (Sliced) — text: #FFFFFF@20 x3 (Text_PathCount)
- **Icon_Detail** 60x60 `754890ba284e441ea0bba9b02de160f9` (Sliced)
- **Tint_RoundRect_H34** 100x34 `eaae9d8c500b45c6aea3ed502a020dd2` (Sliced) — text: #FFFFFF@24+o#000000/20% x3 (Text_AbilityName), #FFFFFF@22 x1 (Text_Job), #4E5C7A@24 x1 (Text_Cost) **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Icon_Triangle_Up** 60x60 `10981d693e294a5392d7eb1ccbe41181` — text: #757474@24 x1 (Text_ResultValue)
- **Icon_Lock** 60x60 `c506125bbc8b4de693fb15de56eb559f`
- **Tint_RoundRect_H54** 100x54 `b84c111b20d6446488c7cc75bd87c2b7` (Sliced) — text: #FFFFFF@26 x5 (Text_Stamina), #789098@26 x1 (Text_PieceName), #F7DA6F@20 x1 (Text_Recharge)
- **Tint_SpeechBubble** 300x80 `e385d19a080e405a8e9e96972954e9d9` (Sliced) — text: #65604C@19 x1 (Text_LimitCount)
- **Icon_Filter** 60x60 `fafc87dfc7354354b8b2d63ae75fd4f6`
- **Icon_Check** 60x60 `5da3f043b3bc4c179d2d1b67b2fb0ccf`
- **Icon_Delete** 60x60 `9f207027c5954e8f91a8bc14824455fe` (Sliced)
- **Icon_Bag** 60x60 `341c9cc01dc74de1aa0dcfef788fca38`
- **Icon_Challenge** 60x60 `0c109b9d80334243a1301bcb49fc1305`
- **Icon_Potion** 60x60 `1d302b29bdce4e0ebf1ec903e363550c`
- **Icon_Etc_01** 60x60 `3b84dff4692a45b9b02ca964dc140867`
- **Icon_Equip** 60x60 `1fb08f89a470402bad82e82323082d5f`
- **Tint_Circle_80** 100x100 `9d0fcc9395f94d5aa12f219106e95f31` (Sliced)
- **Icon_Arrow_R** 60x60 `740aba24726c4c6580cf054b0e1e1fd5`
- **Icon_Arrow_L** 60x60 `002ca90cd5794836b1e44da160de287a`
- **Icon_Arrow_Up** 60x60 `21a4739b4d654e51810c638f273d9c54`
- **Icon_Triangle_Down** 60x60 `0c2db2ad2c694210ba492d0ab060b5e7`
- **Icon_Unlock** 60x60 `037ed07f8512493e95c958c9904fa07d`
- **Icon_Card** 60x60 `d4a616725f8b4b23a9f75a68f0c342f9`
- **Icon_Level** 60x60 `ffac0cb81fc14860aede1243354df10d`
- **Icon_BossInfo** 60x60 `6e15e0bad96c46c98e46b1715b6abe08`
- **Icon_Carving_Info** 60x60 `918479bb8ae341bf8e368b18a561ab85`
- **Icon_Card_Info** 60x60 `92753c4276e24868924276304930e97d`
- **Icon_Share** 60x60 `b7d850a200ee4c418e613e3dccd96fb9`
- **Icon_Link** 60x60 `e614216b606f428dba21a96b4664456b` — text: #EEEDE8@28 x1 (Text_LinkTitle)
- **Icon_Cash** 60x60 `5f8c0b0183924ce9bdf49eb24c19d410`
- **Icon_Start** 60x60 `c384eee2ca674ba58baf8b88c0b54924`
- **Icon_Party** 60x60 `7ca6def2c852447292673899543e5b35`
- …+12 more — grep `data/themes/simplefantasy.ruids.json`

## ETC (5)

- **Img_Flag** 164x116 `f01733d4b1b645089602c5a675e6877e` — text: #CFDCF8@45+o#3A4359 x1 (Text_Order)
- **Img_Avatar** 100x164 `b9461709154c400b86a3dde7f3efab68` (Sliced)
- **Img_Warning** 482x198 `48942a0e5a234dcf96efd931ca21dc3e`
- **Img_Click** 180x172 `3241aa724ef4404fb5689eae6240ebea`
- **Img_Flame** 166x100 — parts: Img_BG 140x109 `aff999f29c684eb9aebce75e9236d8f9` — text: Text_Count #FFFFFF@36B+o#9E1400/68%+s#360000/72%

## Icon (162)

- **Icon_Dia** 60x60 `d6ad676a0b7045e0a994285b3c092218` (Sliced)
- **Icon_StarForce** 60x60 `a80c808cc5a443c482ab8beab205c068` — text: #FFFFFF@16+o#686868 x1 (Text_Level)
- **Icon_Gem_01** 40x40 `98594c096bef473fb75d9111a326ecbd`
- **Icon_Key_01** 60x60 `7def203e7509458b8aaacbd9427b0ffa` — text: #757474@25 x8 (KeyText), #757474@22 x8 (Text), #E23A00@22 x8 (Text_NegativeNotification)
- **Icon_Check_01** 60x60 `2e36df32385a4026a963af9e552b06df`
- **Icon_DiaRect** 60x60 `8c70e1b4b0a24a128f30b790115cb13c`
- **Icon_Gem_03** 40x40 `ffda778447f14eb5ad7f15ae9d58bb08`
- **Icon_Gem_02** 40x40 `bbac9f77fec1490fbf4b79ab2bb22122`
- **Icon_Gold** 60x60 `9b8936f08455493ab28cf7333b33fcbc` (Sliced)
- **Icon_New** 100x48 `5e94ec20ee214fa08d9c9a1b70330a14`
- **Icon_Info** 60x60 `d8f842cdebe445d9b4a76f932eb9358a`
- **Icon_Grade_SSR** 60x60 `2058341fc4ef4e2cad0a3c6fc02ef330`
- **Icon_Max** 88x48 `b73ed4b7fd90461092b12163550c2e93`
- **Icon_Check_02** 60x60 `65289ae489cd4dfca1be0ba562054b17`
- **Icon_Alert_Shadow** 60x60 `0c63b557ed0b4fc2b163760297ba3e54`
- **Icon_Alert** 60x60 `5fc9e15f755642319b57a4be0f731651` — text: #EF7C59@22 x1 (Text_LinkEffect)
- **Icon_Key_02** 60x60 `ce1a23270d7b4f72bec868350b63a6b4` — text: #3D4A66@26 x3 (Text_KeyIcon)
- **Icon_01** 60x60 `a43212ebc94b48459e1a1b29eb2a83e8`
- **Icon_Rank_S** 80x80 `1a9d3ab3fc7f4c74b1f491fffd65c9d1`
- **Icon_Arrow** 60x60 `bd1198d411cd40fa9fad30ec3143452c`
- **Icon_Stamina** 60x60 `cd8888200a874c7ea57541544c4fd830` (Sliced)
- **Icon_Bonus** 120x52 `1384d552a23340caa8a511dbf4e5ba62` (Sliced) — text: #FFFFFF@24 x1 (Text_Value), #FFFFFF@26+o#2D540C/55% x1 (Text_Value)
- **Icon_Item_14** 60x60 `f7faad86881f4e1a9bb941a3cabad068` — also: Icon_Item_20
- **Icon_Rank_A** 80x80 `ef58cd4b93d14516bcd8dcdc8062a445`
- **Icon_Ticket** 60x60 `18205b8ecbde4fd4a1ad1b1ec5059539`
- **Icon_Chest** 60x60 `50baeda901af47d78bd8264f5b903d5b`
- **Icon_Alert_White** 60x60 `f47306336ded4c5d8842a9a63abbe92e`
- **Icon_Quest** 60x60 `4644728712a941e3a69ea17cef8f1734`
- **Icon_Star** 60x60 `ce3304b16b51400ba63fe6ac6d149eff` — parts: Fx 180x180 `64be6bf7c8c24b6b9411100e3ca84244`
- **Icon_Upgrade** 133x48 `d49670fd942b4f61b64d2ae54f4d98f9`
- **Icon_Gem_04** 40x40 `b6ceee69735b47dbb8bed24e348f93e7`
- **Glove_On** 50x50 `27fa9662e44d4eeca22580aa92575ee5`
- **Icon_Item_03** 60x60 `ef20dded377a40a0b160289396ae80fc`
- **Icon_Item_12** 60x60 `84e2d01487164f05af1cd1f605fe5d9f`
- **Icon_Item_18** 60x60 `fea5e8f97238433eab8c6b99d3bd9dc7`
- **Icon_Item_19** 60x60 `5e4e7ab1499c4abca06f094c46e3b1a0`
- **Icon_Buff** 60x60 `f2323bf5423440ec8562beef033437b9`
- **Icon_Pause** 60x60 `84cff07146a541d8b315351eb00e2788`
- **Icon_Noti** 60x60 `d1b4dda6896546289652f3ed6a5e051b`
- **Icon_Key_Arrow** 60x60 `13266cc409e645ba8502c8e467eefdb5`
- **Icon_StarForce_Empty** 60x60 `ee7ac0385b404e088143452426c20da4`
- **Icon_Portrait** 60x60 `aab053a399704a4ca95b6a4dfcb87774` — parts: Img_Portrait 68x68 `c8ef4f2fe368486a96bf65587e354a81`
- **Icon_Grade_N** 60x60 `565674c3819448128cd65c71135d728f`
- **Icon_Grade_R** 60x60 `dbf08a692cd04c84b9bb3dcfe125a42c`
- **Icon_Grade_SR** 60x60 `510ab4c4ed5e4fbaa94296daf8a1042e`
- …+117 more — grep `data/themes/simplefantasy.ruids.json`

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#FFFFFF`** — 394 uses (sizes 16–90; mostly on SkillSelect, HUD_Lobby, Shop)
- **`#757474`** — 134 uses (sizes 20–36; mostly on GameOption, MirrorReward_Info, MirrorEntrance)
- **`#EEEDE8`** — 19 uses (sizes 22–40; mostly on BossEntrance, LinkSkill, MirrorEntrance)
- **`#0A4AA7`** — 15 uses (size 22; mostly on HUD_Lobby)
- **`#DF9649`** — 12 uses (size 40; mostly on MirrorReward_Info)
- **`#6C7995`** — 11 uses (sizes 23–36; mostly on Unit, Rank, Panel)
- **`#EF7C59`** — 10 uses (sizes 22–27; mostly on AdventureEntrance, LinkSkill, Slot)
- **`#8C99B4`** — 10 uses (sizes 20–30; mostly on Unit, Achievement, Rank)

**Outline: 132 of 937 text nodes (14%).** Most used: `#2D2D2D` x43, `#000000/20%` x15, `#5B5B5B` x8; typical `OutlineWidth` 0.2 (also 1 with a `+s` halo — `Underlay` at offset 0, a flat ring, not a drop shadow).

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (42)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/simplefantasy/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`AccountLevelUP`(39), `Achievement`(39), `AdventureEntrance`(238), `BakeSelect`(32), `BossEntrance`(114), `CardExchange`(32), `CardInfo`(136), `ChallengeSelect`(28), `CharacterInfo`(45), `Costume`(43), `Dialog`(18), `GameOption`(199), `GearItemInfo`(98), `HUD_Adventure`(45), `HUD_Lobby`(201), `HUD_Mirror`(16), `Inventory`(111), `ItemInfo`(19), `ItemSet`(37), `LinkSkill`(66), `MirrorEntrance`(80), `MirrorReward`(26), `MirrorReward_Info`(71), `PlayerInfo`(158), `PostBox`(35), `PotentialReset`(39), `PotentialSelect`(67), `Profile`(25), `QuickSlotWindow`(69), `Rank`(34), `Result`(36), `Revive`(9), `RuneSelect`(104), `ScrollItemUse`(18), `SellRepurchase`(85), `Shop`(149), `ShopPurchase`(37), `SkillDetail`(60), `SkillSelect`(303), `SpecialPass`(145), `StageResult`(55), `StarForce`(75)

Long-tail lookup (all 673 RUIDs incl. every icon): grep `data/themes/simplefantasy.ruids.json` by part name keyword.
