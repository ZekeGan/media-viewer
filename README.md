# Media Viewer

> A local-first media and file viewer with customizable layouts.

Media Viewer is an experimental desktop application for organizing and viewing local files and media.

The main idea is to explore a different way of browsing file collections:

**Keep the data and presentation separate, and let the user decide how the data should be displayed.**

The project is currently in an **early development stage**.

Many parts of the application, including the UI, storage strategy, layout system, and feature set, are still being explored and may change significantly.

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

For example, different components can be used to display different types of data:

```text
String      → Text / Badge / Link
Number      → Stat / Progress / Rating
Boolean     → Checkbox / Switch / Status
Date        → Date / Relative Time
Array       → Tags / List / Chart
JSON        → Tree / Key-Value
File Path   → Image / Audio / Video
```

The long-term direction is to introduce **SQLite as a local data store and index**:

```text
Local Folder
     │
     ▼
    Data
     │
     ▼
   SQLite
     │
     ▼
   Layout
     │
     ▼
Components
```

This would allow the filesystem to remain the source of local files while SQLite handles application data and indexing.

---

## 🛠️ Tech Stack

The current implementation uses:

* Electron — Desktop application
* Next.js / React — UI
* TypeScript — Type safety
* Zustand — Client state management
* SQLite — Local indexing and metadata (in development)
* Mantine / Tailwind CSS — UI and styling

The technology stack may change as the project evolves.

---

## 👤 Author

**Zeke Gan**

[GitHub](https://github.com/ZekeGan)

---

> **This project is an experiment. The implementation is expected to change.**
