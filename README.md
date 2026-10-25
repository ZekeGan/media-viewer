# Media Viewer

> A local-first folder viewer with customizable layouts.

Media Viewer is an experimental desktop application for viewing folders as a customizable list. A project selects a root folder and scan depth, then defines how matching folders are displayed. It is not intended to manage or move those folders.

The main idea is to explore a different way of browsing file collections:

**Keep the data and presentation separate, and let the user decide how the data should be displayed.**

The project is currently in an **early development stage**.

The Electron + React + Vite POC core flow and recovery work are implemented. See the [acceptance record](docs/POC_ACCEPTANCE.md) and [visual style options](docs/DESIGN_STYLE_OPTIONS.md). See [implementation, commands and remaining acceptance work](docs/IMPLEMENTATION.md). Run `pnpm install`, then `pnpm dev`. The [POC design](docs/POC_DESIGN_PACKAGE.md) and [wireframes](docs/POC_WIREFRAMES.md) describe the target; they are not a claim that all acceptance checks have passed.

---

## 💡 Concept

Traditional file managers usually provide a fixed set of views such as:

* List
* Grid
* Details

Media Viewer explores a more flexible approach where the **same data can be presented through different layouts**.

The current concept is:

```text
Local Folder
     │
     ▼
    Data
     │
     ▼
   Layout
     │
     ▼
Components
```

The layout determines which data is displayed and how it should be presented.

The following are possible future component types, not all POC requirements:

```text
String      → Text / Badge / Link
Number      → Stat / Progress / Rating
Boolean     → Checkbox / Switch / Status
Date        → Date / Relative Time
Array       → Tags / List / Chart
JSON        → Tree / Key-Value
File Path   → Image / Audio / Video
```

SQLite is the confirmed direction for a rebuildable local search index; it is not implemented yet. The portable folder records and project definitions remain the source of truth:

```text
Folders ──→ portable folder records ──┐
                                      ├──→ project layout → UI components
Project root ──→ portable settings ───┘
                  │ both portable sources
                  └──→ SQLite search index (rebuildable)
```

The confirmed goal is to recover each managed folder's content on another device without the local database. Hidden portable records in individual folders are required so a folder can move independently; the app must also support individual and one-action cleanup across linked folders. Cleanup coverage and relinking details are still being designed; see [儲存與清理](docs/STORAGE_OPTIONS.md), [產品需求](docs/PRODUCT.md) and [設計草案](docs/DESIGN_DRAFT.md).

---

## 🛠️ Tech Stack

The current implementation uses:

* Electron — Desktop application
* React 18 + Vite 7 — UI
* TypeScript — Type safety
* React hooks — POC client state
* SQLite — Planned local index; not implemented
* Mantine 8 + plain CSS — UI and styling

The technology stack may change as the project evolves.

## Agent 開發交接

後續開發請先讀 [AGENTS.md](AGENTS.md)。[專案定位](docs/PROJECT_OVERVIEW.md)、[已核定方向](docs/DECISIONS.md) 和[產品需求](docs/PRODUCT.md) 是交接基礎；[儲存與清理](docs/STORAGE_OPTIONS.md) 記錄每資料夾可攜方案，[資料夾與專案模型](docs/FOLDER_PROJECT_MODEL.md) 記錄跨專案共用值。[文件一致性稽核](docs/DOC_AUDIT.md)、[畫面與功能地圖](docs/SCREENS_AND_FEATURES.md)、[CELL 目錄](docs/CELL_CATALOG.md)、[未決設計](docs/OPEN_DECISIONS.md)、[外部資料補充](docs/METADATA_ENRICHMENT.md)、[搜尋設計](docs/SEARCH_DESIGN.md)、[積木編輯器](docs/EDITOR_DESIGN.md) 與 [路線圖](docs/ROADMAP.md) 安排後續審核。[技術現況](docs/ARCHITECTURE.md) 只描述原型；[目標架構](docs/TARGET_ARCHITECTURE.md)、[設計草案](docs/DESIGN_DRAFT.md)、[工作清單](docs/WORK_ITEMS.md) 與 [開發紀錄](docs/DEV_LOG.md) 供後續討論與實作。現有 `PLAN.md` 是早期構想，不能取代已確認需求。

---

## 👤 Author

**Zeke Gan**

[GitHub](https://github.com/ZekeGan)

---

> **This project is an experiment. The implementation is expected to change.**



