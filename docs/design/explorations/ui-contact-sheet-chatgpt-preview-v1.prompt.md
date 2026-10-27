# 17 畫面總覽預覽：生成紀錄

日期：2026-10-26。內建 imagegen 工具，單張 ui-mockup contact sheet；參考已檢視的 REF-GM-02 深色風格，以文字描述生成新圖，未修改原圖。圖片僅供審查、未定案，不是程式截圖或驗收證據。

輸出：[預覽圖](ui-contact-sheet-chatgpt-preview-v1.png)。畫面對應 [S-01～S-17](../../UI_SCREEN_CATALOG.md)；圖片中的示例數字、欄位或額外細節不取代文字需求。精確視覺及 UI-R 草案仍待審。

## 實際生成提示詞

```text
Use case: ui-mockup.
Create ONE SINGLE high-resolution portrait contact-sheet image for design review of a Windows desktop application called "Media Viewer". This is an overview of 17 screens/regions, NOT one impossible screen containing every feature at once. Use the largest practical resolution, ideally around 4096 x 5632 or larger, with crisp readable Traditional Chinese headings and straight-on screenshot-like UI.

STYLE: closely match the previously shown ChatGPT Desktop inspired dark Media Viewer reference: charcoal #202122 workspace, near-black #171819 sidebar, slightly lighter gray panels, subtle thin borders, modest rounded corners, off-white typography, muted mint/teal selected states. Restrained, calm desktop software styling. No ChatGPT/OpenAI logo, no chat bubbles. This is ONLY a style preview, not a final design and not a real screenshot.

EXACT COMPOSITION: a clean 3-column by 6-row grid, 18 equal slots, generous gutters. Slots 1 through 17 are different mini application screenshots labeled S-01 through S-17, in row-major order. The last slot is a review legend, NOT an eighteenth screen. Each mini screenshot has a LARGE caption ABOVE it containing its exact S number and short Chinese title, with the title fully inside the image. Do not skip, merge, repeat, renumber or crop any of the 17 slots. Every panel must show meaningful differentiated interface layout, not just a title or decorative icon. The global top title and footer have ample breathing room. All 17 screenshots need to be visible simultaneously in this one image.
Main heading exactly: "Media Viewer｜畫面總覽預覽"
Subheading exactly: "ChatGPT Desktop 風格 · S-01—S-17 · 僅供審查，未定案"
Footer exactly: "非最終設計｜非實作截圖｜依 S 編號提出修改"
Use Traditional Chinese, legible sans-serif. Interior labels should be short and readable; use a few realistic sample rows rather than tiny paragraphs. No lorem ipsum, no marketing slogans.

SHARED CHROME in relevant full workspace panels: top global title bar has logo, sidebar toggle, centered scope SELECT "當前／全部" and search, Windows minimize/maximize/close controls right. IMPORTANT: back/forward arrows are NOT in this global bar. Back/forward and breadcrumb/parent navigation belong in the PROJECT TOOLBAR below it. Left project sidebar shows "新增專案", "我的群組", "最愛", custom groups "動作遊戲" and "愛情漫畫", and "最近新增". Main project browsing modes are exactly CARD, TREE, TABLE; LIST is another name for TABLE, not a fourth mode. Typical workspace has left project sidebar, center browser and right selected-folder content. Dialog and viewer panels may show a dimmed workspace behind their overlay. Avoid irrelevant technical implementation text.

EXACT GRID AND PANEL CONTENTS:
ROW 1
1. "S-01 首頁": home workspace, project sidebar, main area with "新增專案", "重新連結", and a few recent project entries. No active project; search scope "全部".
2. "S-02 建立與掃描": centered create-project dialog, name input, root folder picker, media type select, depth mode "第1至N層／只顯示N層", number, scan progress bar and "取消掃描", "查看問題".
3. "S-03 CARD": full workspace with project toolbar, center customizable folder cards in a 2-column arrangement, bottom pagination, selected card and right details pane.

ROW 2
4. "S-04 TREE": full workspace with branching horizontal folder node graph in the center, thin mint connectors, subtle structural ancestor nodes, selected node; right folder information. Zoom and fit controls, no page pagination in the graph.
5. "S-05 TABLE／LIST": full workspace with project toolbar back/forward and parent breadcrumbs, tabular folder rows with name, tags, path, sortable headers, selected row, right details pane.
6. "S-06 資料夾詳情": emphasize a docked right detail panel with folder title and current path, editable field/value rows, a saved image, shared-value badge, "保存", "取消", "在檔案總管開啟"; underlying browser remains visible.

ROW 3
7. "S-07 CELL 編輯器": distinctly three-part editor: LEFT component palette, CENTER card canvas with draggable/resizable outlined cells and true-data preview, RIGHT selected component binding and color/style properties; top undo/redo/save/cancel.
8. "S-08 專案設定": compact settings form with project name, media category, root/reconnect, depth settings, cards-per-row, page-size, template/field settings entries and save/cancel. This is a project configuration form, not a cell canvas.
9. "S-09 搜尋跳窗": command-palette-like floating overlay with "當前專案／全部專案" select, search input containing "tag:2025", field hints, results with folder names, paths and source-project badges.

ROW 4
10. "S-10 問題與復原": error/recovery center listing "路徑失效", "記錄損壞", "重複身分"; clear inline status icons, "重新連結", "備份復原", "重試" actions. Calm usable recovery screen, not a terminal.
11. "S-11 清理預覽": cleanup dialog with scope selection, list of only application records/assets to remove, clear message "原始媒體保留", counts for success/failure/not-covered, "確認清理", "取消".
12. "S-12 漫畫內容": right content view enlarged: TOP small original all-ages black-and-white rainy-bookstore comic cover left, folder title and a few custom information fields right; BELOW gallery of numbered manga page thumbnails, one "GIF" badge, small TOP button. Cover and gallery are distinct areas.

ROW 5
13. "S-13 漫畫閱讀器": in-app large reading overlay with ONE tall monochrome manga page centered, clear upper previous/next, fit-width W, fit-height H, single/double D, page selector, toolbar T; ESC close. Fit-height and single-page initial state. This is not the thumbnail gallery.
14. "S-14 遊戲內容": large wide fictional game banner at top with "更換封面", a middle customizable action strip "啟動遊戲", "存檔資料夾", settings icon, lower field/value table. Original fictional game art without known IP or store branding.
15. "S-15 圖片／相簿": gallery with "瀑布流／列表" toggle; show selected masonry mode, visibly varied portrait/landscape photo heights and natural uncropped aspect ratios, sample architecture/landscape photos. Do NOT use a uniform square grid.

ROW 6
16. "S-16 圖片檢視窗": in-app image viewer overlay with one large detailed landscape image, zoom/pan controls, "適應", "100%", plus/minus and ESC close; slim information area "長寬", "JPEG", "大小".
17. "S-17 影片與字幕": TOP video player showing a calm original landscape video still, play/timeline/audio/fullscreen controls; BELOW a strip/list of mixed subfolders, videos, images and an SRT subtitle file. A subtle short drag arrow from the SRT item toward the player, labeled "拖入字幕". Small subtitle settings popup with "提早／延後", "+0.1 秒", size/bottom-distance controls. No music player.
18. REVIEW LEGEND: clean typography-only tile headed "審查方式", with "依 S 編號回覆", "位置／功能／尺寸", "風格仍未定案", and small legend chips for "畫面", "區域", "覆蓋層". Do NOT label it S-18.

CONSTRAINTS: One single flat image, no 3D mockups, no laptop/phone frames, no giant hero panel replacing the grid, no additional screens, no music UI, no chat UI. Keep shared chrome coherent, but faithfully vary the contents to reflect all 17 purposes. This is a contact sheet for zooming and comparing. Prioritize complete grid, exact numbered captions, correct control locations, and clear visual differences between screens.
```

