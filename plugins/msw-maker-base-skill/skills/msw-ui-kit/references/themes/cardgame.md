# UI Theme — Card Game (`ui-resource-cardgame-package`)

Harmonized UI RUID palette extracted from **Maple Duel** (original MSW world), published as [`ui-resource-cardgame-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-cardgame-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Panel (3)

- **Panel_2** 521x411 `a21e588bb2cf4656817ede0d7e0706db` — parts: OkButton 164x75 `a3c52fbb13164dccbd280d91a8da71e7`; CancelButton 164x75 `6f768884ce24428eb54e9e0184e78b07` — text: #FFFFFF@22 x2 (Text)
- **Panel_1** 549x537 — parts: Pattern 481x428 `79ed3b4fd4844887a294acb791b2e89f` (Tiled); Background_1 -6x54 `99a4751574294ff8b02d8b1c5aa40f0c` color:#FFFFFF/50%; Background_2 505x503 `3d0a8d286751470f8f9e042adc667608` (Sliced); Img_Event 473x416 `9365c65552394be6a06b50f01023dd9f` (Sliced); XButton 56x61 `e01ef74a1ecf444bbb013c4313a8d0a9` — text: Title #FFFFFF@27B+o#000000/50%
- **Panel_3** 1040x820 — parts: Background_1 1004x792 `d9b68fae16404c5c81228b6c45cf40a5` (Sliced); Background_2 346x53 `55fc3c207dc24c3481f8dc2dac76e804`; HowButton_1 389x65 `1a38ba20789c416da0a5d2194201d6ed`; Background_3 979x634 `2ae5f6fdb0b8431aaa3d46acafbd1542`; Background_4 972x623 `4e2c18c56e79488589c4de82cf766610` (Sliced) — text: Text #EEC78F@25B+o#000000/50%, Title #FFFFFF@27B+o#000000/50%

## Base (13)

- **Base_4** 280x180 `ac319875b43f40ea86a069c468a1a26e` (Sliced)
- **Base_12** 236x376 `7a45d28eee9d48a5ad7b4acc73588453`
- **Base_13** 484x240 `9365c65552394be6a06b50f01023dd9f` (Sliced)
- **Base_1** 273x101 `b362d317e3a54a4891d493ad8e5742b7` (Sliced)
- **Base_3** 224x224 `16b391d441ad46afae46305de48b354c` (Sliced) — text: #FFE12E@22+o#000000/50% x1 (NicknameText), #FFFFFF@19+o#000000/50% x1 (ProfileCodeText)
- **Base_7** 104x81 `d6bda2420fec4eceb755d70e0dbd2c1d` (Sliced)
- **Base_9** 200x44 `ffdc4b11ef384e2cb4996562d867dd80` (Sliced) — text: #FFFFFF@21 x3 (TitleText)
- **Base_2** 272x105 `12d1a1e889264eb7a2a68fd9a5d44a42` (Sliced)
- **Base_5** 164x287 `668f1c7d7bd742e99198ffa436cd0dae` (Sliced)
- **Base_10** 200x44 `18fb0db0d0994a5288cd6b2aad7b30b2` (Sliced)
- **Base_11** 200x44 `9b95127751fa4f65abff995511a53a30` (Sliced)
- **Base_6** 200x84 `4585df922c98448cb1dcc9e416ad7346` (Sliced)
- **Base_8** 100x100 `21e58d3546304942a07d75c778915cbd` (Sliced)

## Button (41)

- **Button_1** 171x78 `cc87cc30a9a84425a2a809d85f176009` (Sliced) — btn states: disabled `8809de80ad114281b9c5a0164e64a37a` — text: #EEC78F@23+o#000000/50% x2 (Text)
- **Button_3** 171x78 `8809de80ad114281b9c5a0164e64a37a` (Sliced) — btn states: highlighted `cc87cc30a9a84425a2a809d85f176009`, pressed `cc87cc30a9a84425a2a809d85f176009` — text: #EEC78F@23+o#000000/50% x4 (Text)
- **XButton** 56x61 `e01ef74a1ecf444bbb013c4313a8d0a9` — btn states: highlighted `f24a6333e4df404795e922ec2966e997`, pressed `5952570d481245a9a4fbe562f3c030c5`
- **CardButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `83e06d1d107347569bf9f0d57e50d92c` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **ShopButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `775a2c04197b4e84bfa93b28dbdd094b`; Event 104x65 `568f005df8024647a1920ead2a97740e` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **RoomChannelButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `d21260e4d9c849e7b56e86d78d093ff2` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **PracticeButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `9b20f4fc05254fe7a211598d3923bf10` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **ReturnButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `5e82e438cc2243069cd88f2013976052` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **SurrenderButton** 224x94 `9505617fb63c447c8ff9c15c18d88064` — btn states: highlighted `398dfdb46d534ea2a2373e4f5d29ae2a`, pressed `1016088c7aca43c78cdd06c01645ab1b`, disabled `1016088c7aca43c78cdd06c01645ab1b` — parts: Icon 64x56 `8f37d8a76872425698ca8722cd3f2c02` — text: #FFFFFF@25+o#000000/70% x10 (Text)
- **TabButton** 389x65 `1a38ba20789c416da0a5d2194201d6ed` — btn states: highlighted `cb53081ffd9c4920b7edda18a521e403`, pressed `cb53081ffd9c4920b7edda18a521e403`, selected `cb53081ffd9c4920b7edda18a521e403` — text: #EEC78F@25+o#000000/50% x7 (Text)
- **ChatButton** 73x79 `9c23e723bd9d4f50a13ed2e198c79737` — btn states: highlighted `372ed7e200da41bba0d8c6b6ce6692f1`, pressed `6d9db0a06e844ae3850174e033792ebd` — parts: Icon 56x54 `f317d752a88148be9a1eb11bf3ced807`; DisableIcon 37x37 `ee965aaf10154e4092aa22c89d405ad5`
- **LeftArrowButton** 56x65 `de8f55e3fcc24ac3ba93ce63387385a1` — btn states: highlighted `b445f3ccba0f46f59b5b4fed0413d0e3`, pressed `bf0d9f60123447739c50d436c47cc2b4`, disabled `5f2bef0422664642895c5d9072af0d10`
- **RightArrowButton** 56x65 `990efe92562b49389e27194d4cdb2817` — btn states: highlighted `b52ca557f9ca4a2b942cbd3015b3188e`, pressed `304b6fc851e6461ebd56d0e7d43e7df7`, disabled `e38decc6595a46c5a6418670b99c8a84`
- **Button_2** 171x78 `46b2350c6db44ab2a0a342e5881f7604` — btn states: highlighted `cc87cc30a9a84425a2a809d85f176009`, pressed `cc87cc30a9a84425a2a809d85f176009`, disabled `8809de80ad114281b9c5a0164e64a37a` — text: #EEC78F@23+o#000000/50% x3 (Text)
- **NextButton** 70x76 `51d67273c14b40f380e22daf817b1202` — btn states: highlighted `b3eb96205785418287a0e57d6ef0bba3`, pressed `1c49012b7ae14188902d26f3d6682b24`
- **DeleteButton** 29x29 `e03a94f6bf3540699ab0e5e45da5488b` — btn states: highlighted `0c6e0d2fe1ad4e2d8288d089441bcf34`, pressed `aff32f08503a4aafbabc8bbda15e1359`
- **NoteButton** 28x28 `123400cf22814d8fab2fe98d7fbeff76`
- **GuideButton** 73x79 `98443474704148978f4637c3da984663` — btn states: highlighted `a5348e82685d4bd2b15423a0cc5cb236`, pressed `5175b7638b414238ab5ee8f5a4ea733d`
- **SocialButton** 73x79 `e3330c5b0dea46f9b24a264ba393949a` — btn states: highlighted `7669acd7257b4440b67c77fe9e12d39a`, pressed `3e0b35da2eec473994403cb5c44c7fa8`
- **NewRoomButton** 262x168 `ae7796c86d504325b6be62aff634c97f` (Sliced) — btn states: highlighted `dba578d3cbff418a9376f9b7f452fc3d`, pressed `e2a26d174851468a948c0e9783af6772` — parts: Icon 51x51 `786f919b960a4cdabac1603045783f16` — text: #29160E@20 x2 (Text)
- **CheckButton** 148x62 `c59b852af9434655b8f2f74cb752148f` — parts: Icon 49x38 `f0e16abd9baa4baeab39f1e62a018f44` — text: #29160E@20 x1 (Text)
- **FriendButton** 194x72 `126f1e1a02b14cbe9ddef4b9119e77b3` — btn states: highlighted `1729df058dcc4e55bf5ed2786c33d024`, pressed `4dd570b0f9b549ffa916a9cb13b7dac5`, disabled `4de4f2d94a0a40b69d18580f8bde1fa5` — text: #FFFFFF@22+o#000000/70% x2 (Text)
- **CommonButton** 94x93 `5f0b4b38581e460b82c72a1cd3cf6e74`
- **WarriorButton** 94x93 `52029a7f7e434e93a484b317e5fb6539`
- **MagicianButton** 94x93 `7569481738174053bc6bf571bac423c7`
- **BowmanButton** 94x93 `34e2995f7d9044659ac3a6adca800a7f`
- **ThiefButton** 94x93 `353e6526d3e24d49b1ce90947cc365dd`
- **PirateButton** 94x93 `eec1f56b76514d7c9b038bbefa54e7ae`
- **CardBackButton** 111x93 `c8b28f75993b4c34b99d6f655353986a`
- **AcceptButton** 122x64 `a1327acdf0974af58faa3ee2a5d26c0f` — btn states: highlighted `0983a7a556e648bf9761d45745cc65be`, pressed `b6c411cc09b541eeb096fb57c0467dd7` — text: #FFFFFF@20+o#000000/50% x2 (Text)
- **RefuseButton** 122x64 `5106eb372a4d42709ec6880747690018` — btn states: highlighted `859aab7760eb4f9a9701622683677bb8`, pressed `6745a334cef1429a9809b092dcdc4cc4` — text: #FFFFFF@20+o#000000/50% x2 (Text)
- **GameStartButton** 471x105 `7882b590091b41d58a21b9e9f2d8e928` — btn states: highlighted `028c8c6192da4fb5b6d3f88d11e7725a`, pressed `23e11f4265c140319b7241e8ed04021b` — text: #FFFFFF@28+o#000000/50% x2 (Text)
- **CancelButton** 470x104 `2925bb30d9784439aba4d2002b2aafce` — btn states: highlighted `ef4b4919722444a489db8d057502f397`, pressed `a8e05aaba9594c19aaaf375ec8eb0f04` — text: #FFFFFF@28+o#000000/50% x2 (Text)
- **FinishButton** 143x95 `efb199cdd41d47a3bed624b58e24240f` — btn states: highlighted `a9fb4f56097d4c7dba7d17b71ef809c3`, pressed `309e369edeb84a909558e0611d16a631` — text: #FFFFFF@26+o#000000/50% x1 (Text)
- **DeleteButton** 95x95 `6a1c0b1d5e9d41429421127cb58b0dea` — btn states: highlighted `1edb47d0dd334466bbabe50e7a952c03`, pressed `b92db0735f9b4165a670f9c6c2fe5c44` — parts: Icon 30x35 `799d93f379794cfab91cc423173a4952`
- **BuyButton** 876x104 `3b67f77b9dfc49a782fd7cd0647f63b5` — btn states: highlighted `18dee31304bc48f79fcccf404d13f872`, pressed `b0108a9087ab46b9b6ab9713657bfcb6` — parts: Icon 40x40 `627c810aa54044cdb9669f8446c0dc17` (Sliced) — text: #FFFFFF@28+o#000000/50% x2 (Text)
- **FriendRequestButton** 212x88 `666ea07b3ffc4eb99eff0e42e46e15bf` — btn states: highlighted `793aebb34ab84f8e89a00a885ccaac4f`, pressed `92dfa3f1b1fa43f4bacd1274d512ff66` — text: #FFFFFF@25+o#000000/70% x1 (Text)
- **NoticeButton** 112x112 — parts: Background 112x112 `796e915db9aa4b74afd7f5d8315d67e2`; Button 81x81 `1f6ac2fd7fe24d4e8a4bb4954c35234a` — text: Text #FFFFFF@21B+o#000000/70%
- **EventButton** 112x112 — parts: Button 71x75 `d6a4c860b7204e35bcc24c40bdb8f73c` — text: Text #FFFFFF@21B+o#000000/70%
- **RewardButton** 112x112 — parts: Button 81x81 `f95261175be24b499633cb7957a78d21` — text: Text #FFFFFF@21B+o#000000/70%
- **RoomButton** 250x150 — parts: Button 263x169 `cacdaf96858e4a9988bf1923323fc08f`; Label 194x63 `9173c06709394c64bb272ab72b7350a7` (Sliced) — text: RoomName #FFFFFF@24B+o#000000, UserCount #FFFFFF@20B+o#000000/50%

## Slot (2)

- **Slot_1** 138x232 — parts: BG 136x198 `3dec99420d6e43b29fa5b79d3a686bbc`; Image 348x444 `ef11ef1bf4674ae4998e4f9fbeb578fa`; CardNumBg 74x32 `41f98dc20c864b81980f1c80afa170d6` (Sliced); ImgDim 129x189 `543e956818b047bd9227a50ca004c0b5` (Sliced); Icon 116x102 `2c2c61aab7074c2ca78fe505a3506925`; Button 129x40 `eeff7f17d65146fc99ccd07fbb9341fa` — text: CardNum #4DFEE7@22B+o#000000, Num #FFFFFF@18B+o#000000/50%, Text #FFFFFF@17B+o#000000/50%
- **Slot_2** 138x232 — parts: BG 136x198 `196e030a1937455382c3e1f68ee7a8e3`; Image 348x444 `83b140f98ed8469a912c0bb7e5d259d5`; Deco 36x36 `610efa309b6d4eb9a397766e621d1177`; Button 129x40 `741876c7f8934ea1b7079a8c56e12b0f` — text: CardNum #4DFEE7@22B+o#000000, Num #FFFFFF@18B+o#000000/50%, Text #FFFFFF@17B+o#000000/50%

## Card (45)

- **Digit_0** 60x60 `6f63525a2ede45b6bc6bd1436cbf12ed`
- **Border_2** 142x206 `dc14abffdb9f400e819f61b9ab7e6805`
- **Rarity_Rare** 52x56 `095bb653d03a42a28a14d92d3b291b3f`
- **Rarity_Rare_Eff** 88x88 `9dfa8f9eb88e4e329f53427fff457282`
- **Pattern_2** 142x206 `69638e27f71145d594b9a894bbaa7bd7`
- **Rarity_Epic** 52x56 `466ea4518c8146c9ac45a6d39b873d0b`
- **Rarity_Epic_Eff** 88x88 `ea5ba2b88a7f4c448743b22c8a15fd00`
- **Rarity_Unique_Eff** 88x88 `f1c9f3b1a0534a2fbdee00af95fdaa5f`
- **Rarity_Legendary_Eff** 88x88 `947361c524d4490c9fb8b64bb4408389`
- **Digit_1** 60x60 `eb5c42b6337748e1b83c7ac6536f7189`
- **Digit_2** 60x60 `61fcb7d398484573ae9142ab116653d0`
- **Digit_3** 60x60 `4946d6bf64134743ac2222bc7c6eae77`
- **Digit_4** 60x60 `da5e9585e01c4aa9b04dd4371494f871`
- **Digit_5** 60x60 `3b3bc70baa564a299f5af5df42999891`
- **Digit_6** 60x60 `3409c8dda41f4067a152471240b8ce51`
- **Digit_7** 60x60 `08aeea09a09049ab8c3924500c78ba1c`
- **Digit_8** 60x60 `18aad6072f05408fb5f7cbf10a79560a`
- **Digit_9** 60x60 `3cea33a0382640668ad56497d9d1cd6f`
- **Digit_Plus** 60x60 `f6ef80c8cd0d46828006f9fc379538e4`
- **Digit_Minus** 60x60 `5ff067421aef4e26a14e986a9a9b7792`
- **Pattern_1** 142x206 `e6f5287bcbe142f58ceef5d88786aecb`
- **Border_1** 142x206 `42681a2be0d24823b7fdce8ee25caff2`
- **Border_1_Gold** 142x206 `f44ed7f588244a0fac573209e6e61b5f`
- **Border_2_Gold** 142x206 `359082ed43c44cc1a597b00b61bafa36`
- **Border_3** 142x206 `0527c136ed4544a39be0c55de5028971`
- **Border_3_Gold** 142x206 `db87dab173f14368b781cc0a0f7a14b6`
- **Border_4** 142x206 `afc0a886889a4349a40442831a035bb9`
- **Border_4_Gold** 142x206 `072c0725fbaa4e24afcd750d7b1fa0f0`
- **Border_5** 142x206 `f6e68bef0f7d4e0d9e1cb747011c4624`
- **Border_5_Gold** 142x206 `48f3bfa711624187bb74b387aa2188dc`
- **Border_6** 142x206 `0b7546fc540648579e19b32b518f1102`
- **Border_6_Gold** 142x206 `1e5f682c39b4451cbce34f79c5e485fd`
- **Border_7** 142x206 `0fe39de537514cb5a97e08a853e72853`
- **Border_7_Gold** 142x206 `6c1b4e77b87941f5af653bab5c6bd86d`
- **Border_8** 142x206 `66938ce0ab5d4f399932868aaa7f4c73`
- **Border_8_Gold** 142x206 `514c8527b865475183aa056461eb8cde`
- **Border_9** 142x206 `b75f40e83691416d9fd27108d420cec2`
- **Border_9_Gold** 142x206 `62ad832093594cb2ab3d631937900835`
- **Border_10** 142x206 `75985e11782a4d8bb32f170764ea0cfb`
- **Border_10_Gold** 142x206 `ce0ced7131ce4a49a64f26e251aed275`
- **Border_11** 142x206 `37f97d473fb24bbfb671e4a0c0b2bb21`
- **Border_12** 142x206 `b27eefcea85a4e2d9dca5b867ec91124`
- **Border_12_Gold** 142x206 `ebad6509739f494aae49c9781793eb59`
- **CardFront_Normal** 284x416 — parts: Background 232x360 `ebdf2ae1018846e1b0324ebae14ce55e`; Sign 302x424 `ddabe088a4d1455d91e3c43fd1a5fec0`; Image 92x100 `3fad5980743b46c5971581eb33a735dc`; Image 92x100 `eff9a00857904a089be881d4582eaddf`; Image 92x100 `8bfb41b46d8f4162b914c48f26e54d77` — text: NameTag #FFFFFF
- **CardFront_Gold** 284x416 — parts: Image 92x100 `8a5dea809e694b3a87c36be5fc9a1764`; Image 92x100 `1115e32583254007a9f307a561b789c4`; Image 92x100 `7a2e27851a464762abef81efaabdefe0`; Glitter 284x412 `42ec48ed1e4642b0b3c923c7eea6c50d` — text: NameTag #FFFFFF

## Card_Background (75)

- **Background_68** 116x180 `ebdf2ae1018846e1b0324ebae14ce55e`
- **Background_1** 116x180 `0012ab3916c246539049a314600b3b91`
- **Background_2** 116x180 `00c537aaf22949ce8c358b43941d40a4`
- **Background_3** 116x180 `02147d6b8b064bf5bab8b7c13d2c86eb`
- **Background_4** 116x180 `0981aaf7900f4f97afa3acf3e524f48f`
- **Background_5** 116x180 `0d36e1c4a9d642fc9ecd3b6b20d394f5`
- **Background_6** 116x180 `0d82e01283744b3cb25acd8b7208030a`
- **Background_7** 116x180 `0fd0d904e878407b85da9378031c1ada`
- **Background_8** 116x180 `11a1bb0f02484db5900e7c15cb265126`
- **Background_9** 116x180 `121e7aa4de2e41a19ffa01cbbcbaa220`
- **Background_10** 116x180 `1270265b41a84a96be86ce538d806a25`
- **Background_11** 116x180 `147d4ec2d409474488585b9f05cb3fbc`
- **Background_12** 116x180 `1a19f76d917c4e2d8d5f555573679c13`
- **Background_13** 116x180 `1b89171b07d344c8bdfe0fe0e1cbf4d2`
- **Background_14** 116x180 `1bac25909c42469985571af1049b27c6`
- **Background_15** 116x180 `1cc2fbfe596444b2b2cc5f76c0b87d7b`
- **Background_16** 116x180 `216933b71ad24487bfb0879211c10eb7`
- **Background_17** 116x180 `244759524b4e4d28af77794d5fca8d4b`
- **Background_18** 116x180 `295cfa8cad56466595b3dfe483d30618`
- **Background_19** 116x180 `29d26168f2f04a2b8ef198702c58023b`
- **Background_20** 116x180 `31262d76bd584bd78e529f71552decaa`
- **Background_21** 116x180 `3ec7faeafe3540ef9413955e7b2d9880`
- **Background_22** 116x180 `41fd41c29e5f4f3d880f4dcc57ea2452`
- **Background_23** 116x180 `49d5cfa378174c768eb4a4a5df8fe3c2`
- **Background_24** 116x180 `501a83d77e5449f5acacfab3a5a4a161`
- **Background_25** 116x180 `5034e11cfce6474ca6ec5bfb78fa454c`
- **Background_26** 116x180 `50601dfe63ca486c93f824065f6b3ff1`
- **Background_27** 116x180 `5e9ad62d61ee4f2980af4e6ba6e822e6`
- **Background_28** 116x180 `6288be84e0434e3fa73472d0458beacb`
- **Background_29** 116x180 `67acb7a107cf430f8f4a7ad5942a26b6`
- **Background_30** 116x180 `6856fb399761483c8fca21b0494084f0`
- **Background_31** 116x180 `6aeec40d3d744ebc92e3b3c25c9d41ee`
- **Background_32** 116x180 `6ef29bc4b89245d7b68136689e3818e7`
- **Background_33** 116x180 `6f005f47bbb1456b8fae1be9b8ec642b`
- **Background_34** 116x180 `7177ce635b2245d6a90d7bf018c09c98`
- **Background_35** 116x180 `783e6dc39a4d489387d150efdd40a390`
- **Background_36** 116x180 `7ee40aa83f3f4bf0a696686cd25c5565`
- **Background_37** 116x180 `81283627f3dd4a7d9c572e1472992f9c`
- **Background_38** 116x180 `822247cdda9b4661ac3d11d6e0800dd1`
- **Background_39** 116x180 `8293f0a3c58146eb9b5583bb44c6ffa6`
- **Background_40** 116x180 `8318187c3c36425f94315b644e2e7790`
- **Background_41** 116x180 `8aadb9ba85424bd991d496dda0935b59`
- **Background_42** 116x180 `8b0d9fbbc3724bf3bf992c5ace40985e`
- **Background_43** 116x180 `9120bb57b446442ba9d7ccc030de17fe`
- **Background_44** 116x180 `96abbf5102274cd89b1ea4fc3678bfbc`
- …+30 more — grep `data/themes/cardgame.ruids.json`

## Minion (61)

- **Background_01** 100x100 `02abf67a0066410b925e7908fa353afb`
- **Background_02** 100x100 `0c677dbd9a884e2ba9db6f532fcb9169`
- **Background_03** 100x100 `0ed3dfdaee9942aca35d14eff8b89a63`
- **Background_04** 100x100 `102811eaa3854b13944f5e60e7a9a1ff`
- **Background_05** 100x100 `1704e9398ee44adf8df0e07b8bb9f048`
- **Background_06** 100x100 `1b6b56afc0534e31ab16240c8007584f`
- **Background_07** 100x100 `1cd3f1929c064b4c854dfe5c702008e5`
- **Background_08** 100x100 `1e4009fd944f47edb56aff977d1d2d4d`
- **Background_09** 100x100 `2d3413d459ce4f06ac430abbbc8f195a`
- **Background_10** 100x100 `32861da4a4c44a3f8ed91704151a0cd5`
- **Background_11** 100x100 `330a08a41ab24c369a85bf135acc03a7`
- **Background_12** 100x100 `3649a8ef37e44c7ba420da99b7e4a827`
- **Background_13** 100x100 `3a26d5efdc6b4582851ad3291e791d56`
- **Background_14** 100x100 `3d945d98ab9a40759c024fa5ef1d22dc`
- **Background_15** 100x100 `3fa52ce8cdb7402b9b1cb4d5b56ae75d`
- **Background_16** 100x100 `42ccab1f257e408a86e6d3204a55671e`
- **Background_17** 100x100 `45b8b8c341ac4ee4b1596dd34780cba3`
- **Background_18** 100x100 `57cd279bd45b44758d43ee5addb4f8b3`
- **Background_19** 100x100 `59ed4550eeb04a60bfc408f2c8197713`
- **Background_20** 100x100 `5ccf05c1568541b8b35648a0a0d0f23c`
- **Background_21** 100x100 `61b37ac6f5cf4099af1d734db3e6e3eb`
- **Background_22** 100x100 `6a4c428f6c8f4dc497f6d3fd1baa34db`
- **Background_23** 100x100 `6a6c8015cc7846dea4664358a971d908`
- **Background_24** 100x100 `6dad6605699e47a1bf63e0cfbc3f24f7`
- **Background_25** 100x100 `6e9ba2010de54c5d8b4757a4805f3ec1`
- **Background_26** 100x100 `6f179aecfccf44fcaeafc23a3b819d16`
- **Background_27** 100x100 `859d124216004c0f9196afc5a92f5fc0`
- **Background_28** 100x100 `8eb88400ff4444b2ad2196886514e488`
- **Background_29** 100x100 `8ecd41428b7143398db1bee8bb212d65`
- **Background_30** 100x100 `977b612d25a647d5a27620e9ecfc4e75`
- **Background_31** 100x100 `98870bc2ed70494fb830c549a803e3d5`
- **Background_32** 100x100 `98e90d3530ef4446a083473c67f663ff`
- **Background_33** 100x100 `998f8fd29f394d3e86de4e63cec6bf4e`
- **Background_34** 100x100 `9c181bbfd6794b048985973218ca5b26`
- **Background_35** 100x100 `a45823c486b942fb918c0fad8fb2c88d`
- **Background_36** 100x100 `a715c1c64f874671b655ebb9c11c00c1`
- **Background_37** 100x100 `a7365e5b06234659a8987ac84936f0df`
- **Background_38** 100x100 `aa0117d10977414b851f46fa57d98b4c`
- **Background_39** 100x100 `ab9d013c4ce847579d692b157d62cb1e`
- **Background_40** 100x100 `b085f8b747424e60b74223d5e0b21cda`
- **Background_41** 100x100 `b1aa86b5b116420aa4c86308ee18ef5d`
- **Background_42** 100x100 `b1c497b244254b668aa5493a25e99d07`
- **Background_43** 100x100 `b4f035de90654abcaf379ec258773881`
- **Background_44** 100x100 `bca81cfac45141f0aae092b7bbb55fce`
- **Background_45** 100x100 `c30e434ff66d40c4b220d41e5706cb69`
- …+16 more — grep `data/themes/cardgame.ruids.json`

## ETC (10)

- **Arrow** 115x65 `41c8eec251bf42e0b02f486b2aa3c637` (Sliced)
- **InteractionPanel** 229x188 `16b391d441ad46afae46305de48b354c` (Sliced) — text: #FFE12E@22+o#000000/50% x1 (NicknameText), #FFFFFF@19+o#000000/50% x1 (ProfileCodeText)
- **RankMeso** 282x57 `ffdc4b11ef384e2cb4996562d867dd80` (Sliced) — text: #FFFFFF@21 x3 (TitleText)
- **WarriorDeckImage** 130x160 `f6cadfd8acf24e47a0ee2695ed921f9a`
- **MagicianDeckImage** 130x160 `cea0bf4dd1d64d0aa1206eabe7738eff`
- **BowmanDeckImage** 130x160 `07c9a8ba02ea4d11bd0e8fc8e177e89d`
- **ThiefDeckImage** 130x160 `0b9293b1ccd8404989eb7fa3cd1ae4d2`
- **PirateDeckImage** 130x160 `3f5bf94887104278974a0037ee6f5b8a`
- **SelectedSign** 140x120 — text: Text #FFFFFF@21B
- **WarningSign** 140x120 — parts: Icon 121x119 `1c7eb7c971084bfca1c9a5009e0f4eeb` — text: Text #FFFFFF@21B

## Text colors (as used by the source world)

Reuse these instead of inventing font colors — they are the original designers' contrast choices on this theme's art. Per-part `text:` entries above show the exact pairing (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` outline, `+s#RRGGBB` halo).

