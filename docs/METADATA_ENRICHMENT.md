# 外部資料預覽與匯入

漫畫首個來源為 **E-Hentai**；使用者本輪另指定 **Steam** 作為遊戲來源。此頁持有來源流程與人工值保護；程式入口：[metadata](../electron/metadata.ts)、[Explorer](../electron/explorer.ts) 的 metadataPreview／applyMetadata。

## 目前能力

手動貼精確畫廊 URL → 驗證／取得公開 gdata → 預覽 → 選欄位與封面 → 明確套用至資料夾 → 保存可攜資料並更新畫面。來源欄位使用獨立 ID／來源 URL；人工欄位不混成同一值，遇既有 ID 的來源衝突拒絕。封面需要保存時複製受管資產，不能只依賴網路 URL。

保留標題、原語言標題、標籤等原語意；posted 是畫廊上傳時間，不當作品發行日。固定回應的測試證據不代表真實網站／帳號／收藏已驗收。

## Steam

接受官方商店 App 網址或 App ID，預覽名稱、開發商、發行商、類型、簡介、商店日期及選用封面；匯入使用 steam- 命名空間，與 E-Hentai／人工值分開。日期保留 Steam 商店原文，不推定為作品首次發行日或購買日。

目前使用 [Steam 商店公開資料端點](https://store.steampowered.com/api/appdetails?appids=620&l=english)，不宣稱是有相容承諾的 Steamworks API。main 固定請求主機／路徑、限制大小／逾時／重新導向並驗證 App ID；封面只允許指定官方 CDN 與同 App 路徑，失敗可略過。不需要使用者交出帳號憑證。

## 不變限制與目標

- 外部資料提供候選，不替使用者決定作品身分；不以資料夾名稱直接認定作品。不自動批次模糊匹配或下載收藏。
- 來源 URL／ID 與語意應可追溯；來源資料隨資料夾攜帶。敏感憑證不進專案或可攜記錄，不把共用 secret 內建桌面應用。
- 再次匯入預設填空、逐欄確認覆寫及保護手填值是既有方向；**目前來源欄位分開保存，不等同完整逐欄 diff／映射／填空 UI 已交付**。統一 SourceRecord／FieldValue 契約、擷取時間／原始資料等完整模型尚需工程設計。
- 只有來源及使用方式明確可用時保存圖片；不能假設所有網站提供同樣 API、欄位或授權。來源 adapter 彼此隔離，不為加一站重寫整個資料模型。

## 後續候選

Steam 以外來源仍待指定；首次發行日、平台／版本日期與購買日分開。批次／CSV 對照、名稱候選人工審核、galleryinfo.txt／本地線索擷取是候選，尚未自動納入現行流程。批次若選入需可暫停、分別報成功／模糊／失敗，不能繞過寫入安全。

原 Steam／IGDB／E-Hentai 研究、SourceRecord 提案與完整例子見 [原稿](history/agent-docs-before-cleanup.md#metadata-enrichment)，不是現行能力或每輪必讀。新增來源前再驗證官方能力與要求，不依賴歷史研究推斷現況。
