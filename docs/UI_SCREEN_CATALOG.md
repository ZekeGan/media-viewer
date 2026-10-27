# 畫面定位索引

S-01～S-17 包含區域／彈窗／覆蓋層，不是 17 個獨立頁面。這裡只提供定位，不重複維護布局、進度或功能清單；風格仍未定案。共用殼 → 三模式中央區＋獨立右區 → 設定／媒體覆蓋層。

| ID | 區域 | 程式入口 | 行為主文件 |
| --- | --- | --- | --- |
| S-01 | 首頁／專案側欄 | DesktopShell、App | [工作區](WORKSPACE_REVISION.md) |
| S-02 | 新建／掃描 | App、Library | [工作區](WORKSPACE_REVISION.md)、[儲存](STORAGE_OPTIONS.md) |
| S-03 | CARD | BrowseWorkspace、Card | [工作區](WORKSPACE_REVISION.md)、[編輯器](EDITOR_DESIGN.md) |
| S-04 | TREE | TreeView | [工作區](WORKSPACE_REVISION.md) |
| S-05 | TABLE／LIST | BrowseWorkspace | [工作區](WORKSPACE_REVISION.md) |
| S-06 | 通用資料夾編輯／設定 Drawer | FolderPanel、App | [資料模型](FOLDER_PROJECT_MODEL.md) |
| S-07 | CELL 編輯器 | Editor、shared/layouts | [編輯器](EDITOR_DESIGN.md)、[CELL](CELL_CATALOG.md) |
| S-08 | 整合設定 | App、DesktopShell | [工作區](WORKSPACE_REVISION.md) |
| S-09 | 搜尋跳窗 | SearchDialog、SearchIndex | [搜尋](SEARCH_DESIGN.md) |
| S-10 | 問題／復原／重連 | App、Library | [儲存](STORAGE_OPTIONS.md) |
| S-11 | 清理預覽／結果 | App、Library | [儲存](STORAGE_OPTIONS.md) |
| S-12 | 漫畫內容 | FolderContent、Gallery | [漫畫](MANGA_VIEWER_DESIGN.md) |
| S-13 | 漫畫閱讀器 | Reader | [漫畫](MANGA_VIEWER_DESIGN.md) |
| S-14 | 遊戲內容／動作設定 | FolderContent、Explorer | [遊戲](GAME_VIEWER_DESIGN.md) |
| S-15 | 相簿瀑布流／列表 | Gallery | [相簿](ALBUM_VIEWER_DESIGN.md) |
| S-16 | 圖片檢視覆蓋層 | Gallery | [相簿](ALBUM_VIEWER_DESIGN.md) |
| S-17 | 影片／字幕設定 | VideoViewer、Explorer | [影片](VIDEO_VIEWER_DESIGN.md) |

實際檔案連結見 [架構](ARCHITECTURE.md)。原 ASCII 線框與當時狀態見 [封存原稿](history/agent-docs-before-cleanup.md#ui-screen-catalog)；不要拿舊建立順序、CARD 設定位置或點擊行為覆蓋現行工作區。
