# 遊戲引擎辨識規畫

> 本頁持有辨識證據／邊界策略，不承擔畫面或工作進度。導覽能否進入依 [現行工作區](WORKSPACE_REVISION.md)，內容／動作見 [遊戲](GAME_VIEWER_DESIGN.md)；未採用候選不能自行升為已實作。


日期：2026-10-26。來源：C-80 使用者要求納入 Unity、RPG Maker、Unreal、Godot 及其他常見引擎，其他採推薦。**以下是設計覆蓋清單，不等於所有引擎版本均已支援；現有有限探測實作查 electron/game-detection.ts，真實版本樣本仍待驗收。** Windows 優先；不因此加入其他平台測試承諾。

## 目的與邊界

辨識目的是協助找到「應停止遞迴的遊戲 ROOT」，不是讀取／轉換遊戲資源。引擎身分、是否為遊戲、是否為收藏集合根是不同判斷；引擎製作的工具、編輯器、模組也可能命中特徵。

使用一套小型規則登錄表與共用唯讀探測器，不為每個引擎安裝 SDK 或拆包套件。規則記錄穩定 ID、版本、有限探測路徑、必要／輔助線索與排除條件，回傳候選 ROOT、引擎候選及依據。確切 schema、探測筆數／位元組／深度上限在實作前定義。

- 先讀名稱清單，必要時只讀規則指定的小型文字標記；不執行 EXE／JS／腳本，不解包、解密、遞迴掃完整遊戲，也不修改原始檔案。
- 已確認 ROOT 直接停止；結構線索完整可列高可信候選，弱線索／衝突需人工修正。分數或強特徵不宣稱百分之百正確。
- 所有候選須在寫入子層前處理。未解決候選保留為暫停／未掃描，不讓例外、權限錯誤或取消變成「無遊戲、可繼續寫入」。
- 找不到引擎仍可手動設為 ROOT；未知或自製引擎不阻擋遊戲檢視及使用者指定 EXE。
- `.exe`、`Data`、`.pak`、`package.json`、NW.js／Electron 執行環境等單一線索不足以判定遊戲，也不能直接把上層集合目錄當 ROOT。

## 覆蓋清單與研究狀態

「依據已查」僅表示官方文件／原始碼支持列出的結構線索；實際 Windows 發行版、誤判與 ROOT 定位仍需受控樣本驗證。「待樣本」同樣列入設計範圍，現階段以人工指定兜底，不能寫成已能自動辨識。

