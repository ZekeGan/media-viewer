# 需求與 agent 文件一致性稽核

> 實作階段更新：使用者已授權開始 POC（C-68）。本頁保留設計／審查歷史；現行契約與實際驗證狀態見 [IMPLEMENTATION.md](IMPLEMENTATION.md)，不以歷史待審文字阻擋已授權工作。

整理日期：2026-10-25。此頁記錄本輪文件對照的結論；只檢查設計文件，**未驗證程式功能**。最新使用者決策優先於舊原型與早期文件；[DECISIONS.md](DECISIONS.md) 記錄已核定行為，[OPEN_DECISIONS.md](OPEN_DECISIONS.md) 保留尚未定案問題。

## 已發現並修正的文件衝突

| 衝突 | 修正後的統一說法 | 涉及文件 |
| --- | --- | --- |
| 舊架構圖把每筆值預設放在 `projectId + folderId + fieldId`，新需求要求資料夾移入其他專案仍可讀原值。 | 資料夾共用的有型別屬性為預設；專案保存映射與版面，只有顯式私有覆寫才帶 project ID。 | `DECISIONS.md`、`DESIGN_DRAFT.md`、`TARGET_ARCHITECTURE.md`、`FOLDER_PROJECT_MODEL.md`、`PRODUCT.md`、`AGENTS.md`。 |
| 舊文件把 NUMBER、DATETIME、圖片和完整樣式直接列作 POC 或 MVP 首批必做；使用者要求 POC 基本功能，MVP 型別後續再談。 | POC 驗證基本閉環，MVP 逐步增加資料顯示與操作；具體型別只是候選，不作承諾。 | `DECISIONS.md`、`ROADMAP.md`、`PRODUCT.md`、`CELL_CATALOG.md`、`EDITOR_DESIGN.md`、`WORK_ITEMS.md`。 |
| 專案分類不寫入資料夾，但舊敘述直接要求分類不符圖示。 | 僅依資料夾明確類型或可信來源提示不符；無證據顯示未判定，不由專案分類自動寫回。 | `DECISIONS.md`、`FOLDER_PROJECT_MODEL.md`、`METADATA_ENRICHMENT.md`。 |
| 「清除此專案資料」易被解讀為刪除資料夾共用值。 | 只清專案私有覆寫／關聯設定；「清除此資料夾全部本程式資料」才涵蓋共用屬性。 | `DECISIONS.md`、`STORAGE_OPTIONS.md`、`PRODUCT.md`。 |
| README 曾說 SQLite 的角色尚未決定，且早期逐資料夾方案正在重新審核。 | SQLite 的角色已確定為可重建本機索引；每資料夾可攜記錄及清理能力已再次確認。 | `README.md`、`AGENTS.md`、`STORAGE_OPTIONS.md`。 |
| 畫面地圖把完整目標畫面列表寫成「POC 主流程」，部分草案仍引用已結案的 O-59、O-60。 | 畫面地圖明示分期未定；草案按最新共用值與類型證據原則更新。 | `SCREENS_AND_FEATURES.md`、`DESIGN_DRAFT.md`、`METADATA_ENRICHMENT.md`。 |
| O-80 早期草案說徹底清理後搬移的資料夾需判定舊身分；使用者已明確指定搬入其他專案時當作新資料夾。 | 原位停記錄、無標記搬到新位置給新 ID；審查包 R-03 建議排除位置寫入仍保留的專案設定。 | `DECISIONS.md` C-66、`POC_DESIGN_PACKAGE.md`、`POC_WIREFRAMES.md`、`POC_TECH_ARCHITECTURE.md`、`POC_PREDEV_REVIEW.md`。 |

`DEV_LOG.md` 保留當時的歷史記錄，因此可看到早期「待審核」字樣；它們不是目前規格。`ARCHITECTURE.md` 描述原型事實，`PLAN.md` 是舊構想，也不能覆蓋最新決策。

## 仍有取捨，並非互相矛盾的需求

1. **每資料夾可攜與一鍵清理**：可清已連結、可存取的資料；離線、未連結或備份副本不可能被目前程式保證找齊。UI 必須列出涵蓋與未涵蓋範圍。
2. **單獨資料夾可攜與原專案版面**：資料夾自身的值與圖片可帶走；若未帶走原專案根設定，不能保證原版面也隨行。無專案通用詳情已排在 MVP。
3. **同名 key 與共享值**：別名相同可映射到不同的穩定屬性 ID／型別；共用值的修改會影響所有引用它的專案，型別變更與刪除需跨專案影響預覽。
4. **隱藏資料與完全不可見**：Windows 隱藏屬性只減少日常可見度；啟用顯示隱藏檔仍可看到，使用者已接受這項界線。
5. **搜尋所有真實值與專案版面**：查詢範圍由目前專案的掃描範圍決定，但文字匹配可查掃到的資料夾所有真實可搜尋值；視覺預設不當資料。
6. **POC 基本搜尋與 200ms 目標**：POC 先驗證名稱／路徑；完整 key/value 與短字串索引在後續階段。C-60 已核定分階段量測，O-78 仍須固定各階段樣本與設備，不將工程目標當成已達標。

## 本輪建議的核定與剩餘工作

方向已依 C-56 至 C-67 核定，含 Mantine、Windows x64 及 O-80 新資料夾規則。[POC 設計書](POC_DESIGN_PACKAGE.md) 明列自定義 CELL 為核心、A-01 至 A-14 驗收；[八個畫面的低保真線框](POC_WIREFRAMES.md)對應流程。[開發前審查包](POC_PREDEV_REVIEW.md) 集中 R-01 至 R-10、T-01 至 T-04、示意 schema、固定效能資料集與舊 JSON 轉換樣本，均須使用者審核後才成為實體契約。MVP 型別、來源網站及閱讀／播放細節已明確延後。


