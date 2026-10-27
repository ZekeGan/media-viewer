# CELL 目錄

此頁區分現行契約與候選；共用編輯行為見 [EDITOR_DESIGN](EDITOR_DESIGN.md)。值、版面及受控動作分開；舊 DataType 不作目標範式。

## 現行契約

[CellKind](../shared/model.ts) 與 runtime 驗證是程式真相，新增種類需同步 renderer／驗證／可攜相容性。

| kind | 用途 |
| --- | --- |
| name／path | 目前資料夾系統名稱／路徑，不把舊設備路徑當可攜原值 |
| field-text | 依 attributeId 顯示文字 |
| field-tags | 多值標籤 |
| field-number | 數字 |
| field-date | 日期 |
| image | 選用的獨立圖片組件；每個位置可各自選圖，空白不強制填寫 |
| divider | 分隔線，沿用組件尺寸／文字色 |
| open-folder | 經 main 驗證後開啟目前資料夾 |

缺 key 可顯示預設，但不寫回資料夾、不成為搜尋真值；搬入專案的欄位身分不可只按相同 alias 合併。

遊戲的 EXE／資料夾按鈕已有專屬工具列與獨立目標／參數，見 [遊戲](GAME_VIEWER_DESIGN.md)；不因此擴大所有 CARD CELL 的動作權限。

## 保留的候選

Boolean／狀態（未知不等於 false）、富文字、分隔線、連結、檔案數／容量／時長等衍生值、更完整數值格式與單位、日期精度／時區等，需要逐項規格及排程。來源日期不能與系統／購買時間混用；只有年／年月的資料不能硬補日期。

候選的來源、renderer、格式／空值／樣式及操作需各自明確；衍生值標示計算狀態／更新時間，不阻塞基本列表。其他外部應用不得變成任意系統命令輸入。更完整例子見 [封存目錄](history/agent-docs-before-cleanup.md#cell-catalog)，不是本輪必做清單。
