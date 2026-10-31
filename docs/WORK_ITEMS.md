# 當前工作與交接

只記差距、待查收與下一步；核定規則由主文件持有，按 [任務索引](README.md#按任務定位) 選讀。列入清單不等於授權開發；歷史驗證不當成本輪結果。

## 授權狀態（2026-10-31）

- **已授權至 S13**：S12 → S9＋S11（含佇列入口移到頂部工具列）→ S10＋S13，自動內部分批，只驗受影響範圍。**2026-10-31 已實作，待使用者查收與 Git 審批**（見下「待查收」）。
- **已核定**：S9 未入列單曲獨立試播，不改既有佇列、不默默接到首項；S11 混合佇列圖片模式維持佇列內容／順序，只改呈現。
- **未授權**：S15～S17、R-I18N 執行；Git 提交／推送待使用者審批。

## 待實作

### 最新回饋

0.9.0 內容見 [CHANGELOG](../CHANGELOG.md#090--2026-10-30)；S1～S8 已交付。主規格：[跨專案影音佇列](WORKSPACE_REVISION.md#跨專案影音佇列與迷你播放器)、[資料夾詳情](WORKSPACE_REVISION.md#資料夾詳情)、[右側共用邊界](WORKSPACE_REVISION.md#右側組件共用邊界)。

| 編號（S9～S13 已實作） | 目標 | 入口 | 驗收 |
| --- | --- | --- | --- |
| S12 修正 | 迷你播放器貼近頂部拖曳會移動原生視窗；重現並檢查 Topbar drag region 與播放器命中區，不靠提高圖層遮蓋 | Playback、DesktopShell／Topbar 樣式、Electron 視窗設定 | 拖曳只改播放器位置、視窗 bounds 不變、控制可點擊 |
| S9 | 移除列表／卡片與「目前資料夾」TAB 常駐＋，改右鍵／多選加入；單擊只播放，不再默默追加；未入列單曲獨立試播 | Gallery、MediaBrowser、Playback | 各入口一致、多選依列表排序、跨專案與重複追加、鍵盤選單、單擊不改佇列、播放生命週期；拖入佇列為後續擴充 |
| S11 | 依兩張截圖重作雙 TAB、列表與播放狀態視覺層級；與 S9 合併；佇列入口改移到頂部工具列，不再遮擋返回頂部，並移除重複的「播放已加入的音樂」入口；全域混合佇列保留影片清單／圖片切換 | Playback、media-workspace.css、頂部工具列 | 三主題、長檔名／同名來源、窄窗、鍵盤焦點、拖排／移除、播放狀態不重設 |
| S10 | 依已核定設計精簡右側資訊為預設收合的折疊區，取代重複完整卡片；整合位置／自訂資料與設定入口；只改展示，不變更儲存或 CELL 定義 | MediaBrowser、內容樣式、資料 TAB 開啟流程 | 預設收合、長路徑／窄窗、複製與開啟路徑、0／false、自訂欄位與私有覆寫、鍵盤、三主題 |
| S13 | 與 S10 同批，只抽出 FolderContent／MediaBrowser 實際重複的詳情、子資料夾列表與狀態呈現；保留漫畫圖庫／獨立 CELL、遊戲封面／操作／欄位 TABLE、媒體瀏覽控制 | BrowseWorkspace、FolderContent、MediaBrowser、Gallery | 三類專用操作、來源／邊界、切換及失敗、三主題與窄窗 |
| S15 待授權 | 遊戲更換封面新增圖片網址來源，下載後存為可攜資產；沿用預覽與確認，失敗／取消保留原封面。主規格 [圖片網址匯入](GAME_VIEWER_DESIGN.md#圖片網址匯入) | FolderContent、FolderPanel 圖片來源、main／Explorer 既有下載流程 | 受控下載、保存／取消／復原、離線重開、遊戲邊界；不新增下載依賴 |
| S16 待授權 | 日本同人來源研究，順序：既有 VNDB／Bangumi／AniList 適用範圍 → DLsite → FANZA → BOOTH／Melonbooks／虎之穴。依 [來源候選](METADATA_ENRICHMENT.md#後續候選) | shared/sources.ts、electron/metadata.ts、metadata-public.ts | 精確網址、來源／版本識別、預覽與人工值保護、封面安全、失敗不改原資料 |
| S17 待授權 | 積木編輯器遊戲模式新增封面圖片組件，與一般圖片組件區分。依 [組件規格](CELL_CATALOG.md#遊戲封面圖片組件) | Editor、Card、shared/model.ts | 模式限制、缺圖、編輯預覽、保存重開、舊方案相容 |

S14 已移除，不重新列入。

### S16 研究結論：FANZA

- 官方 DMM Affiliate API（ItemList 等）存在，但須註冊取得 API ID 與 affiliate ID，屬憑證型來源，不能「直接」取得；官方頁面有年齡閘門，資格、頻率與可用範圍須由使用者登入後核對（本輪未取得條款）。
- 與現行「免憑證」限制衝突，故不納入預設。可行方向：使用者自行輸入自己的 API ID，僅存本機、不匯出（比照設定包不含憑證）。
- 替代來源（皆待逐站確認條款）：**DLsite**（無官方 API，有未文件化的 `/product/info/ajax?product_id=`，欄位含標題／社團／價格，條款風險須查）、**VNDB／Bangumi／AniList**（已接入，先評估對收藏覆蓋率）、**BOOTH／Melonbooks／虎之穴**（無公開 API，只做精確網址的單頁讀取）。建議順序：先評估既有來源覆蓋 → DLsite 精確網址 → 使用者自備 DMM 憑證選項。

### 發行前必要關卡

- **R-I18N（必做，待執行）**：使用者已手改部分介面文字但未同步 i18n；發行前依 [文案契約](UI_RULES.md#文案與語系一致性) 與 [執行關卡](IMPLEMENTATION.md#發行前文案與語系關卡) 補齊，保留最新文字。現行 appearance 語系測試因手改的「這不是遊戲目錄」缺字典項目失敗，不能宣稱全語系通過。

### 待研議（未核定，不開發）

- Gallery 選取摘要與列表下方重複顯示「檔名 · MIME · 大小」；卡片改友善類型／右鍵資訊。
- Reader extraTools 的資料夾文字不平行（定位容器高度、行高、繼承的 small padding）。

## 待查收與限制

- **S12／S9／S11／S10／S13 已實作（未提交）**：S12 成因為迷你播放器未宣告 -webkit-app-region: no-drag，位於 Topbar 的 drag region 上時由作業系統接管拖曳；已加 no-drag。Playwright 無法產生 OS 層視窗拖曳，只驗計算樣式與視窗 bounds，**實體滑鼠拖曳仍待使用者查收**。S9：單擊不再追加，右鍵／Ctrl／Shift 點擊多選／Shift＋方向鍵加入，新增 QueueMenu；未入列單曲試播。S11：入口移至頂部工具列、佇列清單／圖片兩種呈現。S10／S13：FolderParts 的 FolderDetails（預設收合）與 SubfolderList，漫畫維持 Card 資訊 CELL。三主題與窄窗尚未逐一截圖查收。通過：tsc、build、audio-playback-ui（連跑 3 次通過，批次中曾有 1 次未重現的失敗）、pending-ui、folder-navigation-ui。
- **既有測試失效（非本次造成，未修）**：media-scope-ui（舊「更多檔案選項」縮圖選單）、media-ui（開影片專案找 .video-stage）、media-workspace-ui 約第 95 行起（影片已改走全域播放，舊 .media-queue 斷言）；appearance 語系測試仍因「這不是遊戲目錄」失敗；Windows 唯讀 ACL 測試失敗屬環境，未調查。
- 「前往此資料夾」圖示已交付（共用 open／visit／歷史路徑），導覽 UI 證據 .test-output/folder-navigation-oolKsP/；新按鈕沿用既有五語系文案。
- MP3 StrictMode 音源清理已修正，聲卡輸出仍待查收；側鍵實體滑鼠／驅動及其他平台待查收。
- CARD 即時保存、TABLE 欄位、遊戲操作、Ghost、單檔圖片／漫畫、PDF 共用外框及隱藏檔已有受控交付，依具體回饋接續，不全面重做。
- 真實網站／登入、遊戲／媒體變體、跨設備硬故障需樣本與環境；遊戲未知變體保留人工 ROOT／not-game，不重掃或清理真實收藏。Mac 原生啟動未交付。
- 完全移除須影響預覽、樹外備份、未知資料保留與失敗復原；復原包在 userData/maintenance-backups，見 [儲存安全](STORAGE_OPTIONS.md)。workspace:update 小數尺寸路徑已修，原操作未取得，不宣稱所有成因排除。

## 後續設計

- CELL 容器／群組：尺寸、選取、進出編輯及巢狀限制待定，見 [CELL](CELL_CATALOG.md#後續計畫與保留候選)。
- 影片片段切圖：見 [影片](VIDEO_VIEWER_DESIGN.md#未來影片片段預覽)。
- Mac 原生遊戲、plist 主目標、更多解碼器、富文字／公式／腳本、雲端同步依 [OPEN_DECISIONS](OPEN_DECISIONS.md) 排程，不自動併入。

## 交接

只更新下一步需要的差距、入口、驗證及阻礙。0.9.0 前完整舊交接：`git show 4ae0424:docs/WORK_ITEMS.md`；歷史驗證與封存文件見 [archive](archive/)、[整理前快照](history/agent-docs-before-cleanup.md#work-items)。

<a id="統一媒體工作區執行順序"></a>
<a id="歷史驗證入口"></a>
