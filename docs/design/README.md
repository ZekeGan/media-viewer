# 設計探索參考，全部未定案

使用者於 2026-10-26 明確確認：本目錄的新舊圖片與 HTML 都只是探索參考，不代表未來設計以此為準。**不要根據生成圖中的排列、顏色、品牌、圖示、欄位或額外操作新增產品需求。** 已核定要求以 [DECISIONS.md](../DECISIONS.md)、[PRODUCT.md](../PRODUCT.md) 及使用者最新指示為準（C-77）。

## 17 畫面同圖預覽（2026-10-26）

| 編號 | 圖片／生成紀錄 | 用途與限制 |
| --- | --- | --- |
| REF-UI-01 | [ChatGPT Desktop 深色總覽](explorations/ui-contact-sheet-chatgpt-preview-v1.png)・[實際提示詞](explorations/ui-contact-sheet-chatgpt-preview-v1.prompt.md) | 單張 1070×1470，對應 [S-01～S-17](../UI_SCREEN_CATALOG.md)，最後一格為審查說明。使用者明確指定僅供預覽，沒有選定任何風格／功能細節；示例文字及數值以文件為準。 |

以內建 imagegen 生成並保存原圖，沒有修改應用程式。圖中呈現包括尚未實作的媒體畫面，不是程式截圖或驗收證據。後續可按 S 編號討論位置、功能及尺寸，不因出現在圖上就核定新需求。

## GRAPH＋漫畫同頁探索

三張皆將資料夾階層圖及所選資料夾的漫畫內容放在同一頁；本輪 GRAPH 指既有 B：TREE 的樹圖語意，不新增第四種瀏覽模式。

| 編號 | 參考圖 | 探索重點 |
| --- | --- | --- |
| REF-GM-01 | [macOS 風格](explorations/graph-manga-macos-reference.png) | 淺色、半透明感、圓角與細分隔；中間 GRAPH，右側資訊與漫畫頁面。 |
| REF-GM-02 | [ChatGPT Desktop 風格](explorations/graph-manga-chatgpt-reference.png) | 深灰、低對比表面、群組式專案側欄；GRAPH 與漫畫內容並排。 |
| REF-GM-03 | [瑞士編輯／工業檔案台風格](explorations/graph-manga-editorial-reference.png) | 米白、黑色與橘色、硬邊框及大字；漫畫區在上、GRAPH 在下，探索不同分區。 |

這些是靜態 AI 生成示意，不是應用程式畫面、功能完成證據或效能測試。第一張的生成品牌、圖中的回收桶、統計數字、標籤／欄位等均不構成決策。macOS 視覺不改變目前 Windows 目標平台；第三張上下分區也不取代 C-73 已記錄的右側內容區方向。任何採用都需另行明確確認。

## 歷史參考保留

[舊三種配色／密度探索](../DESIGN_STYLE_OPTIONS.md)及 `style-options.html`、`style-a.png`、`style-b.png`、`style-c.png` 保留供回顧。它們當時共用版型，不能當成已選排版；舊圖片內若仍有「推薦」等字樣，只反映當時建議，沒有決策效力。

保留原檔可避免丟失探索歷程；目錄入口及文字稿已明確移除定案暗示，不預設沿用其中任何一套。
