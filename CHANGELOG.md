# Changelog

The application version is independent of portable record `schemaVersion`.

## 0.6.0 — 2026-10-27

- Add group renaming, drag ordering and contextual hover actions in the project sidebar.
- Synchronize CARD/TABLE/TREE folder locations with backslash breadcrumbs; add draggable TABLE columns and collapsible TREE branches.
- Refine CARD display controls, folder settings tabs and advanced data-management options.
- Add CELL dividers, Delete-key removal, multiple optional image slots and clearer field/component palettes.
- Keep manga content layouts independent of CARD layouts; add validated Steam metadata preview/import alongside E-Hentai.
- Add project-removal previews, verified local recovery copies and safe cleanup of unused empty root metadata; preserve shared data, other projects and original media.
- Improve recreation/relink errors around missing folder records and archived project settings without silently replacing recoverable identities.
- Extend recognized game-runtime layouts and ancestor-boundary protection, including nested Tyrano deployments and macOS app bundles.
- Add progressive album/manga content loading, viewport-based gallery rendering and asynchronous thumbnail decoding over scoped media streams.
- Prioritize cached thumbnails, coalesce duplicate work, skip cancelled queued jobs and throttle cache maintenance; stabilize image geometry while scrolling.
- Improve manga fullscreen reading, zoom/pan, page selection and spread transitions; keep navigation icons fixed when RTL key bindings change.
- Add per-project video autoplay preferences, release playback sources on navigation and combine subtitle settings under an icon-only video settings menu.
- Remove resume prompts and full-video control shading; support horizontal mouse-wheel scrolling in the video strip.
- Simplify folder search, move advanced controls out of the primary flow and reduce routine success notifications.
- Remove the default TITLE field from new projects, retain existing data and expose F12 DevTools access.
- Update focused documentation and controlled-data regression, reader and gallery-performance coverage.

Portable record `schemaVersion` remains 1. No bulk migration of user collections is performed by this version bump.

Known limitations: some embedded NW.js and unpacked/mixed WOLF RPG layouts remain unrecognized. Native macOS game launching is not implemented; app-bundle detection does not imply launch support. See `docs/WORK_ITEMS.md` for outstanding work.

## 0.5.0 — 2026-10-27

- Add CARD-only layout presets and display controls, with multi-level/all-depth and single-level browsing.
- Keep TREE branches visible when opening content; retain folder-by-folder navigation in TABLE.
- Add independent content panes, persistent visibility, a root-content default and separate folder settings.
- Refine sidebar drag ordering, hover actions, combined settings and a neutral bottom create command.
- Separate folder selection from project creation; order the form by name, category, folder and group.
- Check folder records and game boundaries before navigation; never create records as a navigation side effect.
- Restore the game cover, custom actions and field-table layout.
- Add Chromium thumbnail decoding fallback, coalesced requests, recoverable caches and original-image fallback; extend image recognition to BMP, AVIF and ICO.
- Normalize fractional resize values before validating and saving workspace preferences.
- Exclude case-renamed metadata directories from all-depth scans on Windows.
- Preserve legacy scan limits until explicitly expanded; add optional, backward-compatible project/display preferences without bulk migration.

## 0.4.0 — prior milestone, backfilled on 2026-10-27

This development milestone previously remained at version 0.3.0. These notes
document the implemented work; no historical release or Git tag is implied.

- Introduce the desktop shell, project groups, favorites and manual ordering.
- Add CARD/TABLE/TREE browsing, typed fields, SQLite substring search, saved searches and batch edits.
- Add album/manga viewers, game detection/actions, video playback and SRT/VTT subtitles.
- Add E-Hentai metadata preview/import and portable media-specific preferences.
- Split heavy viewers into lazy-loaded chunks and retain portable records as the source of truth.

## 0.3.0 — initial POC

- Electron + React + Vite folder viewer, portable folder metadata and custom CELL layouts.
- Recovery, reconnect, cleanup and controlled-data acceptance tests.
