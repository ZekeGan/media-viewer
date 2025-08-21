- 遊戲檔案位置GAME_PATH
- TAG資料都放在APPDATA(C:\Users\你的使用者名稱\AppData\Roaming)中，跟著COMPANY_NAME(公司名稱)和PROJECT_NAME(專案名稱)

GAME_PATH=Z:/Game

COMPANY_NAME=Zeke

PROJECT_NAME=game-viewer

DOUJINSHI_PATH=Z:/Doujinshi

## Do To List

- Bug: 數量級大SideBar卡頓問題

- Feat: 圖片檢視doujinshi list(ex-hentai)
- Feat: 垂直閱讀，可以設定是否打開border(當背景為透明或上下圖片類似無法判斷每張圖片邊)
- Feat: 分類最愛(加入頁面/顯示使用次數etc...)
- Feat: view菜單快捷說明
- Feat: view設定按鈕(工具列不透明度/)
- Feat: setting新增關閉view的按鈕顯示(鍵盤功能依然正常)

- Ex: 顯示常用doujinshi
- Ex: 研究Blob和單純圖片之間的差別
- Ex: 研究如何把程式讓手機/平板也能使用
- Ex: 研議是否繼續使用APPDATA?
- Ex: 組件單獨拆除使用NPM??

### Done

- Bug: 打開側邊欄初始圖片沒有加載，滾動observer觸發後才會加載
- Bug: doujinshi detail page type顯示不完全
- Bug: 進入views後返回gallery後想回到list，會因為hash保留而無法上一頁
- Bug: 當從detail進入views，tool bar 有顯示的問題

- Feat: 寬度縮小時(隱藏/縮小/調位)圖片
- Feat: 搜尋Enter快捷鍵
- Feat: Nav樣式更改，整合Game nav link
- Feat: 搜尋doujin為無顯示找不到提示
- Feat: 更改detail每rows顯示數量
- Feat: 全局設置: doujinshi工具列不透明度
- Feat: view捨棄hover顯示工具列，用鍵盤來顯示工具列
- Feat: Doujinshi detail page 新增返回畫廊按鈕(麵包屑)

## Home Page

- 儀錶板
- 顯示統計資訊
- (動態?)圖表
- 天氣?
- 快速配置
- 資料夾(類似歌單)
- 上次登入時間
- 使用最多的東西
