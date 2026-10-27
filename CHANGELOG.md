# Changelog

The application version is independent of portable record `schemaVersion`.

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
