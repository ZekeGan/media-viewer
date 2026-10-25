# POC 開發前審查包

> 實作階段更新：使用者已授權開始 POC（C-68）。本頁保留設計／審查歷史；現行契約與實際驗證狀態見 [IMPLEMENTATION.md](IMPLEMENTATION.md)，不以歷史待審文字阻擋已授權工作。

整理日期：2026-10-25。**狀態：供使用者一次審核；不是已實作或已通過驗收。** 已確認 React + Vite、保留 Mantine、每資料夾可攜權威資料、本機 SQLite 可重建索引及 Windows x64（C-67）；單筆徹底清除後搬到其他專案視為新資料夾（C-66）。本頁把剩餘 POC 決策具體化。未寫入本頁的 MVP 來源網站、閱讀器、播放器、其他資料型別與視覺風格，不作開發前的阻擋項。

審核方式：下表每項可回覆「採用建議」或直接寫出要改的 ID 與內容。**「建議」目前不等於使用者已核定。** 技術相容、寫入中斷及效能只能在之後的受控實作中驗證，本頁列出預期結果與驗證門檻，不假稱測試已完成。

## 1. 已確認的 POC 邊界

| 已確認 | POC 要能觀察到 |
| --- | --- |
| 資料夾是檢視對象 | 選根、依深度分析、平面清單、真實名稱／路徑、開啟資料夾；不管理或搬動原始媒體。 |
| 每專案一份 CELL 模板 | 預設可用；左側拖入名稱、路徑、自訂文字、開啟按鈕，移動／縮放／設定基本顏色，切換兩筆真實資料預覽，保存即時套用。 |
| 個別內容可攜 | 每資料夾保存共用文字值及圖片原檔；搬入另一專案後讀原值，由目的專案決定顯示。 |
| 專案可攜且可重疊 | 專案根保存自己的媒體分類、深度、欄位映射與版面；同根／巢狀專案互不覆蓋。 |
| 清理與復原 | 個別與全部清理先預覽、只刪本程式資料；損壞、衝突、唯讀、離線、重複 ID 有狀態與下一步。 |
| 分頁與搜尋 | 預設每列 2 筆、每頁 100 筆；名稱／路徑子字串搜尋。完整 key/value 語法在 POC 後。 |

對應 [POC 設計書 A-01 至 A-14](POC_DESIGN_PACKAGE.md) 與[八個畫面線框](POC_WIREFRAMES.md)。線框規範操作閉環，不固定最終美術風格。

## 2. 請審核的行為與建議

| ID | 需要定案的問題 | 建議規則與原因 |
| --- | --- | --- |
| R-01 | 初次掃描何時在資料夾寫隱藏記錄？ | **建立專案並掃描時，對根及走訪到的每一層建立記錄，包括「只顯示第 N 層」未顯示的祖先**；進度列出已走訪、已寫入與失敗數。這使日後搬移祖先仍能帶走自身資料。唯讀項可暫時顯示名稱／路徑，標示「未可攜」，不偷偷改存本機。 |
| R-02 | 欄位同名、型別不同時怎麼讀？ | 資料夾值以穩定 `attributeId` 與 `type` 辨識；專案內的 `key`／查詢別名只負責映射。搬入目的專案時，只有綁到同一 ID 的 CELL 直接顯示；其餘原值可在詳情查看，缺值空白。不得因 `name` 拼字相同而合併異型別。 |
| R-03 | 已清理項在原位置、新位置及新設備如何處理？ | 依 C-66：原位置停用；**在目前所有涵蓋它且仍保留的專案設定記相對路徑排除**，隨專案根可攜。若它自身是專案根，按 R-04 先退出該專案。成功掃描確認原位置消失後才刪排除；根離線／無權限時保留。移到任何新位置但未帶記錄，即當新資料夾，給新 ID 與空值，包括搬入另一專案；新建立、清理時尚未涵蓋該位置的專案也可視它為新。這讓徹底清理的子資料夾內不留標記。 |
| R-04 | 清理選項與專案根的特殊情況？ | 單筆提供「只清此專案私有覆寫」及「清此資料夾全部本程式資料」；預設後者清完停止原位置記錄，另提供「清後立即重新開始」。若要清理**仍是專案根**的全部資料，先預覽並同步退出該根上的相關專案；不留下仍連結但缺專案檔的假正常狀態。一鍵清理只涵蓋已連結、可存取範圍，列出未涵蓋與失敗項，絕不刪原始媒體。 |
| R-05 | 圖片如何保存及刪除？ | 透過程式選圖時**複製原檔**到該資料夾隱藏資產區，記相對路徑、asset ID、檔名與格式；不以網站 URL 作唯一來源。編輯圖片引用只清可驗證且不再被引用的本程式副本，不碰資料夾原有圖片。縮圖只放可重建快取。POC 驗證保存、搬移及清理原圖；圖片 CELL 留到 MVP 選。 |
| R-06 | 搬移、複製與內容類型錯位？ | 有有效記錄的 folder ID 跟著走；同一 ID 同時出現兩處時都暫停寫入，讓使用者選「搬移重連」或「此筆是副本、另配 ID 並保留值」。專案分類只定義顯示；只有資料夾明確類型或可信來源才提示不符，仍可看原值。 |
| R-07 | 不能寫入或資料損壞時畫面顯示什麼？ | 已掃到的項目留在清單並標示「唯讀／未可攜／損壞／衝突／索引待重建」；詳情可讀的原值仍可看，提供針對狀態的重試或備份復原。保存失敗保留草稿但不顯示已保存；其他資料夾繼續運作。 |
| R-08 | 舊本機 JSON 怎麼處理？ | **不在啟動時自動改寫**。若找到舊資料，先完整備份、列出可對應的專案／欄位／資料夾及無法辨識項，使用者確認後才匯入可攜格式；中途失敗可重試且不覆寫已存在的新值。系統名稱與路徑重新掃描，不把舊絕對路徑當 ID。 |
| R-09 | 搜尋與數量的 POC 門檻？ | POC 對當前專案的真實名稱、目前路徑做任意子字串搜尋，先排序再分頁；用超過 100 筆驗證翻頁，1,000 筆分別記首次掃描與暖機搜尋，10,000 筆作壓力觀察。索引導入後以 1,000 筆暖機搜尋 200ms 作工程目標；未量測不宣稱達標。完整語法與中文 1–2 字效能另按固定樣本驗證。 |
| R-10 | SQLite 是否是 POC 通過的前置條件？ | **不是。** POC 先從可攜檔取得名稱／目前路徑與必要資料，完成清單和基本搜尋；SQLite 作為 POC 後、完整 key/value 搜尋前的獨立索引里程碑。1,000 筆／200ms 是索引階段的工程目標，POC 先保存基線數據。這避免資料契約尚未穩定時同時除錯兩份資料。 |

