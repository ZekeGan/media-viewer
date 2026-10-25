# 技術現況

本頁為 2026-10-25 遷移前原型的歷史盤點，當時未執行專案或測試；其中程式路徑已封存。現行程式與檢查結果改見 [IMPLEMENTATION.md](IMPLEMENTATION.md)。

使用者明確指出現有程式是自行研究的早期原型，整體畫面和功能不足 50%，既有資料型別也未核定。未來設計請參考 [目標架構提案](TARGET_ARCHITECTURE.md)，不要把本頁現況當成範式。

## 入口與資料流

```text
Electron main (electron/main.ts)
  ├─ JsonStorage(app.getPath('userData'))
  ├─ FolderSyncService → 掃描資料夾
  ├─ ViewService → 組合 View／Folder／Column／Layout
  └─ IPC ← preload 的 window.electronApi
                   ↑
Next.js / React renderer (src/app/view、src/app/editor)
  └─ Zustand stores → 檢視與編輯畫面
```

- `electron/main.ts` 固定載入 `http://localhost:3000/view`。`electron.vite.config.ts` 只建置 main 和 preload；renderer 由 Next.js 處理。
- `electron/preload.ts` 暴露建立、列出、讀取與儲存視圖，以及選取資料夾的 API。`electron/ipc/` 接到 services。
- `electron/services/folderSyncService.ts` 遞迴掃描資料夾。`ViewService` 產生預設欄位與版面，讀取時組合各種資料。
- `electron/storage/JsonStorage.ts` 目前把資料寫在 Electron `userData/app-data`，**尚未在每個來源資料夾寫隱藏記錄**。
- `shared/main.ts` 定義 View、Folder、Column、Layout、Cell。`src/hooks/useLoadInitialData.ts` 將資料載入 Zustand；`src/app/view/page.tsx` 依版面顯示清單；`src/app/editor/` 是尚未完成的編輯器。

## 已知落差與待修正點

- 現有 `View` 接近產品所說的專案，但兩者資料契約尚未正式對齊。`Column` 以全域 `key` 儲存、`Cell` 只帶 `key`，不能安全表達重疊專案的同名異型別欄位：`shared/main.ts`、`electron/storage/JsonStorage.ts`。
- `getAllFolders()` 以 `for ... in` 遍歷檔名陣列，組出索引數字作檔名：`electron/storage/JsonStorage.ts`。
- 建立視圖的 IPC handler 沒有回傳 `service.createView(...)` 的 Promise；畫面建立後也沒有刷新視圖清單：`electron/ipc/view.ts`、`src/app/view/_containers/navBar.tsx`。
- 編輯頁的「儲存」呼叫 `createView('')`，表單以 view ID 查 layout，且編輯器渲染器未取得必要的 cells：`src/app/editor/page.tsx`、`src/app/editor/_containers/editArea.tsx`、`src/components/layoutItem/index.tsx`。
- `JsonStorage` 的 layout item 方法仍拋出 `Method not implemented`。SQLite 尚未實作：`electron/storage/JsonStorage.ts`、`package.json`。
- `PLAN.md` 與 `_abandon/` 保留舊構想及舊程式碼，不用來判定目前功能是否完成。

## 遷移方向（尚未執行）

保留 Electron main／preload／IPC 邊界，將 Next.js renderer 改為 React + Vite。需要改入口、路由、Next 專用 API／設定與建置腳本；不要把 UI 框架遷移與可攜資料格式遷移混成一次不可驗證的變更。先記錄基準與驗收，再分階段替換。

