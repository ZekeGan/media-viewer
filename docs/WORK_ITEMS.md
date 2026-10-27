# 當前工作與交接

只記錄未完成、阻礙及下一步；已交付內容不逐輪重抄。最新使用者任務優先，延後項目見 [OPEN_DECISIONS](OPEN_DECISIONS.md)，不代表已授權開發。

## 現在的狀態

- 漫畫縮小下限暫採「貼合可視區高度」，是否允許縮得更小仍待使用者偏好回覆；可調入口為 Reader.changeZoom，主規則見 [漫畫閱讀器](MANGA_VIEWER_DESIGN.md)。不影響已恢復的細節放大與平移。
- **P0：NW.js／內嵌內容與 WOLF Data/BasicData／混合封包仍有實際漏判，尚未修正。** 下一步補受控案例與規則，並將未知執行環境暫停／共同寫入防線納入驗收；保留人工 ROOT／not-game。證據與現行覆蓋集中 [遊戲辨識](GAME_ENGINE_DETECTION.md)。ふたりぐらし／ROOM 的解包 Tyrano 規則已補入，兩種包裝只做必要唯讀查核與受控掃描驗證，沒有掃描實際收藏或清理歷史記錄。
- 既有遊戲邊界／導覽修正只通過其有限受控案例，不代表上述新變體已完成。保留人工 ROOT／not-game；plist 主目標解析、多平台共同作品歸屬及 [Mac 原生啟動](GAME_VIEWER_DESIGN.md#mac-遊戲執行條件待實作) 尚未實作，不能以 Windows 目錄測試宣稱可啟動。
- 第二／三階段及後續回饋（至 C-94：同步瀏覽、CELL、設定分頁與 Steam）已實作，尚待使用者查收。入口：[工作區規格](WORKSPACE_REVISION.md)、[架構](ARCHITECTURE.md)。
- 歷史驗證與限制見 [0.5.0 交付](RELEASE_0_5_0.md)、[第二／三階段紀錄](STAGES_2_3.md)；它們不代表本輪重新驗證。版本以 package.json 為準。
- 原 `workspace:update` 同名錯誤：已修正小數尺寸的可重現路徑，使用者原操作未提供；若再發生，先取得操作與輸入，不宣稱所有成因均排除。
- 待實際樣本／環境查收：大型及格式變體圖片、各遊戲引擎版本、真實 E-Hentai 連線／收藏、跨設備故障復原。只在受控副本驗證，不自動掃描使用者收藏。

後續優先按使用者查收回饋；新功能仍依使用者範圍界定驗收，勿從歷史提案自行擴張。

## 尚有工作時的最小交接

每項只留：狀態與驗收差距、相關檔案／符號、下一步、實際跑過的檢查與失敗證據、需要使用者決策的阻礙。沒有變化就不重寫；全部完成不必留下長篇交接。

舊 ST／UX／BUG／REL 狀態與原驗收細節保存在 [整理前清單](history/agent-docs-before-cleanup.md#work-items)，早期 D／A／S／U／G／IMG／VID 項目見 [三階段前清單](history/work_items-before-three-stages.md)。
