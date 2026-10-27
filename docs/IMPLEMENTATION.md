# 執行與驗證

本頁只維護操作入口與驗證選擇。現況模組見 [ARCHITECTURE](ARCHITECTURE.md)，功能行為見 [任務索引](README.md)，待辦見 [WORK_ITEMS](WORK_ITEMS.md)。版本／套件以 package.json 與 lockfile 為準，避免多處抄錄。

## 命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | Electron＋Vite 開發 |
| `pnpm build` | `tsc --noEmit` 後建置 Electron／renderer |
| `pnpm start` | 預覽已建置應用 |
| `pnpm typecheck` | 單獨型別檢查；若本輪已 build 成功，不再重跑 |
| `pnpm exec tsx --test tests/<name>.test.ts` | 受影響資料測試 |
| `pnpm test` | 所有 `tests/*.test.ts`，適用跨模組風險／交付 |
| `pnpm test:workspace` | 現行完整 Electron UI：`tests/workspace-ui.ts`；需相符建置 |

`test:ui` 與 `test:workspace` 是同一 runner，選一個即可。不要臆造 lint／舊 UI script；需新命令先查 package.json。未改依賴且環境可用，不例行安裝或更新套件。

## 驗證選擇

先列本次可能失敗的行為，再選能直接暴露它的檢查。以下是依風險選擇，並非每輪累加全做。

| 改動 | 最小有效驗證 | 何時擴大 |
| --- | --- | --- |
| 只改文件／Agent 流程 | 改動範圍、有效本機連結、diff／空白；不啟動應用 | 涉及可執行設定時查其有效性 |
| 文案／低風險樣式 | 目標區域檢視；無畫面則明說未執行 | 尺寸、焦點、可捲動範圍改變才加相關尺寸／互動 |
| 共用型別／純邏輯 | 對應測試＋typecheck，或需要建置時以 build 取代 typecheck | 呼叫契約跨模組才補相關端 |
| 導覽／CELL／窗格互動 | 受影響模式與狀態保存的目標操作；需要打包程式時 build 一次 | 共用選取／歷史／模板改動才補其他模式 |
| main／preload／媒體協定 | build＋受控 Electron 路徑；來源／邊界與錯誤處理 | IPC／共用串流變更再加相關媒體 |
| 可攜寫入／身分／覆寫／遷移／清理 | 受控資料樹的成功及失敗／取消／復原路徑，確認原檔及無關資料保留 | 涵蓋專案或資料契約擴大，才跑完整資料回歸 |
| 跨模組／明確發版驗收 | build、完整資料測試、適用的現行 UI runner | 性能／平台／真實樣本有具體風險才另測 |

不要用只鏡像實作的測試替代行為驗證。儲存安全所需檢查不能因「最小」而刪減，詳見 [STORAGE_OPTIONS](STORAGE_OPTIONS.md)。

## 測試定位與失敗處理

| 入口 | 涵蓋 |
| --- | --- |
| `tests/library.test.ts` | 可攜讀寫、清理／復原、重疊專案、副本／遷移、取消與路徑限制 |
| `tests/explorer.test.ts` | 型別值／覆寫、搜尋、媒體串流、字幕、遊戲動作與來源固定回應 |
| `tests/workspace.test.ts` | UI 設定、排序、併發及失敗保留 |
| `tests/revision.test.ts` | 模式／方案、有效記錄與遊戲邊界、小數尺寸、Windows 保留目錄大小寫 |
| `tests/workspace-ui.ts` | 目前外框／瀏覽／媒體整合；測試資料與截圖在 `.test-output/` |
| `tests/performance.ts` | 獨立規模實驗；僅性能工作按需執行，不作日常門檻 |

資料與 UI 測試只使用自建測試樹及隔離的 userData，勿指向使用者收藏。UI runner 用專案根 `args: ['.']` 啟動，配合 `MEDIA_VIEWER_TEST_DATA`；檢查 runner 的媒體生成條件，勿把缺環境工具誤報為產品失敗。

先辨別產品、環境或測試定位器失敗，保留失敗輸出／截圖，縮到相關情境再修正。未改應用來源不重複 build；修測試定位器先重跑失敗路徑。只有剩餘跨區風險或交付門檻才再跑整套。其他舊 UI 腳本是歷史材料，不列為現行必跑項。

## 驗證紀錄的使用

本輪交付只回報實際執行的檢查及限制；沒有跑的明寫「未執行」。[0.5.0](RELEASE_0_5_0.md)、[前輪階段](STAGES_2_3.md) 與 [POC 驗收](POC_ACCEPTANCE.md) 是歷史證據，不能當本輪通過；原基準／備份資訊保存在 [整理前實作頁](history/agent-docs-before-cleanup.md#implementation)，不需每次讀取。
