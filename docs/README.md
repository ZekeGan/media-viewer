# 任務與文件索引

固定入口只有根目錄 [AGENTS.md](../AGENTS.md) 與 [WORK_ITEMS.md](WORK_ITEMS.md)。接到任務後按下表選讀，不要求全部載入。先讀相關 diff；已讀且未變的內容不要重讀。

| 任務 | 主要文件 | 程式定位入口 |
| --- | --- | --- |
| 接續工作／查收 | [WORK_ITEMS](WORK_ITEMS.md) | 只查列出的入口與未完成項 |
| 找模組、IPC、資料流 | [ARCHITECTURE](ARCHITECTURE.md) | main → preload → renderer；shared 契約 |
| 執行／驗證／交付 | [IMPLEMENTATION](IMPLEMENTATION.md) | package scripts、對應測試 |
| 產品範圍／不變條件 | [PRODUCT](PRODUCT.md) | 實際能力仍由程式碼確認 |
| 外框、群組、建立、CARD／TABLE／TREE、左右區 | [WORKSPACE_REVISION](WORKSPACE_REVISION.md) | DesktopShell、BrowseWorkspace、TreeView |
| 共用互動／定位畫面 | [UI_RULES](UI_RULES.md)、[畫面索引](UI_SCREEN_CATALOG.md) | 只讀涉及區域 |
| 資料身分、屬性值、跨專案 | [FOLDER_PROJECT_MODEL](FOLDER_PROJECT_MODEL.md) | shared/model、electron/library |
| 寫入、損壞、搬移、清理、遷移 | [STORAGE_OPTIONS](STORAGE_OPTIONS.md) | electron/files、library；必驗失敗路徑 |
| CELL／模板 | [EDITOR_DESIGN](EDITOR_DESIGN.md)、[CELL_CATALOG](CELL_CATALOG.md) | Editor、Card、shared/layouts |
| 搜尋 | [SEARCH_DESIGN](SEARCH_DESIGN.md) | shared/query、electron/search-index、SearchDialog |
| 相簿／漫畫 | [ALBUM](ALBUM_VIEWER_DESIGN.md)、[MANGA](MANGA_VIEWER_DESIGN.md) | Gallery、Reader、FolderContent |
| 遊戲／引擎邊界 | [GAME](GAME_VIEWER_DESIGN.md)、[偵測](GAME_ENGINE_DETECTION.md) | FolderContent、explorer、game-detection |
| 影片／字幕 | [VIDEO](VIDEO_VIEWER_DESIGN.md) | VideoViewer、explorer、shared/subtitles |
| 外部資料來源 | [METADATA_ENRICHMENT](METADATA_ENRICHMENT.md) | electron/metadata、explorer |
| 尚待決定／後續缺口 | [OPEN_DECISIONS](OPEN_DECISIONS.md) | 不自動納入本輪範圍 |

## 維護分工

- **穩定規則**只在 AGENTS；**模組與責任**只在 ARCHITECTURE；**命令與驗證策略**只在 IMPLEMENTATION。
- **功能規格**由上表專項文件持有；PRODUCT 只維護範圍與連結，不再複製每個手勢。改行為只更新直接主文件；確有新產品取捨才在 [DECISIONS](DECISIONS.md) 加短記錄。
- **未完成工作**只在 WORK_ITEMS；**待決策／延後方向**只在 OPEN_DECISIONS。完成後移除日常交接細節，必要證據引用已有紀錄，不把完成清單永久堆在入口。
- **版本與依賴**查 package.json；實際驗證以本輪輸出為準。版本任務才更新既有 CHANGELOG，不要求每輪另建交付報告或重寫多份摘要。

## 歷史與探索（按需追溯）

[DECISIONS](DECISIONS.md) 用決策 ID 搜尋理由；[DEV_LOG](DEV_LOG.md) 已封存。POC_*、STAGE1、STAGES_2_3、RELEASE_0_5_0 是各自時點的設計／證據，不是當前待辦或每輪前置 Context。[整理前快照](history/agent-docs-before-cleanup.md) 保留被整併的原文，不再追加；舊相容入口只導向主文件。

[視覺探索](design/README.md) 與 [風格比較](DESIGN_STYLE_OPTIONS.md) 都未定案。產品依據為最新使用者指示及現行專項規格；歷史提案、R／T／UI-R 細節不因封存而變成已批准需求。
