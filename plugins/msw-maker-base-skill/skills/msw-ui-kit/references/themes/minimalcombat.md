# UI Theme — Minimal Combat (`ui-resource-minimalcombat-package`)

Harmonized UI RUID palette extracted from **Maple Auto Battler** (original MSW world), published as [`ui-resource-minimalcombat-package`](https://github.com/MSW-Git/MSWPackages/tree/main/ui-resource-minimalcombat-package).

Usage: pass any RUID below as `image_ruid` in UIBuilder node options — RUIDs resolve from MSW resource storage, no package install needed. Sizes are native part sizes from the source models; keep their aspect ratio when scaling. `(Sliced)` parts are 9-slice (`sprite_type: 1`) — resizable, but 9-slice keeps only the border clean (art painted inside stretches with the middle), so for a generic background pick the part whose native W:H is closest to your target rect; the marker is evidence-based (the art was used 9-sliced at least once in the source world, so its slice borders exist even where the source used it as Simple). Surface-type parts (window/panel/list/row bg) used at non-native sizes should get `sprite_type: 1` even when unmarked — borderless art renders identically to Simple, so it never hurts. `Tint_*` parts are monochrome glyphs meant to be recolored via the `color` option. A `color:` on a part line is the source world's recolor and is NOT optional decoration: several panel/row/unit bgs are neutral white masks (same RUID as `Tint_*` entries) that render as a flat white or near-invisible fill bare — always pass the listed `color` (or a theme-consistent one) via the builder. These RUIDs are flagged `"tint": true` in the data JSON. `text:` entries are the source world's font color/size pairings on that part (`#RRGGBB@size`, `B` = bold, `+o#RRGGBB` = outline, `+s#RRGGBB` = flat halo) — copy them whole for guaranteed contrast against the art; a color carrying `+o` is only readable with that outline.

## Slot (5)

- **MaterialBg** 100x100 `7fce719fd2594d9a9bb42a1686ee3c68`
- **ConsumableBg** 100x100 `6bbddc9d74134508b89cb4c5a7f6ee4d`
- **CompleteBg** 100x100 `4a13878585a7417f93d36fe54a558425`
- **SynergySymbolBg** 100x100 `775b9cb3b4f6419c823bd4d17e5625b2`
- **SynergyItemBg** 100x100 `c619a92f6fd4406f9206cb71aa52c888`

## NPC (150)

- **NPC_Roger** 90x100 `052ec110624f4d039489945226673f27`
- **NPC_Kaiji** 90x100 `04e92cc8730849e987bc89d173806eca`
- **NPC_Cassandra** 90x100 `0954f0cf35d1458391a506bfc6c6f166`
- **NPC_Vikin** 90x100 `21481868c8d24c23866e8166a6f46814`
- **NPC_PilotErvin** 90x100 `00396293d5fa43c68125067efe3ed7fe`
- **NPC_Kun** 90x100 `03d0a4c93fbb479b85fcb536b8d35883`
- **NPC_Rea** 90x100 `0161b0426fcd4ffd9982ef091d91540f`
- **NPC_Pio** 90x100 `97284423e1924c9ba735c17f8fc70616`
- **NPC_DonGiovanne** 90x100 `d0c9c8a6e8ca4438b4113caef8b42404`
- **NPC_Vicious** 90x100 `18902f8e64c842b091f7dc1ee9168796`
- **NPC_Lachesis** 90x100 `00a5cb6dcd9d4eae8078a8e366fe683d`
- **NPC_DragonHunter** 90x100 `2dc7b6a6893a4dd9b381eab0fc566ab3`
- **NPC_Marcel** 90x100 `06ab149a6d924da0b03ba8471400f7f6`
- **NPC_Hina** 90x100 `0a46fbfc439b49e5b55c22253ee59d8d`
- **NPC_Rain** 90x100 `1f27c476b32143f092dee70845a0b92a`
- **NPC_Sera** 90x100 `02ccabefd302405c87515dd47124ba9d`
- **NPC_Rina** 90x100 `09713a4038094b39ac9b0bb66763bf4f`
- **NPC_YoungLunnre** 90x100 `012b4c293f9c4bf483fbee61ae43f1c2`
- **NPC_Kidan** 90x100 `09ea1692338749bb93a67be897c4629a`
- **NPC_Kudi** 90x100 `089d45123b4c4fef81df85c3ba99df16`
- **NPC_Thunder** 90x100 `73f0eb2947124cb0874d413887c69247`
- **NPC_MongrongGrampa** 90x100 `c0a0445a368d48dc8163f6de444ce076`
- **NPC_Shumi** 90x100 `26816e4721944839868c46488ebfe1ec`
- **NPC_Mongddangtta** 90x100 `05d555ea1f8c4697ad6072f5a2049fbc`
- **NPC_Tomi** 90x100 `2db3610e23c84faa9d6aa24f325fa861`
- **NPC_Abdullah8** 90x100 `00d44c89c0b6497ba1e62300bc734b3b`
- **NPC_Somunnan** 90x100 `8a7e35ae04444238b2b25eaaba35e51c`
- **NPC_WanderingAlchemist** 90x100 `0aa4673b364948778e132a9418c47b3a`
- **NPC_Yuta** 90x100 `21698f6ed7924868a7825404bccc0428`
- **NPC_WangYeonhae** 90x100 `0213623b1c234401bf9d11d0c04f8416`
- **NPC_MountainSpirit** 90x100 `0906da9237bf4ffab7fbfc7477e3aaea`
- **NPC_Cheonji** 90x100 `7c08bd3b43d04c269384e74bcc44c401`
- **NPC_Shan** 90x100 `061c8aa33de8430ebcbb35eb303c99dd`
- **NPC_Sephie** 90x100 `0a3c4f6c3d494ef893c6dbec0266be7f`
- **NPC_DanceWithPig** 90x100 `26b0ce2b5eb945cb8144a5b211c9ea6b`
- **NPC_Murat** 90x100 `153c3d1ceba84a159d9a265d133291cb`
- **NPC_AgentM** 90x100 `065d6468984b47699d76d17fcfb338dc`
- **NPC_AgentW** 90x100 `00d94f4577b4459db8ebef4c873d1a13`
- **NPC_Krishurama** 90x100 `26571e26a43f4cae83d05eaa4991df95`
- **NPC_Sabitrama** 90x100 `9a24246c38f8466594a93bd287a44b6a`
- **NPC_Nogong** 90x100 `03168f19c030473f9f3158ffd5933658`
- **NPC_TempleKeeper** 90x100 `099dcc9fe28d4988844d41b17affbc79`
- **NPC_Alcaster** 90x100 `9875f5df19b34eaaa322aca3f741b77e`
- **NPC_Chloe** 90x100 `01e59ccc10db4408b08f1a9a23b04060`
- **NPC_Kaho** 90x100 `1100da05b13645e3af6d6a088f363e87`
- …+105 more — grep `data/themes/minimalcombat.ruids.json`

## RankMode (58)

- **Single_1** 128x128 `7d73e80d50de48c4bcab413c66a66277`
- **Single_2** 128x128 `19fc85dd2f2d4c7188bc6b90c2bd7bf8`
- **Single_3** 128x128 `63c31166fe50432d97da5c23e45b3397`
- **Single_4** 128x128 `7a81ae5986894a20a66e5390f1a8b312`
- **Single_5** 128x128 `41231e2410054158a96cfa78972a4fe7`
- **Single_6** 128x128 `caffd56fe5fe48aca1be40b09b57f762`
- **Single_7** 128x128 `20c80f0387b1458abc30acb75bbad300`
- **Single_8** 128x128 `a80eaa74f69845619c5b630ee1203871`
- **Single_1** 80x80 `39d166064d7945929c3800cd00423c72`
- **Single_2** 80x80 `481eaab89a164cd2be1aae829a6927d7`
- **Single_3** 80x80 `b7e2a289ecb047f4be57f18e888f817d`
- **Single_4** 80x80 `7995aa74e72845d4b45c7c9dd33b65bc`
- **Single_5** 80x80 `4a6a1d43f31c4ec09018b64bb98ef811`
- **Single_6** 80x80 `95c008158aa04ffc856b74936bd0e920`
- **Single_7** 80x80 `f4d8970c346740f2b590217223311acc`
- **Single_8** 80x80 `9015f44715d04ec582576c47070057e6`
- **Rank_Iron** 128x128 `908a0bc79bd44d669a209a71005b9fc3`
- **Rank_Bronze_1** 128x128 `388ebc04c2ff4f2eaec200ecf0fd46a3`
- **Rank_Bronze_2** 128x128 `188610a95ba346fcb9314674a95fd914`
- **Rank_Bronze_3** 128x128 `ba306fd75c924ad89bf563995a498039`
- **Rank_Silver_1** 128x128 `4883e3b483494627b3a870f6832fa769`
- **Rank_Silver_2** 128x128 `dfec15ac629e4c1b86dd796df8c49774`
- **Rank_Silver_3** 128x128 `96c7691373984a138d5425d5a4c469e3`
- **Rank_Gold_1** 128x128 `f8dec74713434792aba21bb5e3efdccb`
- **Rank_Gold_2** 128x128 `9aedc57d33b64dbf8c356dc1ce537f68`
- **Rank_Gold_3** 128x128 `2917c7e9dddc4179961dcc92643c5ead`
- **Rank_Platinum_1** 128x128 `4e53deb7bb8048a08eb353c120a342c6`
- **Rank_Platinum_2** 128x128 `4a295d55ce9a47c4b3a4113d941a1f47`
- **Rank_Platinum_3** 128x128 `4fa690ec2bca4d0787508a54a755ca7d`
- **Rank_Diamond_1** 128x128 `eae1626a19a046bc9a11b3a8f9f03678`
- **Rank_Diamond_2** 128x128 `264100dabb1a4b3ebaafae3518e07c0a`
- **Rank_Diamond_3** 128x128 `bbe1e6fa1a524a4c92150ffeff546d7b`
- **Rank_Master_1** 128x128 `c5a708220a10441da486c998472097d4`
- **Rank_Master_2** 128x128 `938664f857f34f08a74c937a5af9d408`
- **Rank_Master_3** 128x128 `391d50cd36da4bc0b5fa4187f0cfc74f`
- **Rank_Challenger** 128x128 `86846969c16d4fb8b7b450ba532bb28b`
- **Rank_Legend** 128x128 `2a7ad715344c4c4aa22ecdc7dfd3c8ab`
- **Rank_Iron** 80x80 `ea216e4763e14908aa4f115fdf356a43`
- **Rank_Bronze_1** 80x80 `5d82d481408246eaab4fb99728cef653`
- **Rank_Bronze_2** 80x80 `e4ce09471d51478984cce4177dc9c836`
- **Rank_Bronze_3** 80x80 `a9d9e58215bd4e5988840c828aa40380`
- **Rank_Silver_1** 80x80 `dc911541c7d049c68864663889a7f2f5`
- **Rank_Silver_2** 80x80 `e72918e57e7944f98d711290f4b0a84c`
- **Rank_Silver_3** 80x80 `2ab5b7d9d0024a98af033b4ec6896403`
- **Rank_Gold_1** 80x80 `022fe3336c974ea2a4e2f006cb48fce3`
- …+13 more — grep `data/themes/minimalcombat.ruids.json`

## Tint (43)

- **Mascot** 80x80 `52a92954026b441b8fd61afac12e0440`
- **Guardian** 80x80 `47cf9bba06c740b587f9f02e24262f37`
- **Vanguard** 80x80 `bd8b548c7d4f4b97a89596d80f9f0fe4`
- **Mage** 80x80 `c946cf2994084762a74592ba0d6d9272`
- **Strategist** 80x80 `4a95515bf5384a4cbc55c60b5fd19d2b`
- **Hunter** 80x80 `ad97acb3e9e64c6383f049fc40b0455c`
- **Pursuer** 80x80 `e9fb7f86abe640c9a4e9ab116657d084`
- **Brawler** 80x80 `b48765da501547e6bad911f573691bce`
- **Sniper** 80x80 `272fafb29e67409ab2e143b2bd301906`
- **Disruptor** 80x80 `d904892571144689a127696590e607dd`
- **TempleOfTime** 80x80 `a4e356abeb6e44219d019aaec5b0cd16`
- **ElNath** 80x80 `9f069b75ff544317be68c7eedb004144`
- **VictoriaIsland** 80x80 `5a15f7a25b834d3abc825e81ab20c22e`
- **SleepyWood** 80x80 `c6b02a5bb88448b38e446d50d5906da5`
- **Ludibrium** 80x80 `03833fe422ab46a5b15755fb7402051a`
- **Orbis** 80x80 `0cd46b5631a74a1090856dee6dd2c179`
- **Cygnus** 80x80 `feb4f029702843a6ab2862538fed408b`
- **Adventurer** 80x80 `6d6dbf3ec820492ca1b424abaa68aa0e`
- **KnightCommander** 80x80 `f9c8d41643f64345b135356a2609a916`
- **Shadow** 80x80 `f67416eb3edf4427be9912227c2ac8d9`
- **Balrog** 80x80 `22d9fc3c2824457a8509a06adbfe5707`
- **NobleSoul** 80x80 `bb81411d129649b0a539d64e956f6e63`
- **ClockTowerOrigin** 80x80 `5cbb0b2c427b4584bedb137adf735355`
- **ArcaneRiver** 80x80 `7e57d7c5117e42fbae91ab7b15981cd8`
- **DemonTree** 80x80 `9dfcf709b7f940279d7e18166813f006`
- **NightmareLord** 80x80 `9fb458e0cc014b6587f5382e9ef63023`
- **Empress** 80x80 `86c276715b8547119c6a23a17452e742`
- **YetiAndPepe** 80x80 `dc987ae03c17427293e7de27d6d612e0`
- **LegendaryArcher** 80x80 `9bd2067a4d3340fdb4ed33281531dcd2`
- **JobInstructor** 80x80 `1f025646b4c84584adef9226d6a1918b`
- **Tank** 100x100 `71ed340be22f45f8809e3f5634b544bc`
- **Support** 100x100 `421e0e02bcc148e79437f562c0425fad`
- **Melee** 100x100 `07cb828da903446fbad9c61359f56aa9`
- **Range** 100x100 `af00c0f7a9614007862a76d1613bb347`
- **EscMenu** 100x100 `d7f20b88464444d586d61dd2e010de5f`
- **Refresh** 100x100 `4e6ecc7a1e4445fb92db1d2220f697d3`
- **Dictionary** 100x100 `91d88e79647642fd8a7b85ad70c92145`
- **SkipEnd** 100x100 `64471b9b2c404434b94fcfe99faf71c3`
- **Next** 100x100 `ca00dbe382a046639b6b5b09ba83790e`
- **ChallengeMode** 100x100 `1aaf0690cd2f46c0a04cc0bdacb0faa0`
- **Snapshot** 100x100 `abf6898e3d34471aa1e4f53c6628b011`
- **Statistics** 100x100 `e259d4557e9641e7814f701452bb634f`
- **Reset** 100x100 `6a5d1e81d51640948d10f44968bafe96`

## Icon (83)

- **Item_0** 80x80 `thumbnail://444f1da6365d4599a27bbfd207585856`
- **Item_1** 80x80 `thumbnail://3ffe515570ad435caa397ca0f2e2f83b`
- **Item_2** 80x80 `thumbnail://7d4cc6871503458bb8de7576c7047ef3`
- **Item_3** 80x80 `thumbnail://fa9ad14cb01e460b80e143dadfce3364`
- **Item_4** 80x80 `thumbnail://2bb5fd1f15984d6b8ae81e9dd7a5cba9`
- **Item_5** 80x80 `thumbnail://c33def64db8b48f39b7b125fab1092e1`
- **Item_6** 80x80 `thumbnail://2e58683f2f094f099a0813c36e278dd5`
- **Item_7** 80x80 `thumbnail://568d83943c74456680788e184819b1ab`
- **Item_8** 80x80 `thumbnail://b7884d08a2e546b9b6994248a7069b76`
- **Item_9** 80x80 `thumbnail://22f978b94d72488692b7dd2889c7d2e0`
- **Item_10** 80x80 `thumbnail://7228761e2bff44658ff49294345365da`
- **Item_11** 80x80 `thumbnail://9f3a7c2e67c546e9b35816a10ca67823`
- **Item_12** 80x80 `thumbnail://c7968102cc074308869642757340d928`
- **Item_13** 80x80 `thumbnail://33971a452aef4894a802e70110437c47`
- **Item_14** 80x80 `thumbnail://08171bf93fac4ad4a914409d44865283`
- **Item_15** 80x80 `thumbnail://a9a329f2760e469bbbc4e87dcba14e20`
- **Item_16** 80x80 `thumbnail://13812e94424b4f5da77beb6d60bea108`
- **Item_17** 80x80 `thumbnail://cac1c0e955b541ca9e7c766a9a4b57c5`
- **Item_18** 80x80 `thumbnail://20466263d9b845509f1f2cc9dd898357`
- **Item_19** 80x80 `thumbnail://ed83963681d448f08ecad5d78292d08e`
- **Item_20** 80x80 `thumbnail://eac268b5e37d4f3399cea164d1810023`
- **Item_21** 80x80 `thumbnail://c805ef092a4540ccbc8010fab4bc7d23`
- **Item_22** 80x80 `thumbnail://24c8cc2941a047fa9c3e9797c1f7dc82`
- **Item_23** 80x80 `thumbnail://0ba40d2cb18e4f10996ffef8d7f6b58b`
- **Item_24** 80x80 `thumbnail://cf9c4cf00867437a972e6bdfd6727274`
- **Item_25** 80x80 `thumbnail://e9b775b98f2b4dcb98897b32d0746e68`
- **Item_26** 80x80 `thumbnail://03ba11c060cf420b94593e0da2d7aef1`
- **Item_27** 80x80 `thumbnail://1a4bb6c262674eea8d6f57ad7bca04d6`
- **Item_28** 80x80 `thumbnail://3981fe513b8a43e1a1f0b58807aa7792`
- **Item_29** 80x80 `thumbnail://81c8cb83df334a599bc6ef68b63a894b`
- **Item_30** 80x80 `thumbnail://da6f85e824e74a9da16e4766bfb17228`
- **Item_31** 80x80 `thumbnail://2193c7293fb244d4a4b1d91e7a6004d9`
- **Item_32** 80x80 `thumbnail://daf62e96c7d842deb49c4af92a7a3a2f`
- **Item_33** 80x80 `thumbnail://df4eda9614314971bf31a4d643b468f9`
- **Item_34** 80x80 `thumbnail://66f0427e33a04e7dbfa280ec19541452`
- **Item_35** 80x80 `thumbnail://3c47c4b9711448f0b0a14b03ed076118`
- **Item_36** 80x80 `thumbnail://39fb76eb3831486395bba411dea379eb`
- **Item_37** 80x80 `thumbnail://4cc43431cf914b98ae761aba2535e840`
- **Item_38** 80x80 `thumbnail://56b026a6768b4f1cab7f0b50b39f4b7f`
- **Item_39** 80x80 `thumbnail://029a0890fa9e4884ad28a7c66da3be78`
- **Item_40** 80x80 `thumbnail://01e390ebbe744c8cab3e336b71466c9a`
- **Item_41** 80x80 `thumbnail://5ca691d611de4e1b8373a2bbb500926d`
- **Item_42** 80x80 `thumbnail://a8766bd395974c13a586ebc05b3b1735`
- **Item_43** 80x80 `thumbnail://dc101f7119e04fbda189cdf674ca5efc`
- **Item_44** 80x80 `e9258b5f42aa433484f44c67be2b8adf`
- …+38 more — grep `data/themes/minimalcombat.ruids.json`

Long-tail lookup (all 339 RUIDs incl. every icon): grep `data/themes/minimalcombat.ruids.json` by part name keyword.
