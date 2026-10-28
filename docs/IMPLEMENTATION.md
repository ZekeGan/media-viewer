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

應用視窗聚焦時按 `F12` 可開啟／關閉 DevTools；開發與已建置版本均可使用。修改主程序後須重新啟動應用，長按不重複切換。

## 驗證選擇

開發前先列本次驗收、完成條件與可能失敗的行為，再選能直接暴露它的檢查；依功能涉及範圍納入錯誤、非同步、離開／背景停止及保存／復原情境。簡單任務不另建計畫或測試框架。以下是依風險選擇，並非每輪累加全做。

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
| `tests/model.test.ts` | 可攜 folder／project／details 的接受／拒絕、CELL／字幕／路徑邊界、第一個錯誤順序、既有 null 相容性與輸入不變；資料 fixture 在 `tests/support/model-fixtures.ts` |
| `tests/explorer.test.ts` | 型別值／覆寫、搜尋、媒體串流、字幕、遊戲動作與來源固定回應 |
| `tests/decided.test.ts`／`tests/decided-media.test.ts` | 系統語言、型別／方案、設定匯出入／失敗復原、免憑證來源、唯讀 ZIP、總覽來源及穩定查詢 |
| `tests/decided-ui.ts` | 實際欄位／方案／來源選單、面板偏好、虛擬總覽／即時語言、ZIP 解碼／原生 PDF、原生設定匯出／取消／匯入／復原；受控原檔不變 |
| `tests/workspace.test.ts` | UI 設定、排序、併發及失敗保留 |
| `tests/file-overview-ui.ts` | `pnpm exec tsx tests/file-overview-ui.ts`：圖片／影片各 1,200 檔，重現連續捲動導致 renderer 卸載；驗證三種展示、篩選、尺寸、重新整理、實際可視卡片及原檔／記錄保留 |
| `tests/appearance.test.ts` | 介面字典覆蓋、插值不改使用者內容、預設 CELL 與自訂配色保留 |
| `tests/appearance-ui.ts` | `pnpm exec tsx tests/appearance-ui.ts`：隔離資料驗證三主題／五語言、預覽取消、保存重開、三模式、隱藏側欄與窄視窗；截圖在 `.test-output/appearance-*/screens/` |
| `tests/notifications-ui.ts` | `pnpm exec tsx tests/notifications-ui.ts`：受控舊資料的真實成功／部分完成／全部失敗通知，名稱不影響等級、成功自動收起、警告／錯誤保留、取消、英文 IPC 例外與草稿保留；同時比對原檔及匯入備份 |
| `tests/revision.test.ts` | 模式／方案、有效記錄與遊戲邊界、小數尺寸、Windows 保留目錄大小寫 |
| `tests/workspace-ui.ts` | 目前外框／瀏覽／媒體整合；測試資料與截圖在 `.test-output/` |
| `tests/gallery-performance-ui.ts` | `pnpm exec tsx tests/gallery-performance-ui.ts`：1,200 張受控圖片的首批／首圖時間、捲動幀距、DOM／請求上界、相簿與漫畫翻組及開啟；`GALLERY_BENCH_BASELINE=1` 僅供比較，略過新能力斷言 |
| `tests/gallery.test.ts` | 圖庫可見範圍、鍵盤焦點保留、比例到達後欄位穩定與調寬 |
| `tests/media-ui.ts` | `pnpm exec tsx tests/media-ui.ts`：隔離影片自動播放偏好、切專案／關窗停止與過期事件、相簿兩模式捲動穩定、搜尋範圍／開啟；使用 FFmpeg 受控影音 |
| `tests/video-player-ui.ts` | `pnpm exec tsx tests/video-player-ui.ts` 執行全部；`--list` 列出群組，`--group controls`／`subtitles`／`auto-next`／`lifecycle`／`appearance` 選擇重跑，可重複傳入 `--group`。各組獨立建立媒體樹、專案及 userData，保留原檔逐位元比較；涵蓋控制列、字幕／全螢幕、接續與末片、離開／隱藏／最小化、錯誤、主題及窄視窗 |
| `tests/reader-ui.ts` | 閱讀器專項：`pnpm exec tsx tests/reader-ui.ts`；視窗／最大化與全螢幕還原、無上下留白、縮小下限／細節放大／平移、沉浸隱藏、固定 RTL 圖示、頁碼框與翻頁焦點；同樣使用隔離資料與 FFmpeg 測試圖片 |
| `tests/performance.ts` | `pnpm exec tsx tests/performance.ts`：受控實體 1,000 資料夾的首次建立／重掃與 snapshot；另以 20 專案、1,000／10,000 筆模擬記錄分測首次建索引、snapshot、未變同步、SQL 與完整 main 搜尋請求。後四項暖身 3 次、取 24 次的中位數／p95，不含 IPC／UI；JSON 保存在 `.test-output/performance-*.json`。`POC_PERF_COUNT=10000` 可放大實體掃描。僅性能工作按需執行，不作日常門檻 |

