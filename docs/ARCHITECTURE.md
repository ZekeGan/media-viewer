# 現況架構與定位

依目前程式整理；版本與依賴查 package.json。此頁只持有模組責任，功能規格由 [任務索引](README.md) 導向。舊 Next.js／View／Cell／DataType／JsonStorage 原型不是目標資料模型。

## 資料流與邊界

`src/main.tsx → App → DesktopShell / BrowseWorkspace → window.media / explorer / desktop → preload → main → Library / Explorer / WorkspaceStore`

Renderer 負責畫面、草稿與互動；preload 只暴露受控 API；main 驗證請求與呼叫來源、執行檔案及系統操作。保留 contextIsolation、sandbox、停用 nodeIntegration；不能讓 renderer 任意讀路徑、執行命令或繞過 main 的身分／邊界檢查。

## 按問題找入口

| 範圍 | 主要檔案／符號 | 責任 |
| --- | --- | --- |
| 啟動／IPC／協定／系統操作 | [main](../electron/main.ts)、[preload](../electron/preload.ts) | BrowserWindow、來源驗證、原生對話框、受控媒體串流 |
| 專案與可攜記錄 | [library](../electron/library.ts) `Library` | create/link/scan/visit/saveValues、身分、副本、復原、清理與舊資料匯入 |
| 原子檔案／路徑 | [files](../electron/files.ts)、[hidden](../electron/hidden.ts) | safePath/within、atomicJson、記錄備份／指紋、Windows 隱藏目錄 |
| 媒體／縮圖／字幕／遊戲動作 | [explorer](../electron/explorer.ts) `Explorer` | content/stream/thumbnail、attributes、目標綁定與執行、外部資料套用 |
| 遊戲辨識 | [game-detection](../electron/game-detection.ts) | 有限探測、證據與 ROOT 邊界 |
| 搜尋索引 | [search-index](../electron/search-index.ts) `SearchIndex` | Node SQLite、Unicode 子字串 grams、分頁；可重建，非資料來源 |
| 本機 UI 設定 | [workspace](../electron/workspace.ts) `WorkspaceStore` | 群組／排序／窗格／偏好，驗證、保存、尺寸正規化 |
| 外部來源 | [metadata](../electron/metadata.ts) | E-Hentai URL 驗證與公開資料預覽 |
| 契約與驗證 | [model](../shared/model.ts)、[explorer](../shared/explorer.ts)、[workspace](../shared/workspace.ts) | 型別及 runtime 驗證；修改 IPC 時兩端一起查 |
| 共用純邏輯 | [browse](../shared/browse.ts)、[layouts](../shared/layouts.ts)、[images](../shared/images.ts)、[query](../shared/query.ts)、[subtitles](../shared/subtitles.ts) | 模式範圍、方案、格式、查詢、字幕解析 |
| 應用狀態／外框 | [App](../src/App.tsx)、[DesktopShell](../src/DesktopShell.tsx) | snapshot／草稿／保存、側欄、搜尋入口與視窗控制 |
| 瀏覽與設定 | [BrowseWorkspace](../src/BrowseWorkspace.tsx)、[TreeView](../src/TreeView.tsx)、[FolderPanel](../src/FolderPanel.tsx) | 三模式、歷史、獨立右區、設定 Drawer；TREE 用 React Flow＋Dagre |
| CELL／內容 | [Card](../src/Card.tsx)、[Editor](../src/Editor.tsx)、[FolderContent](../src/FolderContent.tsx) | 共用編輯引擎、分開版面、各屬性內容 |
| 媒體／搜尋／通知 | [Gallery](../src/Gallery.tsx)、[Reader](../src/Reader.tsx)、[VideoViewer](../src/VideoViewer.tsx)、[SearchDialog](../src/SearchDialog.tsx)、[Toasts](../src/Toasts.tsx) | 相簿／閱讀器、Video.js、查詢 UI、右下通知 |

先 `rg -n "符號" 相關目錄`，再讀函式及呼叫端；不為定位一個問題全讀以上檔案。

## 儲存位置

| 位置 | 用途／權威 |
| --- | --- |
| 各受管資料夾 `.media-viewer/folder.json` | 具版本／穩定 ID 的可攜記錄、屬性、覆寫及資產參照 |
| ROOT 的 `.media-viewer/projects/<projectId>.json` | 可攜專案定義、欄位／版面與掃描邊界 |
| `.media-viewer/` 內受管資產／字幕 | 以相對參照復原；不依賴舊絕對路徑 |
| Electron userData 的 `poc-projects.json`、`workspace-ui.json` | 本機連結登錄與 UI 偏好 |
| userData 的 `search.sqlite`、`thumbnails/` | 可重建索引／快取；不得當可攜原值 |

實體欄位以 shared 契約及讀寫程式為準，避免另寫一份易失同步的 schema。值的語意見 [資料模型](FOLDER_PROJECT_MODEL.md)，損壞／清理／遷移見 [儲存安全](STORAGE_OPTIONS.md)。來源資料變更後更新 snapshot／畫面及索引，不要求重開應用。
