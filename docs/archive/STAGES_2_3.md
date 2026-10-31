# 第二／三階段實作與驗證

> 歷史設計／交付紀錄：保留原時點的範圍、提案與驗證，不例行追加，不作每輪前置檢查；當前入口見 [文件索引](../README.md)、[待查收](../WORK_ITEMS.md)。舊「待審／未實作」及完成測試數不代表現在狀態，亦不取代本輪驗證。


2026-10-27，來源 C-87：使用者要求修正第一階段並連續完成第二／三階段；首個外部來源選 E-Hentai。外觀仍為可調基線，音樂／原生解碼／ASS／壓縮檔不因本次授權變成首輪必達。

## 範圍與契約

- 外框：移除最近新增，未分類列所有沒有自訂群組的專案（收藏獨立）；固定／自訂群組皆可排序，各區專案可排序，拖放與選單共用本機排序。頂部只留 Logo，範圍 SELECT 只在搜尋跳窗，全域統一捲軸樣式。
- 瀏覽：CARD／TREE／TABLE 共用選取及右側內容；TREE 用 React Flow 12＋Dagre 3，唯讀父子結構、縮放／平移，精確模式保留淡色祖先、不分頁。TABLE 配置欄位、排序／調寬、子層／父層與歷史返回／前進；工作區放大及 ESC 分層。
- 資料：圖片／標籤／數字／日期 CELL、引用既有穩定屬性 ID、共用值與顯式私有覆寫、批次取代／標籤增減、保存常用搜尋。CARD 與各媒體資訊模板共用編輯器、分開保存。
- 搜尋：SQLite 為可重建本機索引；參數化查詢，key/value、逗號 AND、空格 AND、引號、排除、單層 OR、無 key 搜尋及提示／分頁。同別名不同身分需 `key@完整屬性ID`，不猜測合併。三字片段索引，1–2 字範圍掃描；未顯示的真實文字／標籤仍可搜尋。
- 圖片／漫畫：直接 PNG／JPEG／WebP／GIF，自然排序；相簿瀑布流／列表，圖片檢視的適應／100%／縮放／平移／資訊；漫畫寬高適應、單雙頁、方向／首張獨立、頁碼及快捷鍵。可見 GIF 播放，閱讀時背景改靜態縮圖；縮圖只在本機快取。
- 遊戲：淺層特徵候選在進入子層前停止，人工 ROOT／誤判修正／唯讀繼續；精確深度不例外。Unity／RPG Maker／Unreal／Godot 及多家族組合規則；單檔／未知版本人工 ROOT，不能承諾所有版本自動判定。大圖、工具列版型、獨立 EXE／資料夾目標與有序 args；明確點按才啟動，cwd 為 EXE 目錄、不拼 shell。
- 影片：Video.js React 10.2，受控本機串流／Range、混合檔案、使用者選續播、離開停止；SRT／VTT 拖入／載入／關閉、時間／大小／顏色／位置／編碼。字幕跟媒體時間，偏移按影片＋來源；外部先臨時，明確匯入才存副本。
- 來源：[E-Hentai 公開 gdata API](https://ehwiki.org/wiki/API)；完整圖庫網址，候選預覽、勾選後保存欄位／封面縮圖，保留來源及 namespace 標籤；公開時間不當作品發售日。不登入、不掃下載、不執行來源內容。失敗保留原值。

仍沿用可攜 schemaVersion 1 的向後相容新增欄位：`folder.details.schemaVersion=1` 包含 boundary／reading／playback／targets／subtitles／bannerAssetId；專案新增 contentCells／actionTemplates／traversal／savedSearches。舊檔不批次升級，只在明確保存時原子更新並備份。字幕副本限 `subtitles/<id>.srt|vtt` 且納入已知歸屬清理，原字幕／影片／圖片不變。

`workspace-ui.json` 延續 schema 1，新增可選 sections／projectOrder／browse；舊 recent 收合值只作未分類初始化，相容保留，不再顯示最近。各模式捲動／TREE 視點、欄寬留本機。索引 search.sqlite、縮圖 thumbnails/ 可重建，不能當資料來源。縮圖快取定期收至 3,000 檔／512MiB 基線；圖庫每組 200 個 DOM 項目，總筆數不設 200 上限。

## 驗證紀錄

- 資料：`pnpm test` 24／24 通過，包含 Windows junction／ACL、既有復原清理與新增邊界／型別／批次／查詢／Range／字幕／來源固定回應；只在 `.test-output/`。假的 EXE 只交給測試 adapter，未執行遊戲。
- 畫面／播放：`pnpm test:stages` 已通過：排序／重載、TABLE 導覽、TREE 選取／放大、欄位保存與草稿、常用搜尋、相簿 GIF／圖片檢視、漫畫雙頁與快捷鍵／偏好、遊戲邊界／工具列、實際 MP4 H.264／AAC 播放／定位／字幕／停止、800px。
- 編輯：`pnpm test:editing` 已通過新 CELL 型別、原生未保存關閉攔截、數字／日期／標籤保存、可攜圖片實際解碼、CARD／內容模板分離及實際批次更新。
- 媒體補驗：`pnpm exec tsx tests/media-final-ui.ts` 已通過適應高度／快捷 Tooltip、WebM VP9／Opus 實際解碼、瀏覽器 Range 206、原生 File 字幕拖入／匯入與原檔保留、未授權 explorer IPC 拒絕。發現自訂 scheme 未開 CORS 後已修正，僅允許目前應用來源讀取。
- 效能：補上 vals(doc,field)／grams(doc) 索引後，1,000 筆查詢 p95 21.62ms（30 次，含 1 字中文，僅主程序 SQL 與結果組裝，不含 IPC／輸入等待／繪製）；初版缺索引約 565ms，未以降低持久性或放寬目標處理。
- 素材：僅隔離 userData 與 `.test-output/`，ffmpeg 生成受控圖片／短片；它不是程式執行相依。全套資料因實際掃描變更執行一輪，僅失敗或新增修正才重試／補測；沒有例行重跑舊 1,005 筆／10,000 筆測試。
- 型別／建置：最後版本 `pnpm build`（含 TypeScript）通過；最後畫面修正以媒體補驗驗證，未再例行重跑已通過的兩組 UI。
- 尚未執行：E-Hentai 真實網路來源、真實遊戲各版本、MKV／HEVC／ASS、安裝包、真實斷電及跨設備長期使用。不能用固定回應／假目錄宣稱這些已驗收。

## 使用者查收

用 `pnpm dev` 開啟，先用另建測試資料夾：分類及拖排專案 → 切 CARD／TREE／TABLE 並選資料夾 → 調欄寬／導覽 → 編輯 CELL／內容模板及資料 → 搜尋／保存常用查詢 → 依分類測閱讀／播放。E-Hentai「網路資料」需貼完整公開圖庫網址，確認候選後才寫入。遊戲先用假目錄測 ROOT／唯讀繼續，不直接掃真實收藏。

截圖：[外框](../../.test-output/stages23-screens/home.png)、[TREE＋相簿](../../.test-output/stages23-screens/tree-album.png)、[漫畫閱讀](../../.test-output/stages23-screens/manga-reader.png)、[遊戲](../../.test-output/stages23-screens/game.png)、[影片字幕設定](../../.test-output/stages23-screens/video-subtitles.png)、[800px](../../.test-output/stages23-screens/narrow.png)。測試輸出不提交 Git。

保留限制：群組／視窗偏好尚無跨設備匯出及損壞復原 UI；可攜清理不宣稱清除離線／未連結副本，也不刪除整個 Electron userData。E-Hentai 圖庫封面是來源縮圖，不是下載完整作品；其他來源／需登入來源後議。無法自動判定的引擎用人工 ROOT；數字比較／日期範圍、原生播放後端、ASS／內嵌字幕、壓縮檔／PDF 及音樂維持後續範圍。