### O-80 例子（R-03）

| 事件 | P1 的結果 | P2 的結果 |
| --- | --- | --- |
| `P1/A` 有記錄，搬到 `P2/A` | 舊位置消失；依 ID 更新目前路徑 | 讀同一 folder ID 與原值；套 P2 版面 |
| 先徹底清理 `P1/A`，原位重掃 | 排除命中，不重建 | 若 P2 已重疊涵蓋同位置，亦不重建 |
| 再搬已清理的 `A` 到 `P2/A` | 成功掃描確認原位置消失後，排除過期 | 無可攜記錄，給新 ID、空白值、P2 預設版面 |
| P1 暫時離線 | 不因掃描失敗刪排除 | 不憑舊絕對路徑推斷是否同一資料夾 |
| 整個 P1 根複製到新設備，`A` 未搬走 | P1 設定內的相對路徑排除仍有效 | 不依賴舊設備 SQLite |

## 3. 請審核的技術預設

| ID | 建議 | 邊界與驗證 |
| --- | --- | --- |
| T-01 | 遷移時選 Electron 44、Windows x64、現有 electron-vite 整合 React renderer；保留 Mantine、Zustand、`react-grid-layout`。 | 先讓開發／正式入口、IPC、sandboxed preload 與基本畫面能載入；不在遷移步驟改寫任何使用者資料。UI 套件與編輯器引擎只有遇具體問題才替換。[Electron 版本依據](https://www.electronjs.org/blog/electron-45-0) |
| T-02 | 以 pnpm 作唯一套件管理器；正式開始實作時重新產生一致鎖檔、移除過時 npm 鎖檔。 | 目前 npm 鎖檔仍是舊 `game-viewer`／Mantine 7，pnpm 鎖檔較符合現有套件設定；本輪不動依賴或鎖檔。 |
| T-03 | SQLite 驅動先驗證目標 Electron 的 `node:sqlite`，索引介面與驅動分開；不符需求才選一個原生驅動。 | 檢查打包後可用性、FTS5、重建與短詞查詢；原生驅動可能增加 Electron 重編譯工作。SQLite 壞了可從可攜檔重建。[Node SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)、[Electron 原生模組](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules) |
| T-04 | Renderer 不碰檔案系統；preload 只暴露明確 typed IPC；main 用 folder ID／asset ID 解析目前路徑與圖片。 | 遷移時替換現有從 `media` URL 直接取路徑的方式，驗證檔案讀取仍在受管資產範圍內。Electron 建議保留 context isolation／sandbox 並驗證 IPC 來源。[Electron security](https://www.electronjs.org/docs/latest/tutorial/security/) |

T-01 至 T-04 是**建議選型**，不是要求使用者判斷各套件內部實作。若採用，技術相容性在相關實作里程碑檢驗；若驗證失敗，先回報差異與替代方案，維持已確認的產品行為。SQLite 的驅動驗證依 R-10 排在索引里程碑。

## 4. 可攜檔案格式樣本（R-01、R-02、R-05）

以下是**審核用格式 v1**，不是現有程式輸出。名稱採 `.media-viewer/`；Windows 設 Hidden 屬性，程式列表與掃描排除。若撞到同名但無合法 `kind`／版本的目錄，停止該筆寫入與清理並報告，不接管。有效記錄若損壞或格式過新，保留原檔，不以空白新檔取代。

```text
P1/
  .media-viewer/
    folder.json                    # P1 自身的記錄
    projects/<projectId-P1>.json   # 專案設定與相對路徑排除
  A/
    .media-viewer/
      folder.json                  # A 的 ID 與值
      assets/<assetId>.png         # 程式複製的原圖
  B/C/.media-viewer/folder.json
P2/.media-viewer/folder.json
P2/.media-viewer/projects/<projectId-P2>.json
```

`A/.media-viewer/folder.json` 示意：

```json
{
  "kind": "media-viewer.folder",
  "schemaVersion": 1,
  "folderId": "folder-a-uuid",
  "revision": 3,
  "attributes": [
    { "attributeId": "attr-title-uuid", "key": "TITLE", "type": "string", "value": "作品 A", "source": "manual" }
  ],
  "projectOverrides": {},
  "assets": [
    { "assetId": "asset-cover-uuid", "relativePath": "assets/asset-cover-uuid.png", "originalName": "cover.png", "mediaType": "image/png" }
  ]
}
```

`P1/.media-viewer/projects/<projectId-P1>.json` 示意：

```json
{
  "kind": "media-viewer.project",
  "schemaVersion": 1,
  "projectId": "project-p1-uuid",
  "rootFolderId": "folder-p1-uuid",
  "revision": 2,
  "name": "漫畫專案",
  "mediaCategory": "manga",
  "depth": { "mode": "through", "level": 2 },
  "fieldBindings": [
    { "alias": "title", "attributeId": "attr-title-uuid", "type": "string" }
  ],
  "cells": [
    { "cellId": "cell-title-uuid", "kind": "field-text", "attributeId": "attr-title-uuid", "grid": { "x": 0, "y": 0, "w": 12, "h": 1 }, "style": { "textColor": "#111111", "backgroundColor": "#ffffff" } }
  ],
  "list": { "itemsPerRow": 2, "pageSize": 100 },
  "excludedRelativePaths": []
}
```

系統名稱／目前路徑由掃描取得；`folderId` 不靠路徑重算。原圖相對引用只指向自身資產區；可重建縮圖與 SQLite 不寫入這些權威檔。專案版面屬於專案設定，不複製進 A。`revision` 用於拒絕外部更新後的舊草稿覆寫。上例 ID 是說明用文字，正式使用穩定隨機 ID。排除例：清理 `P1/A` 後，P1 的 `excludedRelativePaths` 包含 `"A"`；同時涵蓋 A 的既有專案也各記自己根下的相對路徑。

## 5. 保存、失敗與匯入契約（R-06 至 R-08）

| 情況 | 建議處理與可觀察結果 |
| --- | --- |
| 正常保存 | Main 讀目前版本、驗證格式與 `revision`，先寫同目錄暫存，保留上一個有效版本，再替換；**可攜檔成功後**才回傳新值讓清單立即更新。Windows 實際替換／中斷語義需受控實測。 |
| 替換前中斷 | 舊有效檔仍可讀；識別並處理本程式暫存檔，不能把半寫檔當正式記錄。 |
| 替換後、SQLite 更新前中斷 | 新可攜檔是權威；重新掃描或啟動時標索引落後並重建，畫面不回退到舊 SQLite 值。 |
| 外部修改造成修訂不符 | 停止覆寫；保留磁碟版本及尚未保存的草稿，顯示差異與重新套用入口，不自動最後寫入者勝出。 |
| 同名但非本程式資料目錄、損壞、格式過新 | 不覆寫、不刪；顯示原因與路徑，可讀時保留可讀內容，允許先備份或修復後重試。 |
| 清理某步失敗 | 逐項列成功／失敗／未涵蓋；只重試失敗項。重疊專案排除設定未全數保存前，不開始刪該筆可攜記錄。 |
| 根離線或權限不足 | 保留已知專案與先前排除意圖，標「待重新連結／未涵蓋」，不推斷資料已移走或已清理。 |

舊資料對照樣本（舊程式位置見 已封存的 JsonStorage.ts 與 shared/main.ts（封存位置見 IMPLEMENTATION.md））：

| 舊資料 | 匯入建議 | 不能自動判定時 |
| --- | --- | --- |
| `View.id`、`targetFolderPath`、`config.dataSearchDepth` | 使用者先確認可存取的新根；建立新 project ID 與明確 `through`／`exact` 深度。 | 舊模式不足以推定時要求選模式，不猜。 |
| `Folder.id`、`lastReadPath`、`cells` | 只有確認實際資料夾位置後才建立可攜 folder ID；欄位值轉為有型別 attribute。 | 找不到資料夾時列未匯入，保留舊檔；不依同名推定。 |
| `Column.id`、`key`、`dataType` | 以**舊 column ID**建立一對一的新 attribute ID 映射；同 key 但不同 ID／型別不合併。 | Cell 只剩 key、無法可靠對應 column 時列為需人工確認。 |
| `Layout.layoutItems` | 可辨識組件轉成版本化 CELL 模板；系統名稱／目前路徑改用即時掃描來源。 | 未支援組件列出並保留舊檔，不以空版面冒充已完整遷移。 |

上述是**匯入規則提案**，不是已驗證的舊檔轉換器；開發時先以一組實際舊檔備份和轉換前後樣本證明可行。未曾存有需要保留的舊資料時，仍不得靜默刪除舊 JSON。

最小轉換前後例：舊 `column/TITLE.json` 有 `{"id":"old-column-title","key":"TITLE","dataType":"STRING"}`；舊 `folder/old-folder-a.json` 的 `cells` 含 `{"key":"TITLE","value":"作品 A","folderId":"old-folder-a"}`。使用者確認該舊資料對應到目前的 `P1/A` 後，匯入報告保存 `old-column-title → attr-title-uuid`、`old-folder-a → folder-a-uuid` 的映射；新 `A/.media-viewer/folder.json` 形成上例 `attributeId=attr-title-uuid`、`value=作品 A`，P1 專案版面也引用 `attr-title-uuid`。若 `TITLE` 在另一筆舊資料只剩 key、找不到可確認的 column ID，就列為待人工對應，不憑同字串自動合併。

## 6. CELL 數值與效能樣本（R-09、R-10）

| 項目 | 建議初值／樣本 | 完成判定 |
| --- | --- | --- |
| 卡片畫布 | 12 欄邏輯格線，預設卡片含名稱、路徑、自訂文字與開啟按鈕；名稱／路徑可佔整列。 | 在約 1280px 與 800px 視窗，以 A 有值、B 無值及長中文名稱／長路徑預覽，不重疊；長文字可截短，但能查看完整值。具體行高、最小寬度依此原型調整。 |
| 編輯歷程 | 建議至少保留本次編輯最近 50 個動作，保存後清空歷程。 | 拖入、移動、縮放、綁定與顏色能復原／重做；取消不改已保存模板。 |
| 列表 | 每列預設 2、每頁 100；視窗窄時自動減少實際列數但保留設定值。 | 以 126 筆確認兩頁不重複不漏；排序同名時以穩定 folder ID 決定順序。 |
| 搜尋／掃描 | 1,000 筆含 1–5 層、中英文與同名；另有 10,000 筆壓力樣本。查詢集含中文 1、2、3 字、英文內部片段、長路徑。 | 記錄 Windows x64、CPU、磁碟、樣本生成方式；首次掃描與暖機查詢分開，各重複 5 次，報中位數與最慢值。1,000 筆暖機搜尋 200ms 是索引階段目標；POC 初版未導入索引時先報基線。 |

## 7. 可以延後，不阻擋 POC 開工

- 完整 key/value 搜尋語法、忘記 key 的跨屬性搜尋、保存搜尋、批次編輯。
- NUMBER、DATETIME、標籤、圖片 CELL 等首批 MVP 型別的優先順序。
- 遊戲／漫畫網站資料匯入，漫畫／相簿閱讀器、影片／音樂播放器。
- 樹狀與蜂巢視圖、最終 UX/UI 色彩與視覺稿、macOS／Windows 32 位元。
- SQLite 具體資料表與索引細節可在可攜資料契約穩定後、索引工作開始前定稿；**SQLite 可重建的責任不可延後或改成唯一真相**。

## 8. 本次審核完成的判準

1. 使用者對 R-01 至 R-10、T-01 至 T-04 可逐項修正，或明確表示全部採用；C-66／C-67 不需再重答。
2. 實作前基線以本頁的格式樣本、O-80 表、失敗／匯入表、CELL／效能樣本及 [A-01 至 A-14](POC_DESIGN_PACKAGE.md) 為準。實際技術驗證失敗時記錄差異，不能默默改產品規則。
3. 使用者已指示這輪**只交審查、不寫程式碼**；待使用者回覆完成審核後，再依[路線圖](ROADMAP.md)先遷 renderer，分階段完成 POC。若回覆要求修改提案，先更新契約並確認差異。此頁本身不授權本輪立刻改程式碼。