| 引擎家族 | 候選規則方向／限制 | 研究狀態與依據 |
| --- | --- | --- |
| Unity | EXE、`UnityPlayer.dll`、對應 `*_Data` 組合；版本／改名變體另驗證，非遊戲工具也能命中。 | 依據已查：[Windows 建置](https://docs.unity3d.com/6000.0/Documentation/Manual/WindowsStandaloneBinaries.html)。 |
| Unreal Engine | 執行檔與部署內容結構組合，`.pak` 只是輔助；不同世代及容器需分規則，不能僅看到副檔名就判定。 | 依據已查：[封裝說明](https://dev.epicgames.com/documentation/en-us/unreal-engine/packaging-your-project)；UE3／4／5 變體待樣本。 |
| Godot | EXE＋PCK 候選；支援內嵌 PCK，單檔版可能無外部特徵，先人工指定，不能用缺 PCK 排除遊戲。 | 依據已查：[Windows 匯出](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_windows.html)。 |
| RPG Maker | 2000／2003、XP／VX／VX Ace、MV／MZ、UNITE 分家族規則；MV 核心腳本與資料結構可作組合線索。UNITE 與 Unity 規則可能重疊，不強行猜版本。 | MV／MZ 依據已查：[MV 核心原始碼](https://github.com/rpgtkoolmv/corescript)、[MZ 部署](https://rpgmakerofficial.com/product/MZ_help-en/01_11_03.html)。其他版本及封裝變體待樣本，不以編輯器專案檔作發行版必要條件。 |
| Ren’Py | 啟動程式與 `game/` 內 `.rpy`／`.rpyc`／`.rpa` 等結構組合；不要求原始腳本存在。 | 依據已查：[檔案與目錄](https://www.renpy.org/doc/html/language_basics.html)、[發行封裝](https://www.renpy.org/doc/html/build.html)。 |
| 吉里吉里／KiriKiri／KiriKiri Z | 執行檔與 XP3 等線索組合，副檔名不唯一，內嵌／自訂包裝需人工指定；不解包。 | XP3 依據已查：[引擎原始碼](https://github.com/krkrz/krkrz/blob/master/base/XP3Archive.cpp)；發行版組合待樣本。 |
| TyranoScript／TyranoBuilder | `tyrano/`、`data/`、入口結構的組合；桌面包裝、內嵌資產及 Builder 變體待驗證，不把通用網頁程式都當遊戲。 | 原始結構依據已查：[TyranoScript 原始碼](https://github.com/ShikemokuMK/tyranoscript)；Windows 發行版待樣本。 |
| WOLF RPG Editor | Game 執行檔與資料結構組合；資料可改名或封裝，單獨 `Game.exe`／`Data` 不成立。 | 依據已查：[檔案說明](https://silversecond.com/WolfRPGEditor/Help/01filelist.html)、[啟動設定](https://silversecond.com/WolfRPGEditor/Help/01control.html)；版本變體待樣本。 |
| GameMaker | VM／YYC 等輸出需分開處理；不假設所有發行版都有同一個資料檔。 | 輸出差異依據已查：[官方編譯文件](https://manual.gamemaker.io/monthly/en/Introduction/Compiling.htm)；具體檔案規則待樣本。 |
| Cocos Creator／Cocos2d-x | 原生與網頁包裝分開；不拿開發專案目錄當作所有遊戲的部署特徵。 | Creator Windows 發行方向已查：[官方部署文件](https://docs.cocos.com/creator/3.8/manual/en/editor/publish/windows/index.html)；Creator／2d-x 規則待樣本。 |
| Construct 2／3 | 舊 NW.js 與較新桌面匯出分開；不依賴 NW.js 作必要條件。 | 匯出差異依據已查：[官方淘汰功能說明](https://www.construct.net/en/make-games/manuals/construct-3/tips-and-guides/deprecated-features)；結構規則待樣本。 |
| Defold | 執行檔與 `game.arcd` 等部署結構組合；不解析資源封包。 | 依據已查：[官方封裝文件](https://defold.com/manuals/bundling/)；Windows 變體待樣本。 |
| LÖVE | `.love` 與執行環境，或合併 EXE 與配套 DLL；內嵌版本不可要求外部 `.love`。 | 依據已查：[官方發行說明](https://love2d.org/wiki/Game_Distribution)；單一 DLL 仍非充分條件。 |
| Source／Source 2、CRYENGINE | 列入擴充清單；商店啟動器、模組與共用引擎安裝可能使內容根不等於遊戲根。 | 待官方結構研究與樣本；先提供人工 ROOT，不宣稱自動辨識。 |
| Adventure Game Studio、MonoGame／FNA／XNA、自製引擎 | 列入擴充清單；同一框架可製作一般應用，無通用可靠目錄規則。 | 待研究與樣本；先提供人工 ROOT，後續按真實收藏補規則。 |

## 驗收與演進

1. 先用受控假目錄驗證四個指定引擎家族及可確認的其他家族；每條自動規則都要有命中、誤判、缺標記、改名／多 EXE、收藏根包含多款遊戲的案例，再宣告對應版本支援。
2. 同一引擎的編輯器／工具、只有普通 `Data`／EXE 的目錄、網頁程式、模組及共享執行環境不能直接被當成已確認遊戲；顯示依據並可修正。
3. 在 ROOT 寫入前完成邊界判定；ROOT 只使用自己的可攜目錄，遊戲內部原始檔及目錄逐項比對不變，內部無新記錄。受控案例需涵蓋精確深度、唯讀繼續、取消、重掃、權限錯誤與 junction。
4. 未知／單檔／封裝變體能手動停止；誤判能恢復正常掃描。舊內部記錄需既有清理預覽，不因偵測器升版自動移除。
5. 後續按家族新增資料規則與樣本，沿用同一掃描流程；不為提高涵蓋率新增背景執行或遊戲資源拆解。大量候選探測成本另量測，不能宣稱零成本。

本輪僅查閱官方技術資料並整理設計。未安裝引擎／套件、未掃描真實遊戲、未執行遊戲或測試。啟動動作與參數設計見 [遊戲內容頁](GAME_VIEWER_DESIGN.md)。
