# POC 技術架構與選型（提案，尚未實作）

> 歷史設計／交付紀錄：保留原時點的範圍、提案與驗證，不例行追加，不作每輪前置檢查；當前入口見 [文件索引](README.md)、[待查收](WORK_ITEMS.md)。舊「待審／未實作」及完成測試數不代表現在狀態，亦不取代本輪驗證。


整理日期：2026-10-25。以 [已核定方向](DECISIONS.md) C-66／C-67、[POC 設計書](POC_DESIGN_PACKAGE.md) 為準。React + Vite、Mantine、可攜權威資料／SQLite 索引及 Windows x64 已獲使用者同意；具體檔案 schema、Electron 版本與性能仍需驗證。現有程式只用來定位遷移工作，不作為目標模型範式；現況見 [ARCHITECTURE.md](ARCHITECTURE.md)。開發前集中審查見 [審查包](POC_PREDEV_REVIEW.md)。

## 一、選型

| 項目 | POC 方向 | 狀態與理由 |
| --- | --- | --- |
| 桌面外殼 | Electron，先支援 Windows x64；保留 main／preload／renderer 三層；實作遷移時以受支援的 Electron 44 作建議基線 | **Windows x64 已核定，版本是建議**。目前 `package.json` 為 42，官方在 45 發布時宣布 42 停止支援；44 較 45 多一些穩定使用時間。[Electron 45 發布](https://www.electronjs.org/blog/electron-45-0) |
| 畫面建置 | React + TypeScript + Vite；以現有 electron-vite 同時建 main、preload、renderer，移除 Next 畫面執行路徑 | **已核定方向，整合方式為建議**。現有 `electron.vite.config.ts` 只建 main／preload，`electron/main.ts` 依賴固定 Next URL；應先打通 Vite 開發與正式載入，避免後面每個畫面再遷一次。[electron-vite 官方設定](https://electron-vite.org/config/) |
| UI | 保留 Mantine 做表單、對話框與通知；CELL 畫布及卡片樣式由專案控制 | **已核定**。遷移時統一 Mantine 套件主版本；視覺風格仍未定。 |
| 編輯器 | 先沿用 `react-grid-layout` 作拖放／縮放引擎，版面資料採自己的版本化格式 | **建議採用**。引擎可換，專案模板不與套件內部資料結構綁死。格線與碰撞數值依 O-83 原型確認。 |
| 前端狀態 | React 狀態 + 現有 Zustand 保存畫面會話、選取與編輯草稿；保存後以 main 回傳版本更新列表 | **建議採用**。Zustand 不是資料權威，避免同一值另存在前端與檔案而不同步。 |
| 可攜資料 | 每個受管資料夾持有自己的隱藏記錄及圖片原檔；專案根持有以 project ID 分開的版面與設定 | **已核定責任，實體 schema 待審核**。資料夾值預設共用，私有覆寫顯式建立。 |
| 本機查詢 | SQLite 僅作可重建索引；建議在 POC 基本閉環通過後、完整 key/value 搜尋前作獨立里程碑 | **資料責任已核定，時機依審查包 R-10 待審核**。POC 名稱／路徑搜尋先從可攜掃描資料得到；SQLite 不保存唯一真相，也不隨資料夾搬移。 |
| SQLite 驅動 | `IndexRepository` 後面優先試 Electron 內建 Node 的 `node:sqlite`，僅在能力／效能或打包不符時改用單一原生套件 | **建議採用，仍需技術驗證**。Electron 44 帶 Node 24，官方將 `node:sqlite` 標為 release candidate；此選擇可先避免原生套件的 Electron 重編譯，但須確認目標 Electron 實際提供 SQLite 與必要索引能力。[Electron 44](https://www.electronjs.org/blog/electron-44-0)、[Node SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)、[Electron 原生模組](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) |
| 套件管理 | 建議統一 pnpm，實作時只保留一份鎖檔 | **建議採用**。現有 `pnpm-lock.yaml` 的 Mantine 8 依賴與 `package.json` 相符；`package-lock.json` 仍是舊 `game-viewer`／Mantine 7。這是本機檔案證據；本輪不安裝或刪鎖檔。 |

## 二、責任邊界與資料流

```text
React 畫面（專案／清單／單筆／CELL 編輯器／問題與清理）
    │ 只使用明確定義的 typed API；草稿與顯示狀態
preload（小範圍、具型別的 IPC）
    │ 驗證來源、參數與可執行動作
Electron main
    ├─ ProjectService：專案定義、深度、版面與重新連結
    ├─ ScanService：走訪、排除資料目錄、增量發現、掃描狀態
    ├─ FolderRecordRepository：ID、屬性、圖片參照、修訂與保存
    ├─ QueryService／IndexRepository：分頁、排序、搜尋及重建
    ├─ AssetService：可攜圖片複製、相對參照、讀取
    └─ Cleanup／RecoveryService：歸屬驗證、預覽、清理、失敗重試
    │
    ├─ 資料夾內的可攜檔及原圖：權威資料
    └─ 本機 SQLite／最近路徑／縮圖：可重建輔助資料
```

以上服務名稱是**建議的責任切分**，不要求各自成為 class 或獨立套件。POC 以清晰的模組界線為主，避免為早期原型引入額外框架。`shared` 保存 IPC 請求／結果、版本化可攜格式與畫面模板的型別定義。主程序是唯一寫入入口；前端不能送任意檔案路徑、SQL 或作業系統命令。開啟資料夾按鈕只提交已掃描到的 folder ID，由 main 找出目前路徑。Electron 官方建議按方法暴露 IPC，並驗證訊息來源。[Electron context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)、[Electron security](https://www.electronjs.org/docs/latest/tutorial/security/)

既有 `electron/main.ts` 的 `media` protocol 會從 URL 參數取檔案路徑；目標設計應改由 main 根據受管 folder ID 與 asset ID 解析可攜相對路徑，確認仍在所屬資產目錄後才讀取。renderer sandbox 應在遷移時恢復並驗證 preload 相容；現有 `sandbox: false` 不作目標設定。這是架構與安全邊界決定，並非宣稱現有實作已修正。[Electron security](https://www.electronjs.org/docs/latest/tutorial/security/)

## 三、最小資料契約

| 實體 | 權威內容 | 不放入權威內容 |
| --- | --- | --- |
| FolderRecord | `kind`、`schemaVersion`、`folderId`、`revision`、穩定 attribute ID 與有型別值、來源、顯式 project override、可攜 asset 相對參照 | 舊設備絕對路徑、專案媒體分類、僅供顯示的空值 |
| ProjectDefinition | `projectId`、根 folder ID、分類、深度規則、欄位別名／attribute ID 對應、CELL 模板、每列與每頁設定 | 各資料夾實際值 |
| ScanOccurrence | `projectId`、`folderId`、目前實際路徑、相對路徑、層級、問題狀態 | 不作跨設備身分；可從掃描重建 |
| CellTemplate item | cell ID、組件種類、系統欄位或 attribute ID 綁定、格線位置／尺寸、基本樣式、受控 action ID | 個別資料夾的值；格線套件的私有欄位 |

`key`／顯示別名不是資料身分；不同專案即使同名也可指向不同 attribute ID。掃描根是第 1 層：「顯示 1–N」與「只顯示 N」共用走訪範圍，但後者只篩選第 N 層進畫面；祖先仍可建立記錄。掃描不跟隨 junction／符號連結，不列出本程式資料目錄；單筆失敗保留其他結果及原因。新加入的資料夾在視窗重新聚焦或手動重掃後發現。這些行為以 [POC 驗收](POC_DESIGN_PACKAGE.md) 為準。

## 四、身分、搬移與 O-80 清理規則

1. **帶著有效記錄搬移**：folder ID 跟著資料夾走；新專案讀共用值，依自己的模板顯示。無對應欄位顯示空白／視覺預設，不寫入假值。相同 ID 同時出現在兩處則暫停寫入，交由使用者判斷搬移或副本。
2. **單筆徹底清除後停留原位**：刪除經歸屬驗證的記錄與資產；建議在目前所有涵蓋此位置、清理後仍保留的專案設定以相對路徑保留「在此位置停止記錄」意圖，讓原位置重掃不立刻重建。若清理項本身是專案根，先退出其專案。這不是放在該資料夾內的殘留標記。更新所有必要的排除項失敗時，先不刪該資料夾記錄。
3. **清除後搬到其他專案底下**：沒有可攜記錄即可按新資料夾處理，分配**新的 folder ID**、空白自訂值與目的專案的預設顯示；不繼承被清除的 ID、原值或版面，不顯示「身分不明待確認」。新位置不沿用舊位置的停止記錄規則。此為使用者最新核定的 O-80 行為。
4. **排除意圖生命週期**：建議以專案根的相對路徑記錄，成功掃描確認原位置已不存在時才讓排除過期；根離線、掃描失敗時不過期。重新啟用可由使用者立即清除排除。隨整個專案根搬設備時，排除意圖也隨專案設定移動；只搬已清空的子資料夾時沒有標記，按新資料夾處理。新建立、過去未涵蓋該位置的專案亦可將無記錄資料夾視為新。此為待審核的具體機制。
5. **全部清理**：先列出已連結可及範圍、未連結或離線範圍及本機資料；逐項驗證歸屬並報告成功／失敗。完成後退出相應管理範圍，避免再次自動建立。不得刪除原始媒體。

## 五、保存、搜尋與遷移順序

- **保存**：先驗證 `schemaVersion`、歸屬、型別與 `revision`；可攜檔保存成功後才回傳新版本讓列表與詳情立即更新。索引失敗只標為待重建。暫存、上一版與 Windows 替換失敗復原需依 O-77 的受控樣本實測，不能先宣稱原子性。
- **搜尋**：POC 只對當前專案的名稱與目前路徑做任意子字串搜尋，穩定排序後分頁。SQLite 索引導入後再做完整 key/value 語法、無 key 查詢、保存搜尋。FTS5 trigram 可協助三字以上子字串；一至二字仍可能回退掃描，須用固定中文短詞樣本量測，不承諾所有查詢都靠同一索引。[SQLite FTS5](https://www.sqlite.org/fts5.html)
- **索引執行位置**：`node:sqlite` 的基本資料庫 API 為同步操作；若批次重建或短詞查詢造成主程序卡頓，把索引任務移到 worker thread，仍由 main 管理生命週期與 IPC。先以固定資料量測，不為尚未觀察到的效能問題預先加入第二個資料庫方案。[Node SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)
- **順序**：① 固定契約與受控測試樹；② 將 renderer 遷到 electron-vite／React，讓現有基本畫面可開；③ 實作可攜記錄、掃描、深度、專案與 O-80 身分規則；④ 完成單筆值、CELL 編輯、清單即時更新與清理／復原，驗收 POC 閉環；⑤ 在 POC 後的獨立里程碑加入可重建 SQLite 索引並按樣本量測，然後擴展完整搜尋；⑥ 舊本機 JSON 先備份、顯示映射預覽，再進行明確、可重試的匯入（既有資料實際匯入前須先完成此步，不能因排序較後就丟失舊資料）。遷移期間不可靜默覆寫舊資料。

## 六、進入實作前需交付的樣本

| 工作 | 最小可審核產物 |
| --- | --- |
| O-76／O-82／O-86 | 單資料夾、同根雙專案、巢狀專案的檔案樹與 JSON 實例；圖片複製、引用與清理例；舊 JSON 轉換前後一例。 |
| O-77／O-80 | 保存中斷、修訂衝突、重複 ID、同位置停止記錄、搬到新專案成新 ID、重疊專案與暫時離線的操作／狀態表。 |
| O-78／O-83 | 固定 1,000／10,000 筆的掃描與查詢樣本；兩個視窗寬度、長字串與真實資料的 CELL 原型。 |
| 技術驗證 | Electron 44／Windows x64 相容、electron-vite 開發／打包載入、sandboxed preload、圖片 protocol 邊界、pnpm 單一鎖檔；SQLite 導入前驗證內建 `node:sqlite` 與 FTS5 是否可用。 |

後續視覺稿只需依 [低保真線框](POC_WIREFRAMES.md) 與上列資料／互動邊界製作；不需先決定 MVP 的網站來源、更多型別或閱讀／播放 UI。本文沒有修改程式碼，也不表示任何驗收已通過。
