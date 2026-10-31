# Media Viewer

> A local-first folder viewer with customizable layouts.

Media Viewer is an experimental desktop application for viewing folders as a customizable list. A project selects a root folder and scan depth, then defines how matching folders are displayed. It is not intended to manage or move those folders.

The main idea is to explore a different way of browsing file collections:

**Keep the data and presentation separate, and let the user decide how the data should be displayed.**

The project is currently in an **early development stage**.

Current version: **0.9.0** (see [changelog](CHANGELOG.md)). Start with the [documentation index](docs/README.md) and [current work](docs/WORK_ITEMS.md).

Run `pnpm install`, then `pnpm dev`. Commands and verification: [IMPLEMENTATION](docs/IMPLEMENTATION.md). Early POC design and stage records are kept in [docs/archive](docs/archive/) and are not current specs.

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

SQLite is implemented as a rebuildable local search index. The portable folder records and project definitions remain the source of truth:

```text
Folders ──→ portable folder records ──┐
                                      ├──→ project layout → UI components
Project root ──→ portable settings ───┘
                  │ both portable sources
                  └──→ SQLite search index (rebuildable)
```

The confirmed goal is to recover each managed folder's content on another device without the local database. Hidden portable records in individual folders are required so a folder can move independently; the app must also support individual and one-action cleanup across linked folders. Cleanup coverage and relinking details are still being designed; see [儲存與清理](docs/STORAGE_OPTIONS.md), [產品需求](docs/PRODUCT.md) and [設計草案](docs/archive/DESIGN_DRAFT.md).

---

## 🛠️ Tech Stack

The current implementation uses:

* Electron — Desktop application
* React 18 + Vite 7 — UI
* TypeScript — Type safety
* React hooks — POC client state
* SQLite — Rebuildable local index using Node SQLite
* Mantine 8 + plain CSS — UI and styling

The technology stack may change as the project evolves.

## Agent 開發交接

後續開發請先讀 [CLAUDE.md](CLAUDE.md)（Claude Code）或 [AGENTS.md](AGENTS.md)（Codex），再依 [文件索引](docs/README.md) 與 [當前工作](docs/WORK_ITEMS.md) 定位。產品邊界見 [產品需求](docs/PRODUCT.md)，已核定方向見 [DECISIONS](docs/DECISIONS.md)。早期構想、POC、階段與開發紀錄已封存於 [docs/archive](docs/archive/)，不是現行規格。

---

## 👤 Author

**Zeke Gan**

[GitHub](https://github.com/ZekeGan)

---

> **This project is an experiment. The implementation is expected to change.**