- **`#FFFFFF`** — 111 uses (sizes 13–29; mostly on EventModule, Button, RewardModule)
- **`#29160E`** — 51 uses (sizes 2–30; mostly on GuideModule, RankingModule, ShopModule)
- **`#EEC78F`** — 24 uses (sizes 20–25; mostly on ShopModule, Button, EventModule)
- **`#4DFEE7`** — 12 uses (size 22; mostly on EventModule, Slot)
- **`#C3C3C3`** — 5 uses (size 19; mostly on CardModule)
- **`#BCBBBB`** — 5 uses (sizes 21–28; mostly on EventModule)
- **`#FACA33`** — 4 uses (sizes 21–26; mostly on SocialPanel, RewardModule, SocialModule)
- **`#FFFEFE`** — 2 uses (sizes 42–49; mostly on EventModule)

**Outline: 150 of 220 text nodes (68%).** Most used: `#000000/50%` x116, `#000000/70%` x18, `#000000` x14; typical `OutlineWidth` 0.4.

A `+o` pairing is not decoration: it is why that font color reads on that art — reuse the color and you reuse the outline, via the text node's `outline` / `outline_color` / `outline_width`.

## Sample screens (12)

Real production screens from the source world — structural references (layout, composition, which parts go together), not files to copy. Each screen's full entity tree is bundled at `data/samples/cardgame/<Screen>.txt` (indented: `Name WxH ruid (type) color:#RRGGBB text:#RRGGBB@size`). Read the one you need, then rebuild with the UIBuilder. **The digest is lossy: those five fields are all it records** (a `text:` value carries its `+o`/`+s` outline inline). Component makeup (is that `Viewport` a mask?), anchors, padding and z-order are simply absent from the format - so their absence from a digest is never evidence the source screen went without them. Where a screen's look depends on something you cannot see here, it is usually carried by an extra sprite child (a separate `Img_Shadow`, for instance) rather than a field.

`CardModule`(64), `EventModule`(173), `GuideModule`(89), `LobbyModule`(15), `PopupModule`(8), `RankedMatchModule`(20), `RankingModule`(27), `RewardModule`(49), `RoomChannelModule`(19), `ShopModule`(88), `SocialModule`(10), `SocialPanel`(18)

Long-tail lookup (all 376 RUIDs incl. every icon): grep `data/themes/cardgame.ruids.json` by part name keyword.