資料與 UI 測試只使用自建測試樹及隔離的 userData，勿指向使用者收藏。UI runner 用專案根 `args: ['.']` 啟動，配合 `MEDIA_VIEWER_TEST_DATA`；檢查 runner 的媒體生成條件，勿把缺環境工具誤報為產品失敗。

`tests/support/video-fixture.ts` 供播放器與媒體 UI runner 共用受控 H.264／AAC 影片；首次需要 FFmpeg 產生，後續讀取 `.test-output/fixtures/` 並校驗 SHA-256，再複製至各案媒體樹。產生參數改變會使用新的快取目錄；校驗失敗會中止，不繼續使用損壞素材。共享快取不得作為測試修改對象。播放器的取消倒數／離開後不接續以 renderer 受控時鐘越過期限；自然接續仍保留一次實際 5 秒倒數，正式應用計時未改。

播放器 `appearance` 群組拍攝三主題的一般／窄視窗／全螢幕共九種狀態，並寫出該次輸出目錄的 `computed-styles.json`。樣式重整前可先跑一次留基準；重整後設定 `VIDEO_CSS_REFERENCE` 為該 JSON 的路徑，再執行同一群組，比對關鍵元素的計算樣式及窄視窗操作範圍。基準使用受控資料，不作固定產品數值或跨機器像素保證。

先辨別產品、環境或測試定位器失敗，保留失敗輸出／截圖，縮到相關情境再修正。未改應用來源不重複 build；修測試定位器先重跑失敗路徑。只有剩餘跨區風險或交付門檻才再跑整套。其他舊 UI 腳本是歷史材料，不列為現行必跑項。

需要反覆執行的長 UI runner，優先讓相關情境可獨立重跑；受控影音等昂貴素材可共用，但每案可變資料及 userData 仍須隔離。只在本次或後續重跑成本值得時調整測試結構，不為小修改例行重構測試。

非同步測試等待可觀察的完成狀態（metadata、字幕結果、圖片解碼／排版等），避免任意延遲。倒數等時間行為保留代表性的真實時間驗證，其餘案例可用受控時鐘或測試注入縮短等待，不改正式環境行為或降低原驗收要求。

開發時先跑受影響情境，最後按矩陣完成一次適用整合驗證。驗收與必要檢查全部通過即交付；只有新修改、失敗或具體剩餘風險才擴大／重跑，不在完成前臨時加入無關驗收。

## 驗證紀錄的使用

本輪交付只回報實際執行的檢查及限制；沒有跑的明寫「未執行」。[0.5.0](RELEASE_0_5_0.md)、[前輪階段](STAGES_2_3.md) 與 [POC 驗收](POC_ACCEPTANCE.md) 是歷史證據，不能當本輪通過；原基準／備份資訊保存在 [整理前實作頁](history/agent-docs-before-cleanup.md#implementation)，不需每次讀取。
