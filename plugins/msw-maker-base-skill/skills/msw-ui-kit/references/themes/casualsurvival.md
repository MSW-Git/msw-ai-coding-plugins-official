# UI Theme — Casual Survival (`ui-resource-casualsurvival-package`)

Harmonized UI RUID palette extracted from **Durango The Lost Island** (original MSW world), published as [`ui-resource-casualsurvival-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-casualsurvival-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Panel (6)

- **Panel_3** 320x300 `5edf5f9bc1d8416e884af5debd87e058` (Sliced) — text: #FFFFFF@20+o#000000/50% x1 (TextName), #FBC134@16+o#000000/50% x1 (TextExtra)
- **Panel_2** 360x300 `62135fba0e98086459fb2a1c6737addf` (Sliced) color:#FFFFFF/0% — parts: UITopTitle 360x60 `9a1c631a270e4fb9ad25bedbbab15095` (Sliced); DotPatterLeft 118x40 `6896823f231347589b533c1a736961cd` (Sliced) color:#000000/30%; DotLine 356x3 `cb5c4482a3824726896732f2be6f829c` (Tiled) color:#000000; UITooltipScroll 360x240 `5bf3708196264a08ae53b28dc77c8626` (Sliced) color:#FFFFFF/95% — text: #FFFFFF@20+o#000000 x7 (Number), #FFFFFF@25 x6 (ItemName), #FFFFFF@22 x3 (TextRequireCraftingTime), #E6B848@28+o#000000 x2 (TextIContentName) +1
- **Panel_Scroll** 300x340 — parts: CloseButton 70x70 `187b4187e0a7487795617a410d95bb91` (Sliced); UISprite 300x236 `a9ec4df22c794274aae14f0bcf763e4b` (Tiled) color:#FFFFFF/3%; UISprite 132x34 `5721eabc158243619dda3f171075fc8c` (Sliced) — text: Title #FFFFFF@26+o#000000, Title_1 #FFFFFF@20+o#000000
- **Panel_1** 300x300 — parts: BackButton 70x70 `13fedb1035ea4bfc8f22075684877909` — text: Title #FFFFFF@26+o#000000
- **Panel_4** 470x562 — parts: BGTop 470x465 `aba92c2b59ef4f23928a339f2e5bbced` (Sliced); BGBottom 470x102 `e53a8ce555d540a187a590a0961b6d6b` (Sliced); IconFrame 120x120 `57cb623ae1b946b6856a2a4bfff30313` (Sliced); Icon 90x90 `27847d03411648caaf3e8b196897fdb5` (Sliced); ButtonFix 446x82 `c1130bd229574329a869078077c39720` (Sliced); AnimatedSprite 446x82 `658001a9c7e6420d8d96f39551b531fc` (Tiled) color:#D88100/25%; +2 more — text: Amount #FFFFFF@28+o#000000, Description #FFFFFF/80%@20, NeedsText #E6B848@28+o#000000, Text #FFFFFF@28+o#000000
- **Panel_5** 604x624 — parts: BottomBG 604x624 `273f6001729e484ebf46d4d3d0ab6893` (Sliced); UIIconScrollPanel 540x226 `6e8f27c4d1c844e290a85ab8ce3726d3` (Sliced) color:#000000/15%; UIIconPanelProto 100x100 `3121b1b6c4a847158e21398d6f74dd1c` (Sliced); UIItemIcon 72x72 `930b06e12a454e85aee2b0a10538a396`; UIPriceIcon 40x40 `42b6b4fbe1a64b01987f7360853d5fa1` (Sliced); UICancelButton 284x77 `b4de5421f5934acabff04eb43bd0e417` (Sliced) — text: Text #FFFFFF@28+o#000000, Title #FFFFFF@26+o#000000, UIItemCount #FFFFFF@20+o#000000, UIItemName #E6B848@22+o#000000 +3

## Base (14)

- **Base_Bubble_04** 176x100 `5d33a7fba9f74e4f8f031ba93a4edfa1` (Sliced) — text: #FFFFFF@20+o#000000/30% x11 (UIInfo), #FFFFFF@21+o#000000 x4 (UITitle), #A978C6@24+o#000000/80% x3 (TitleText), #FFFFFF@18+o#000000/30% x3 (Info) +4 **[split surface: light AND dark text both used — pick by region, never assume one]**
- **Base_Bubble_01** 224x40 `6e8f27c4d1c844e290a85ab8ce3726d3` (Tiled) color:#000000/50% — parts: Arrow 15x15 `5cacec2d029a45c59759bf4c02fca79b` color:#000000/50% — text: #FFFFFF/50%@15 x2 (UIRefundText), #FFFFFF@26+o#000000 x1 (Report), #FFFFFF/50%@17+o#000000/30% x1 (UIText)
- **Base_Slot** 212x212 `57cb623ae1b946b6856a2a4bfff30313` (Sliced) — text: #FFFFFF@20 x4 (ContentCount)
- **Base_BubbleHoverDetail_1** 240x120 `2d92cfd8efd44d33b3b987c7c8b56574` (Sliced) — parts: UISprite 30x30 `757abece87784f0ca74dd5b8a29db50e`; UITitleName 240x30 `7d4d940d20984f50844c50df86ed3776` (Sliced); UITail 16x16 `77b3782f9e0548a58a38f0e91f02069b` — text: #FFFFFF@20+o#000000 x3 (UITitleName), #FFFFFF@16+o#000000 x2 (UITextDescBig), #FFFFFF@18+o#000000 x2 (Content)
- **Base_BubbleHoverDetail_2** 240x120 `482daea14a374cbab2e6fc70c3d8e964` (Sliced) — parts: UITail 16x16 `b8009bb3f04745ffa056171018b0f881` — text: #FFFFFF@20+o#000000 x1 (UITitleName), #FFFFFF@16+o#000000 x1 (UITextDescBig), #FFFFFF@18+o#000000 x1 (Content)
- **Base_Craft** 472x400 `98e3ae11d7784063ab864ae3fe94b705`
- **Base_Bubble_02** 170x100 `db05d7d582f948498323edfebe3f3bb6` (Sliced) — text: #FBC134@24+o#000000 x1 (Title), #FBC134@22+o#000000 x1 (Count), #FFFFFF@20 x1 (Description)
- **Base_Bubble_03** 145x100 `3bd7f37dcb394495821db05c22e323ee` (Sliced) — text: #FFFFFF@19+o#000000 x1 (Text)
- **Base_Day** 300x300 `594d560827b1411a9aa3e7b530c6cac9`
- **Base_Night** 300x300 `59d8b841e38f46e9a1abbacb7986f479`
- **Base_Cirlce** 300x300 `8a4e023c863c4acb9502feccdefb502c`
- **Base_DNA** 472x400 `72e00ef34e444c48aaa2e67207e18c24`
- **Base_Research** 472x400 `112658f87f1e40f5978a2b827459787c`
- **Base_TutorialBubble** 150x51 `288b078beaa34160874cbba305d45c65` color:#AF5DEF

## Button (20)

- **Button_Yellow** 480x82 `c1130bd229574329a869078077c39720` (Sliced) — btn states: highlighted `b99f697a1cb747089c25403c42164b92`, pressed `1889cc00f71147a8919a31404ad7fc5e`, selected `null`, disabled `a2fbd78d13db483a9e16de6aa608293b` — parts: AnimatedSprite 480x82 `04b4ac142c40488ca208cd3e60cfdb79` (Tiled) color:#D88100/25%; EIcon 40x40 `058737be043b47dda2631557fa0332f4` (Sliced) — text: #FFFFFF@28+o#000000 x16 (Text), #FFFFFF@27+o#000000 x9 (UIText), #FFFFFF@23+o#000000 x9 (UIPriceAmount), #FFFFFF@32+o#000000 x6 (TextInfo) +3
- **Button_Tab_06** 138x78 `9cb41ecdcc804e30962830b40348b22f` (Sliced) — text: #FFFFFF@22+o#000000 x20 (Text), #FFFFFF@23+o#000000 x6 (Text)
- **Button_Blue** 480x77 `9277470c3b624a36a47e861fe7c3b13d` (Sliced) — btn states: highlighted `5459082a670f40069cf86d269a5e5528`, pressed `1b2ff17225324f34a34a38d1d71cece6`, selected `null`, disabled `a2fbd78d13db483a9e16de6aa608293b` — parts: Icon 40x40 `0ed521a0effa4a2184a28b4835ec7797` — text: #FFFFFF@28+o#000000 x5 (Text), #FFFFFF@20+o#000000 x5 (Text), #FFFFFF@32+o#000000 x2 (Text), #FFFFFF@26+o#000000 x1 (UIText_1)
- **Button_Close_1** 70x70 `187b4187e0a7487795617a410d95bb91` (Sliced) — btn states: highlighted `d585c886426c4313bb7f36cdd3c001a4`, pressed `2b8c3c0107a6437fa5e01538a09c655e`
- **Button_Close_2** 65x60 `9277470c3b624a36a47e861fe7c3b13d` (Sliced) — btn states: highlighted `5459082a670f40069cf86d269a5e5528`, pressed `1b2ff17225324f34a34a38d1d71cece6` — parts: Close 26x26 `72d7110c07fc473e9206e5e81ac18087` (Sliced) — text: #FFFFFF@28+o#000000 x5 (Text), #FFFFFF@20+o#000000 x5 (Text), #FFFFFF@32+o#000000 x2 (Text), #FFFFFF@26+o#000000 x1 (UIText_1)
- **Button_Tab_04** 140x60 `e53a8ce555d540a187a590a0961b6d6b` (Sliced)
- **Button_Tab_03** 140x60 `5bf3708196264a08ae53b28dc77c8626` (Sliced) — text: #FFFFFF@26+o#000000 x1 (UITextDescBig), #FFFFFF@21 x1 (UITextDescSmall), #FFFFFF@22+o#000000 x1 (UIRemainTime), #FFFFFF x1 (UIDebugText)
- **Button_Popup** 58x52 `07de07ee03784481b35c74581f0458e0` — btn states: pressed `6bf6fb071494477c8ec9571dbba3427b`
- **Button_Tab_02** 140x60 `9a1c631a270e4fb9ad25bedbbab15095` (Sliced) — text: #FFFFFF@26+o#000000 x6 (Title), #FFFFFF@28+o#000000 x1 (Title)
- **Button_Prev_Mint** 58x58 `874cb61a0dcb40b9be7e7527a0a6a966` — btn states: highlighted `90aba7d0e486442eb59ddfa3489fb49e`, pressed `2909acf1f37448f8adc7cac7b15785ad`, disabled `e8edcc429e9e470db92d22f84694d4d4` — also: Button_Next_Mint
- **Button_Brown** 280x77 `b4de5421f5934acabff04eb43bd0e417` (Sliced) — btn states: highlighted `739a2754a11a4a9c929dbbb9e72e134d`, pressed `3e8dfadf703e4a558942a279c50904f6`, selected `null`, disabled `a2fbd78d13db483a9e16de6aa608293b` — text: #FFFFFF@28+o#000000 x5 (Text)
- **Button_Prev_Yellow** 50x50 `dce7d13395f44d4bb1090593851681c3` (Sliced) — btn states: highlighted `901185e9f8f740f69420b4ade5cf44f1`, pressed `7e8ffded66844819aaf1cf902bbfc430`, selected `null`, disabled `77a508be41e94a11bea9ae74221d27ce`
- **Button_Next_Yellow** 50x50 `dce7d13395f44d4bb1090593851681c3` (Sliced) — btn states: highlighted `901185e9f8f740f69420b4ade5cf44f1`, pressed `7e8ffded66844819aaf1cf902bbfc430`, disabled `77a508be41e94a11bea9ae74221d27ce`
- **Button_Tab_01** 140x60 `aba92c2b59ef4f23928a339f2e5bbced` (Sliced)
- **Popup** 226x240 `5edf5f9bc1d8416e884af5debd87e058` (Sliced) — parts: Button_1 200x45 `62be58f580f94ac1a70facf6d2782150`; IconUp 16x16 `73ff8ae1c3904a6f878e8768ff50d6b9` (Sliced) — text: #FFFFFF@20+o#000000/50% x1 (TextName), #FBC134@16+o#000000/50% x1 (TextExtra)
- **Button_Normal** 164x77 `c7274689bafb4213b3db2038f96e51ac` (Sliced) — btn states: highlighted `4a8e1d5c98034cbfa719c788160f7ad7`, pressed `02366c412fa9444fa3fae8b39a4c30d9`, selected `02366c412fa9444fa3fae8b39a4c30d9`, disabled `02366c412fa9444fa3fae8b39a4c30d9` — text: #FFFFFF@23+o#000000 x3 (Text)
- **Button_Back** 50x50 `e994def0ee48459ba5c1da32556378cd` (Sliced)
- **Button_Red** 280x77 `9b0bbc1ec3054d4d93fab15bcec78d0c` (Sliced) — btn states: highlighted `71359f14f6e84a9b81fe70eeb38f75bf`, pressed `05eafc1e8cce4fb498e7aacde04c3cd1`, selected `null`, disabled `a2fbd78d13db483a9e16de6aa608293b` — text: #FFFFFF@28+o#000000 x2 (Text)
- **Button_Tab_05** 164x68 `a92334cf6e7442aca1cd2465e85dde4e` (Sliced) — btn states: highlighted `4a8e1d5c98034cbfa719c788160f7ad7`, pressed `02366c412fa9444fa3fae8b39a4c30d9`, selected `02366c412fa9444fa3fae8b39a4c30d9`, disabled `02366c412fa9444fa3fae8b39a4c30d9` — text: #FFFFFF@22+o#000000 x2 (Text)
- **Button_Purple** 280x66 `d767fe5ceb1b48f08e7019274255d6ea` — btn states: highlighted `859e65f803064720a14a070f90ff5e8a`, pressed `2352e7df03934ae99694c4ac7dce178a`, disabled `null` — parts: ButtonAnimation 336x60 `0290a6b93b8e4ad6a3bf756bf71addef` (Tiled) color:#FFFFFF/10% — text: #FFFFFF@26+o#000000 x1 (Text)

## Slot (45)

- **Slot_Default** 100x100 `3121b1b6c4a847158e21398d6f74dd1c` (Sliced) — btn states: highlighted `35522fe56cd5430b888620d6f98fa357`, pressed `3da448b61fb94554a074f6731e4a6e40`, selected `dd77ba1ec3bb481397c4574dabd8abd1` — parts: Icon 88x88 `60b77dd045714d06b6140e93e3e95c77` (Sliced) — text: #FFFFFF@20+o#000000 x18 (UIItemCount)
- **Slot_Recipe** 100x100 `3121b1b6c4a847158e21398d6f74dd1c` (Sliced) — btn states: highlighted `35522fe56cd5430b888620d6f98fa357`, pressed `3da448b61fb94554a074f6731e4a6e40`, selected `dd77ba1ec3bb481397c4574dabd8abd1`, disabled `4cf93678106d414f86a4577327d1389a` — parts: ItemIcon 70x70 `thumbnail://83aef47bbe174907ab63d83f0d523240` (Sliced) — text: #FFFFFF@20+o#000000 x18 (UIItemCount)
- **Slot_Inven** 100x100 `3121b1b6c4a847158e21398d6f74dd1c` (Sliced) — btn states: highlighted `35522fe56cd5430b888620d6f98fa357`, pressed `3da448b61fb94554a074f6731e4a6e40` — text: #FFFFFF@20+o#000000 x18 (UIItemCount)
- **Slot_Bag** 92x92 `3121b1b6c4a847158e21398d6f74dd1c` (Sliced) — parts: SlotKey 28x28 `891d94b646224e1bb8acd0e4cf4110be` (Sliced) — text: #FFFFFF@20+o#000000 x18 (UIItemCount)
- **Slot_08** 100x100 `23c5c8f8c11a45bdb900cb628ab602bc` (Sliced) — text: #FFFFFF@17+o#000000 x19 (TextName), #FFFFFF@13+o#000000/60% x19 (DNACount)
- **Slot_Sample** 170x170 `23c5c8f8c11a45bdb900cb628ab602bc` (Sliced) — parts: ImgLevel 44x25 `61c118fd38714469aad2b603104b5ba7`; ImgSample 64x64 `02d340dea0654900a2924bfdd41bee69`; Progress 124x30 `7bb46726c1f745119d73e8bd0a8bd3c1` (Sliced); Bar 104x17 `44ac287a1fa3423eaafa54abd008f3c8`; UpgradeIcon 30x30 `207b3273ff9245529dd1f66ef5b46011`; DNACount 80x30 `5e1a9c11e42e45bcb9885a707e9d94fb` (Sliced); +1 more — text: #FFFFFF@17+o#000000 x19 (TextName), #FFFFFF@13+o#000000/60% x19 (DNACount)
- **Slot_25** 100x100 `1b6664c1d65c42ed887e9414f7e6fd44` (Sliced) — text: #FFFFFF@24+o#000000 x6 (CooldownText)
- **Slot_29** 100x100 `fec5acb3815e4c508b2be25c451de8c9` (Sliced) — text: #FFFFFF@26+o#000000 x9 (StatAnimation), #FFFFFF@24+o#000000/50% x3 (TextStatus), #FFFFFF/60%@24 x3 (TextStatName), #EC91FF/50%@24+o#000000/50% x3 (TextStatValue) +6
- **Slot_Interact_1** 120x120 `1b6664c1d65c42ed887e9414f7e6fd44` (Sliced) — btn states: highlighted `e04ebb360ab04cd5a4cc2df9897a0aba`, pressed `749ccd5b4566410396f9cd871010bc7c`, disabled `87dbae6b1a5048ec9570037f46be051b` — parts: Icon 80x80 `7a565128b96245cbb7a02d113bbd175a` (Sliced) — text: #FFFFFF@24+o#000000 x6 (CooldownText)
- **Slot_Interact_2** 120x120 `1b6664c1d65c42ed887e9414f7e6fd44` (Sliced) — btn states: highlighted `e04ebb360ab04cd5a4cc2df9897a0aba`, pressed `749ccd5b4566410396f9cd871010bc7c`, disabled `87dbae6b1a5048ec9570037f46be051b` — parts: Icon 84x84 `7030de9f1db846889295948da9ad997f` (Sliced); CooldownBar 110x110 `8d87171a1e1f4e0d8640e4fec69eed2c` (Filled) color:#561D1D/80% — text: #FFFFFF@24+o#000000 x6 (CooldownText)
- **Slot_24** 100x100 `c41869d5111742d2945a84c64afd1b01` (Sliced)
- **Slot_Menu** 84x84 `c41869d5111742d2945a84c64afd1b01` (Sliced) — parts: Icon 84x84 `7cca67e9a1fd4fb9ac894b6c62324602` — text: KeyText #FFFFFF@18+o#000000
- **Slot_02** 100x100 `83c038181f444a9d89796d12646a55e6` (Sliced) — text: #FFFFFF@16+o#000000 x3 (TextCount)
- **Slot_33** 100x100 `e363fe71863482e40954b62b58bf4ac8` (Sliced)
- **Slot_22** 100x100 `44e9ef4e3e2b45dda47800231632f3ef` (Sliced) — text: #FFFFFF@20+o#000000/50% x3 (TextName), #E6B848@19+o#000000 x3 (TextEffect)
- **Slot_27** 100x100 `4c35e020b9484b51bf4c7f019dc10667` (Sliced)
- **Slot_17** 100x100 `03ef5bea4ef441aa97d8d5488f2b013e` (Sliced)
- **Slot_21** 100x100 `1fcf4c3fc0274ecdbaef1b67a01e5abc` (Sliced) — text: #E6B848@13+o#000000/50% x2 (UILimitCount), #FFFFFF@22+o#000000/50% x2 (Text)
- **Slot_23** 100x100 `42fab0b1f55043f8a75d2a210314fdfe` (Sliced)
- **Slot_26** 100x100 `22e48e79bc1a44aca30f1a031d5120bb` (Sliced)
- **Slot_28** 100x100 `0e39169e723045858dd7e1caf8cdb548` (Sliced)
- **Slot_04** 100x100 `d7ddc6b76a6c4d4b8bd8c5fc3790a58e` (Sliced)
- **Slot_13** 100x100 `467344045d23433597175bf6293e40b8` (Sliced) — text: #FFFFFF@14+o#000000 x1 (Text)
- **Slot_18** 100x100 `d0d9219018c04dfba9f238a1e069564e` (Sliced)
- **Slot_30** 100x100 `fea952d33b74460f80802f665adeee27` (Sliced)
- **Slot_31** 100x100 `7b844ebd8f5949d09be0e86dc0438150` (Sliced)
- **Slot_32** 100x100 `0607f897c08942ba9460fc37f0afbec4` (Sliced) — text: #FFFFFF@28+o#000000 x1 (Text)
- **Slot_Inven_Cooltime** 100x100 `cb70d81eb3b34591af0ae5fe396c2b65` (Filled) color:#582400/80% — text: #FFFFFF/85%@24+o#000000 x1 (CooldownText)
- **Slot_01** 100x100 `3a639646cebf4aa19f0ca854fb5554eb` (Sliced)
- **Slot_03** 100x100 `5e8ec4ade3fa4bf6a5ea98f89550725f` (Sliced)
- **Slot_05** 100x100 `026b8666f6db4fb19b3f9a2abbf060f0` (Sliced)
- **Slot_06** 100x100 `f214e972d2784a07bb4109e2f8d16ea6` (Sliced)
- **Slot_07** 100x100 `feea4e7b3a4f4d7fafe68f32d851822c` (Sliced)
- **Slot_09** 100x100 `99021371e602429d8089d911e2526c42` (Sliced)
- **Slot_10** 100x100 `11501dcaf3ae4662a29d065fee6f06d7` (Sliced)
- **Slot_11** 100x100 `dd9fd8ae7dd44e87a75e58654f9751e2` (Sliced)
- **Slot_12** 100x100 `eada9cfd629748388a2dc727af3a4cea` (Sliced)
- **Slot_14** 100x100 `e00ed632735747a1be666b708f5288f3` (Sliced)
- **Slot_15** 100x100 `0730762d12844dc8bb167207aab4a5d8` (Sliced)
- **Slot_16** 100x100 `e256dbf4d5bd4b9aa9bb88262a27b214` (Sliced)
- **Slot_19** 100x100 `ef651786a489435cb7ab0fb8fd133982` (Sliced)
- **Slot_20** 100x100 `0462afa1b8414eb39bd3bf244aadb0c2` (Sliced)
- **Slot_Research** 430x120 — parts: MainFrame 327x83 `575cfe0499604901bebc9db5080c5b12`; Icon 70x70 `thumbnail://a9a6d596a3d44ad7b5e76895c9e5eac7` (Sliced); Icon 38x38 `609363c6a32243a4baf2081e95b6f44a` color:#FFFFFF/50%; DownArrow 30x20 `739a7d82dd5d4605850cdf5b4c875b62` color:#FFFFFF/50%; CurrentArrow 40x40 `ef7205bfd3b74eee94155e95c5f6925a` color:#E6B848 — text: Text #FFFFFF/50%@22+o#000000/50%
- **Slot_InputItem** 70x70 — parts: ItemIcon 40x40 `thumbnail://13fc193bbbb3449786b1fbfc175b2b3e` — text: ItemCount #FFFFFF@20B+o#000000, ItemName #FFFFFF@25
- **Slot_World** 180x230 — text: Count #FFFFFF@40+o#000000, RemainTime #FFFFFF/85%@31+o#000000

## Slider (13)

- **Slider_Timer** 50x50 `efa64db8e12840bda321cf756e60515b` color:#000000/70%
- **Slider_Health** 422x22 — parts: Frame 422x22 `3e2ef721fe404ca9b1d56d5d188d1ca9` (Sliced); Bar 320x22 `91cb9cf5a0214125b9ee1a6bf6b166ae` (Sliced); ArrowDown 316x20 `1cc8bfe395244e1e8782d0618759dad2` (Tiled) color:#2D0303/30% — text: Text #FFFFFF@18+o#000000
- **Slider_Hunger** 422x22 — parts: BarFrame 422x22 `bca04efe1eb3478aa6ec4eabc5d9f568` (Sliced); BarUnder20 422x22 `51d308b6399a4cda84f879e78d1e0edb` (Sliced); BarUnder50 422x22 `67f93af6d80d4ee19962c5cff35e876c` (Sliced); BarOver50 320x22 `764e10fda1bf4bb581303b6d85ce43a0` (Sliced); IconZero 34x34 `84e9831bf017442b993d25fdf29b8f7a` (Sliced); IconUnder30 34x34 `6b0c0827353949708cb95356490e6d68` (Sliced); +3 more
- **Slider_Unstable** 150x22 — parts: GaugeBG 130x22 `b450b69227f64edc91dff48b2bfe1b6e`; Gauge 90x22 `7f3c2c1c5f2044d4bc14e55323ab2ff3` (Sliced); Icon 40x40 `cb826138c8344269bba66f86f3cff267` — text: Text #FFFFFF@18+o#000000
- **Slider_Lab** 378x18 — parts: Bar 300x15 `e44efc371d8f49559197215706b9c74e` (Sliced); StarFrame 30x30 `d3aa190ce80b4ea4b8abc0270e06f5e9`; StarIcon 20x20 `1ba3a9e10f1849f4820d8d289e1394fe` — text: Text #FFFFFF@18+o#000000/95%
- **Slider_DNA** 124x22 — parts: Bar 70x16 `2e9b3b25709444cd85cf4b625bcededd` (Sliced); Icon 30x30 `3abaa04bdea54655918fe46bc79471b0` — text: Text #FFFFFF@13+o#000000
- **Slider_Common** 280x30 — parts: Bar 220x15 `2a4c8afd7e484e2fb17083694af7f86a` (Sliced) — text: Text #FFFFFF@14+o#000000, TextName #FFFFFF@16+o#000000
- **Slider_Uncommon** 280x30 — parts: Bar 220x15 `f149e78449d54828a9e0e08acf613cde` (Sliced); DNAIcon 22x22 `52056c911de14969ba208ba9339cde16` — text: Text #FFFFFF@14+o#000000, TextName #FFFFFF@16+o#000000
- **Slider_Rare** 280x30 — parts: Bar 220x15 `0106233cdc33426bb6420fcd4847264d` (Sliced); DNAIcon 22x22 `a39363b3a63a4b3891974274c981cf89` — text: Text #FFFFFF@14+o#000000, TextName #FFFFFF@16+o#000000
- **Slider_Legend** 280x30 — parts: Bar 220x15 `03580f9cd28645fea59e25c47db96d81` (Sliced); DNAIcon 22x22 `8a887b2760374d83954e88143fc43e1c` — text: Text #FFFFFF@14+o#000000, TextName #FFFFFF@16+o#000000
- **Slider_Aggressivity** 80x80 — parts: BG 80x80 `25cc239c44834caba812e6ca312edd87`; Fill 80x80 `933155dff36a441f8560aed7f4e0fba6` (Filled) color:#B51616; Icon 60x60 `459f770578ca42b39ca2a1827d3d99f9` color:#E42626
- **Slider_Stat** 176x28 — parts: Base 176x28 `24775eb645df48a69f772ba233c53323` color:#000000/80%; Progress 176x28 `cec128e748414682a40288e40be811a6` (Filled)
- **Slider_Stun** 176x36 — parts: Base 176x36 `7d162b4d7c624a74af33d83ed754c3e8`

## Tint (39)

- **Tint_Round_1** 140x40 `d827e598380844d8b96838368bd4284f` (Sliced) — text: #FFFFFF@22+o#000000/50% x5 (UIPriceAmount), #FFFFFF@21+o#000000/50% x3 (TicketCountTitle), #FFFFFF@23+o#000000 x2 (UIWalletAmount), #FFFFFF@18+o#000000/50% x1 (UIRemainTime) +1
- **Tint_Arrow_3** 100x100 `73ff8ae1c3904a6f878e8768ff50d6b9` (Sliced)
- **Tint_Square_2** 100x100 `6e8f27c4d1c844e290a85ab8ce3726d3` (Sliced) — text: #FFFFFF/50%@15 x2 (UIRefundText), #FFFFFF@26+o#000000 x1 (Report), #FFFFFF/50%@17+o#000000/30% x1 (UIText)
- **Tint_Circle_1** 100x100 `8d87171a1e1f4e0d8640e4fec69eed2c` (Sliced)
- **Tint_Round_3** 140x32 `3503305049f94e47ac5f906db72ff2bb` (Sliced)
- **Tint_Square_1** 100x100 `7d4d940d20984f50844c50df86ed3776` (Sliced)
- **Tint_Round_2** 140x32 `8ab6bc4be60b4ce59ac65bdc4f958bea` (Sliced) — text: #FBC134@20+o#000000/50% x3 (HealthPointValue)
- **Tint_15** 100x100 `7030de9f1db846889295948da9ad997f` (Sliced)
- **Tint_Close** 100x100 `72d7110c07fc473e9206e5e81ac18087` (Sliced)
- **Tint_7** 100x100 `4033dc5fb53c4fd2ad420c72d9535800` (Sliced)
- **Tint_10** 100x100 `12ae67571ec24e1481bbe80314abe88c` (Sliced)
- **Tint_11** 100x100 `7a565128b96245cbb7a02d113bbd175a` (Sliced)
- **Tint_Point** 100x100 `712d48fcd3f14ef9a0cd0117e097102f` (Sliced)
- **Tint_Back** 100x100 `e994def0ee48459ba5c1da32556378cd` (Sliced)
- **Tint_Arrow_1** 100x100 `f3819561963b490b92e0067b491b5aef` (Sliced)
- **Tint_Slot** 100x100 `933155dff36a441f8560aed7f4e0fba6` (Sliced) — text: #FFFFFF@24+o#000000 x1 (TextInfo)
- **Tint_Circle_2** 100x100 `53636f549707cc04dbfb048c4a2dfdc3` (Sliced)
- **Tint_Circle_3** 100x100 `377a00b9124a4633a3cc164990e3409a` (Sliced)
- **Tint_1** 100x100 `103a0156bd65428685bfefa992f73d11` (Sliced)
- **Tint_2** 100x100 `732280125bdc4dfcb7b2ad14552174b2` (Sliced)
- **Tint_3** 100x100 `7f2cb1556968483290644e8fd9345aa5` (Sliced)
- **Tint_4** 100x100 `c1ffd4fbf1ec44a88f144f038e721166` (Sliced)
- **Tint_5** 100x100 `64a0ddd447de42129c402be77874c3ed` (Sliced)
- **Tint_6** 100x100 `0290a6b93b8e4ad6a3bf756bf71addef` (Sliced)
- **Tint_8** 100x100 `cb5c3d602d5d4e22b6f8261c0c67ba56` (Sliced)
- **Tint_9** 100x100 `d79ded044f9042b8b100b0fd19749d2d` (Sliced)
- **Tint_12** 100x100 `65fc5b0f37d44f7a9859eed71ad01037` (Sliced)
- **Tint_Lab** 100x100 `084389f030df4e40a5c912923375787c` (Sliced)
- **Tint_Bag** 100x100 `79eaaccd4a5e4795b5d76a1d7ee63cec` (Sliced)
- **Tint_Backward** 100x100 `47a46ea9e909428189361c78a3033b48` (Sliced)
- **Tint_Rain** 100x100 `967d54ad13324836bfd8952299888645` (Sliced)
- **Tint_13** 100x100 `330227811b2f407fa0917e0e366d4091` (Sliced)
- **Tint_14** 100x100 `c73fecba2d5c42b68f046608b0b8ac0a` (Sliced)
- **Tint_AxeWeak** 100x100 `446c1da37dc94b50b477ff2b3728707c` (Sliced)
- **Tint_HammerWeak** 100x100 `8b2fd5790419484a803898cb49475114` (Sliced)
- **Tint_SwordWeak** 100x100 `3d73d784dc784a6bbfbdd728f72182ef` (Sliced)
- **Tint_BowWeak** 100x100 `7c9c57fcec2b41d2b62faf06f927890f` (Sliced)
- **Tint_Death** 100x100 `418f720220764028a73b915391839d8b` (Sliced)
- **Tint_Arrow_2** 100x100 `6492f08fa0c0400c9a8398f4832287a9`

## Icon_1 (105)

- **Icon_Check_2** 80x80 `cbfd758787954300935a4cad3a7bc86c` (Sliced)
- **Icon_Arrow_Up** 80x80 `207b3273ff9245529dd1f66ef5b46011`
- **Icon_Dino_1** 80x80 `02d340dea0654900a2924bfdd41bee69`
- **Box_Common_1** 80x80 `5e1a9c11e42e45bcb9885a707e9d94fb` (Sliced)
- **Box_Common_2** 80x80 `7bb46726c1f745119d73e8bd0a8bd3c1` (Sliced) — text: #FFFFFF@13+o#000000/90% x19 (Text)
- **Icon_Legendary_1** 80x80 `61c118fd38714469aad2b603104b5ba7`
- **Icon_Lock_2** 80x80 `14ddedccafb247a5825135a3476da1a8`
- **Icon_Close** 80x80 `187b4187e0a7487795617a410d95bb91` (Sliced)
- **Icon_Common_2** 80x80 `3abaa04bdea54655918fe46bc79471b0`
- **Icon_Uncommon_2** 80x80 `52056c911de14969ba208ba9339cde16`
- **Icon_Arrow_2** 80x80 `6abaabc4439a45bda5f0b1bc46955d69`
- **Icon_Dino_2** 80x80 `460d88f8e85143fca3d4bf9366595f8f` (Sliced)
- **Icon_Star** 80x80 `1ba3a9e10f1849f4820d8d289e1394fe`
- **Icon_Menu** 80x80 `07de07ee03784481b35c74581f0458e0`
- **Icon_Legendary_2** 80x80 `8a887b2760374d83954e88143fc43e1c`
- **Icon_Check_1** 80x80 `5a4d88eb567e4a2a8152f3d7038a60ad`
- **Icon_Arrow_1** 80x80 `dce7d13395f44d4bb1090593851681c3` (Sliced)
- **Icon_Arrow_3** 80x80 `874cb61a0dcb40b9be7e7527a0a6a966`
- **Icon_Key_E** 80x80 `058737be043b47dda2631557fa0332f4` (Sliced)
- **Icon_Star_1** 88x88 `74acd628efc74e529df114ab780f9d6b`
- **Icon_Star_3** 88x88 `6f64d011c3cc4ab49fdad778d7740d8d`
- **Icon_Variation_Down** 80x80 `7a60f0005bc4479ca4458653d5a50b02`
- **Icon_Rare_2** 80x80 `a39363b3a63a4b3891974274c981cf89`
- **Icon_Star_2** 88x88 `f5807d7f130d41bcaa93a69708f43a5d`
- **Icon_Help** 80x80 `f7a8ccc51af94f52a8e37099f82d6467`
- **Icon_Mouse_Left** 80x80 `4a3752f23faa40e29c6262dcd953d938` — text: #FFFFFF@22+o#000000/80% x1 (TextInfo)
- **Icon_Mouse_Right** 80x80 `4502d8223aed4f9ab467192d4d392d5e` (Sliced) — text: #FFFFFF@22+o#000000/80% x1 (TextInfo)
- **Icon_Craft** 80x80 `7cca67e9a1fd4fb9ac894b6c62324602`
- **Icon_Threat_Exit** 80x80 `cb826138c8344269bba66f86f3cff267`
- **Icon_Thermometer** 80x80 `85b87984450e48c58ff7ff4b64db561f`
- **Icon_WorldCoin_1** 80x80 `a8f3146382c07494d8dbce9b93c1a5c3`
- **Icon_WorldCoin_2** 80x80 `0ed521a0effa4a2184a28b4835ec7797`
- **Icon_Aid** 80x80 `edf338175aec4dac88ab10ff053e291c`
- **Icon_RedDot** 80x80 `4cdccfa17d0442e7b37927b14e26c61d`
- **Icon_Info** 80x80 `58bba42f9eed48179d087dff89117989`
- **Icon_Key_Space** 80x80 `8d01dd6eb94741c8b7c360843166064a` (Sliced) — text: #84716D@22 x1 (SKIP)
- **Icon_DNA** 80x80 `7113b50517a644fcbdeea35a6d04064f`
- **Icon_Emotion** 80x80 `7ab11f4014334b47b6fa670eade14b62`
- **Icon_WorldCoinShop** 80x80 `8343788b34894f1d84f67a92f7d60f3a`
- **Icon_Character** 80x80 `84695edbfd724588842d3732e6300e8d`
- **Icon_Weather_1** 80x80 `927dd3ba709c449dbb654782c3c639bb`
- **Icon_Weather_2** 80x80 `6a33f2f10a824241a58d45eedbd5d3c0`
- **Icon_Phone** 80x80 `1e88cfca129e49c78e931696abffd79d`
- **Icon_Map** 80x80 `cd8c1cc0a1104c739efc9737ec7883db`
- **Icon_Point_1** 80x80 `27847d03411648caaf3e8b196897fdb5` (Sliced)
- …+60 more — grep `data/themes/casualsurvival.ruids.json`

## Icon_2 (74)

- **Icon_Hungry_01** 70x70 `3e513f6c1bf04f83911f942049511910` (Sliced)
- **Icon_Hungry_02** 70x70 `2e17097edf3541aabac7ba622303d00b` (Sliced)
- **Icon_Hungry_03** 70x70 `7cf4febc52724fbcb417eae39c85ccc3` (Sliced)
- **Icon_Hungry_05** 70x70 `6b0c0827353949708cb95356490e6d68` (Sliced)
- **Icon_Hungry_06** 70x70 `84e9831bf017442b993d25fdf29b8f7a` (Sliced)
- **Icon_Hungry_04** 70x70 `db55aa0df7564884b259a917936edd81` (Sliced)
- **Icon_Research_HeatResTrain01** 80x80 `ed6c3aec6b94494993653dae627c394b`
- **Icon_Research_HeatResTrain02** 80x80 `f465fd6e6fc14b83a18f29d7cae1d161`
- **Icon_Research_HeatResTrain03** 80x80 `3d5de5fad2f44cad8c520cc58e6dcb58`
- **Icon_Research_ColdResTrain01** 80x80 `1c5cbca7b5f44d7684530b5c9e794bcb`
- **Icon_Research_ColdResTrain02** 80x80 `b3e12f6432c04c9b944704432d2d43fa`
- **Icon_Research_ColdResTrain03** 80x80 `c1e1d74868824b06aea847934fcf4b3a`
- **Icon_Research_MaxCount_Table01** 80x80 `b534443f95c048bd8fafc1f91b788c5e`
- **Icon_Research_MaxCount_Table02** 80x80 `92e167a4273d4708814d4334e18399cc`
- **Icon_Research_MaxCount_Table03** 80x80 `a48a2eaad19d470f80dcea088856e087`
- **Icon_Research_MaxCount_Furnace01** 80x80 `0c0a067586c343f5a3f77a1a85b57a87`
- **Icon_Research_MaxCount_Furnace02** 80x80 `b99175c265f64799b7c7fa8158b49dd3`
- **Icon_Research_MaxCount_Furnace03** 80x80 `a063f757342e485fa5a7c6dfc4f39a51`
- **Icon_Research_MaxCount_Rack01** 80x80 `ecb785ed97f147f1b5c77af0d2190d15`
- **Icon_Research_MaxCount_Rack02** 80x80 `1f7d6052a00646c18d60b9ae548241c2`
- **Icon_Research_MaxCount_Loom01** 80x80 `fd9f1f9a2ce94e33b1dce1d7f48569db`
- **Icon_Research_MaxCount_Loom02** 80x80 `007c384c22274918803c820150a21191`
- **Icon_Research_MaxCount_Kiln01** 80x80 `0f2a3a350add42e3aed8643264bf6581`
- **Icon_Research_MaxCount_Kiln02** 80x80 `0086270eadd04ccd8aec4aeb7c84988f`
- **Icon_Research_MaxCount_Farm** 80x80 `c22e90a605774ec09596f10ef94513a7`
- **Icon_Research_MaxCount_Well** 80x80 `678d2e65cce4483eafadb653fd0c187e`
- **Icon_Buff_Hungry** 80x80 `fbd3f1b4a54a47a7a80be81f641cc150`
- **Icon_Buff_DeathPenalty** 80x80 `de8138fd565e4c4abbc6e0f8edf8225f`
- **Icon_Buff_Night** 80x80 `f4a6a35d72ee4f2abd72768366593538`
- **Icon_Buff_Sunstroke** 80x80 `c3302989412146998662efc76c071086`
- **Icon_Buff_Frost** 80x80 `b9c11c7b664c4f0e88b7e9235ced6fac`
- **Icon_Buff_SpeedDown_1** 80x80 `01284635eb8f4deaac502a4f7e8be3cd`
- **Icon_Buff_SpeedDown_2** 80x80 `ccff0c6a712a40f1b39df577463fc318`
- **Icon_Buff_Skill** 80x80 `771216202c0b4bde961d160276409cdd`
- **Icon_Buff_Hot** 80x80 `50da116482d449e0a9b83eaa86513a57`
- **Icon_Buff_Cold** 80x80 `4f94589fc0b2406da520dd58808c8226`
- **Icon_Buff_ExtremeHeat** 80x80 `24d934599bf645b983548687157c3f32`
- **Icon_Buff_ExtremeCold** 80x80 `e1dc73cba792424cb609aabf165c34af`
- **Icon_Buff_Disease** 80x80 `9c7a673fd5b2439f8786e85ee3f44061`
- **Icon_Buff_FoodPollution** 80x80 `8a46b58dccce431a8026c0385880d7f9`
- **Icon_Buff_PolarNight** 80x80 `5a1c48ed5e654eefa92ba67ee26a3494`
- **Icon_Buff_AttackUp** 80x80 `e1bb1a9f12c74cfbbbedf478ad1318b6`
- **Icon_Buff_ArmorUp** 80x80 `bf311f27ecb74e14aa0e5bbc2619e86f`
- **Icon_Buff_HotReg** 80x80 `5096ea5c1bbe440a960e214133ba2c02`
- **Icon_Buff_ColdReg** 80x80 `91deb3905b87476db74a0457c1f14304`
- …+29 more — grep `data/themes/casualsurvival.ruids.json`

## Icon_3 (151)

- **Icon_Food_Coconut** 80x80 `930b06e12a454e85aee2b0a10538a396`
- **Icon_Food_Meat** 80x80 `dbd5b8e8e71f41f8a716d3897934b28c`
- **Icon_Food_Fish** 80x80 `d0969c27df384bce9413b95b1eca7969`
- **Icon_Food_Wildberry** 80x80 `0d1abf8bec8045be840e7b5b0dfd1e6e`
- **Icon_Food_Water** 80x80 `234c8c81576b497eb05b28979ec54969`
- **Icon_Food_DatePalm** 80x80 `fab561cf8a304de5a4781eb13f65ca0c`
- **Icon_Food_Lilac** 80x80 `dcbd2db489744cde982d58f7d3b77f69`
- **Icon_Food_Bud** 80x80 `576449d0e80d4eb9bf9c1096f99985a7`
- **Icon_Food_Cactus** 80x80 `3251f0bc332142eb9421a4a520f13e6c`
- **Icon_Food_Pinenut** 80x80 `884c58d1b76f4fd485a3219175f6c5d1`
- **Icon_Food_Orange** 80x80 `153d4d850ada49cebde03260ecd121c7`
- **Icon_Food_Ice** 80x80 `063d176e38f6494493a33d70ace85169`
- **Icon_Food_Corn** 80x80 `9f0768603d3b4749b87001050433fc69`
- **Icon_Food_Wheat** 80x80 `36e8e6ada6cf42eaa7dd046b5ebddec7`
- **Icon_Food_Ginseng** 80x80 `88802e0014db4b9c9dbaf0a5dadfb4b0`
- **Icon_Food_GrilledSkewer** 80x80 `f7657f753e9240bd9be357a97179712f`
- **Icon_Food_GrilledSkewer_Fish** 80x80 `ba527436ab1644e0b9de114f24d50f1a`
- **Icon_Food_MeatDried** 80x80 `ce365fde7472487bb57bfe39e7d314cb`
- **Icon_Food_FishDried** 80x80 `63eb6554debf4e3aa8b335181d000794`
- **Icon_Food_StoneGrilledMeat** 80x80 `94f08b5f62734b22bcc2d5f98511783e`
- **Icon_Food_RoastMeat** 80x80 `a22e37bc4cc347359fc7e0a28a5a7671`
- **Icon_Food_GrillRack** 80x80 `b9dd5f6d5f534ebea06e8e2153fd7d3f`
- **Icon_Food_Bread01** 80x80 `95a94b25c6054c71a40c343a0c2934c5`
- **Icon_Food_Bread02** 80x80 `8544813d67c9478b8791c621dfadde5a`
- **Icon_Food_Bread03** 80x80 `fca0a12bbbe3443db95ca860db3bfea9`
- **Icon_Food_DatePalmEnergyBar** 80x80 `e50e70414c25422bb1936da3fe089218`
- **Sprite_Food_DatePalmEnergyBar** 80x80 `ba8eacd605444fddaddce64e5c5540d0`
- **Icon_Food_CoconutDrink** 80x80 `b104ac9799644f43818271106c5f618e`
- **Sprite_Food_CoconutDrink** 80x80 `0bcb2085f1ed4f339cac3ea32f00f24a`
- **Icon_Food_PinenutEnergyBar** 80x80 `f097cd105a624d0fb52259cecba37bd3`
- **Sprite_Food_PinenutEnergyBar** 80x80 `bdbfbb61eda44453b578aa4f94b11d3e`
- **Icon_Food_IceDrink** 80x80 `38187e4c88d4457b9539a5445d010bad`
- **Sprite_Food_IceDrink** 80x80 `1e2d49d8f30647e7b4f1824a849bb425`
- **Icon_Food_Medicine01** 80x80 `8b7fec9608fc4a7b9b40ab894d1e77e9`
- **Icon_Food_Medicine02** 80x80 `0a249488aa82490bbfe0905b99194184`
- **Icon_Food_Medicine03** 80x80 `1c1d310a36414aef9eb468b8fde107a6`
- **Icon_Food_Spam** 80x80 `b0612597908646c7b3a46b4724839b9d`
- **Icon_Item_Stone** 80x80 `951cbce47c6f4a4594c35da7022bbfdf`
- **Icon_Item_Rock** 80x80 `2052b386fc2a4dc493f0ad262ab0f596`
- **Icon_Item_Reed** 80x80 `25e38aa8caa140c3a0466b3e88a10daa`
- **Icon_Item_Flax** 80x80 `11899cc9c04943e890a6092991fa1525`
- **Icon_Item_LeafBig** 80x80 `e4558dd16e3440f3b0c53eccbb933c15`
- **Icon_Item_Log** 80x80 `683ed8adc8b9476d9fc88d4e2eba9fdb`
- **Icon_Item_Branch** 80x80 `b6f6bf13455b4cbf9677d210151a7e88`
- **Icon_Item_Mud** 80x80 `73c1812cb04c4c569fc2697be6c35d90`
- …+106 more — grep `data/themes/casualsurvival.ruids.json`

## Icon_4 (144)

- **Icon_Research01_A_02** 80x80 `8e0412ee66274f558994dbfa4b7a139e`
- **Icon_Research01_A_04** 80x80 `39bcb389e3584662957b9733338fc8cc`
- **Icon_Research01_A_07** 80x80 `903c65fcceaa4701bcdbc9cc5f22c0bf`
- **Icon_Research01_B_01** 80x80 `85b04a52027c42caa487bd996ab5f50d`
- **Icon_Research01_B_02** 80x80 `879428f703604e93a536eace915ae1a0`
- **Icon_Research01_C_01** 80x80 `22eb966e87104c239c15b91c5517b838`
- **Icon_Research01_C_02** 80x80 `f34e73051f464099a03feb8c614ea338`
- **Icon_Research01_C_03** 80x80 `fe7ac889e4494906b95ee3b835823be2`
- **Icon_Research01_C_04** 80x80 `a19099c249b645b4940ef972f7abf3f4`
- **Icon_Research01_C_05** 80x80 `543090d4eb8546e69f3e0db3ebaaa92f`
- **Icon_Research01_C_06** 80x80 `3b6e6917c65a409f838fef75d8950e4e`
- **Icon_Research01_C_07** 80x80 `9cafe09951a14a97bac4daab904279c9`
- **Icon_Research01_D_02** 80x80 `15d697f171b141ef8ee038694a24f60e`
- **Icon_Research02_A_06** 80x80 `3191c8b89cfa4425a10c211dc6eadea1`
- **Icon_Research02_A_07** 80x80 `76e05e6b380f4af89f3e835b22f06f7f`
- **Icon_Research02_A_09** 80x80 `f22d253a9bdd463a88384f86e1d25395`
- **Icon_Research02_B_01** 80x80 `9445be5157fd4d03abcb4fe62062a643`
- **Icon_Research02_B_03** 80x80 `76a188fc0bcc4e2bbd18752d62659202`
- **Icon_Research02_B_04** 80x80 `eec72dfd25f149c3a835b6137d035ac3`
- **Icon_Research02_C_01** 80x80 `28269e25f9bb45ceaee7d6142f6426f6`
- **Icon_Research02_C_03** 80x80 `df26cc98b8ed41dea3765057112c7873`
- **Icon_Research02_C_04** 80x80 `67009ccb850542b8ab4a1b30a44113c5`
- **Icon_Research02_C_05** 80x80 `ec05267a825f48b1adcbe0c0585c9c75`
- **Icon_Research02_C_06** 80x80 `31214dc5c0ff426b8520fb309086e5fc`
- **Icon_Research02_D_02** 80x80 `5b01a09945f94b749267a2d82113c07b`
- **Icon_Research02_D_04** 80x80 `52c9223d8dec4aec9e6ea45a9edff62f`
- **Icon_Research02_D_06** 80x80 `3f726083293d4872ace4be2204ad59a9`
- **Icon_Research03_A_08** 80x80 `640d46703a9d4d6a996219007330bbd1`
- **Icon_Research03_B_01** 80x80 `c8bdc32776d74da7959dd1731c8fdddd`
- **Icon_Research03_B_03** 80x80 `0825dfeb5c9248fe88f685c7bb580b37`
- **Icon_Research03_B_04** 80x80 `0e9d53dd6f64409f98921cd2e2f1531c`
- **Icon_Research03_C_02** 80x80 `099c6f0c13e5435985fe1dd44554a9ca`
- **Icon_Research03_C_03** 80x80 `9bfa653b325b487e9e6eaf2e9e3826d7`
- **Icon_Research03_C_04** 80x80 `16b76b78a39c42d083c04f87586797e2`
- **Icon_Research03_C_05** 80x80 `74dd835498bf4a1d9275924e31841ef3`
- **Icon_Research03_C_06** 80x80 `203ecd08f4384f11bfbc74473dece1a5`
- **Icon_Equipment_Clothes_School** 80x80 `08eb9ec92b1046c79b797009144bf6d0`
- **Icon_Equipment_Clothes_Leaf** 80x80 `17c2258255584d85a62f6661564b4ae4`
- **Icon_Equipment_Clothes_Leather** 80x80 `2a1af0e0ca4e4817ba55fbf221eaf144`
- **Sprite_Equipment_Clothes_Leather** 80x80 `12d8e07a4a284c7dbd6e531e4d858710`
- **Icon_Equipment_Clothes_Bark** 80x80 `c6da3051c4f5407e8c26653786189643`
- **Icon_Equipment_Clothes_Suit** 80x80 `15367182d80245939fa735fb013f82a7`
- **Sprite_Equipment_Clothes_Suit** 80x80 `14b25d0e97b546b7aa9a8d915515344e`
- **Icon_Equipment_Hat_Suit** 80x80 `e69a85de820945e38aad35135e5b7275`
- **Sprite_Equipment_Hat_Suit** 80x80 `19fce3cca49b445da6a53b376264c098`
- …+99 more — grep `data/themes/casualsurvival.ruids.json`

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#FFFFFF`** — 469 uses (sizes 5–64; mostly on SampleLab, Default, GameShop)
- **`#E6B848`** — 23 uses (sizes 13–28; mostly on Status, SampleLab, Panel)
- **`#FBC134`** — 9 uses (sizes 16–100; mostly on SampleLab, Default, Panel)
- **`#FFFFFF/50%`** — 5 uses (sizes 15–22; mostly on GameShop, Panel, Slot)
- **`#FF0000`** — 5 uses (sizes 18–20; mostly on SampleLab, Default)
- **`#FFC635`** — 5 uses (size 56; mostly on GameShop)
- **`#A978C6`** — 4 uses (sizes 20–24; mostly on Default)
- **`#FFFFFF/80%`** — 3 uses (size 20; mostly on Panel, Crafting, Research)

**Outline: 483 of 542 text nodes (89%).** Most used: `#000000` x345, `#000000/50%` x59, `#000000/60%` x20; typical `OutlineWidth` 0.2 (also 5 with a `+s` halo — `Underlay` at offset 0, a flat ring, not a drop shadow).

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (15)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/casualsurvival/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`Crafting`(84), `Dead`(17), `Default`(245), `Dialog`(18), `GameShop`(165), `Minimap`(48), `MsgBox`(74), `NewContents`(10), `Pause`(11), `Research`(77), `SampleLab`(682), `ScreenEffect`(6), `Status`(82), `Title`(16), `Toast`(5)

Long-tail lookup (all 704 RUIDs incl. every icon): grep `data/themes/casualsurvival.ruids.json` by part name keyword.
