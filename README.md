# Visual Explorer

A card-based note browser for Obsidian. Displays notes as a visual list or gallery with image thumbnails, category tags, dates, and a text preview — making it easy to browse and navigate your vault. Can run as a workspace tab or docked in the sidebar like the native file explorer.

<img width="850" height="480" alt="Bildschirmfoto 2026-07-09 um 20 47 50" src="https://github.com/user-attachments/assets/f49bf721-56d1-4c1e-8714-15b79d2ce8a0" />
<img width="850" height="480" alt="Bildschirmfoto 2026-07-09 um 20 48 05" src="https://github.com/user-attachments/assets/b35b1678-2b96-4f84-bc7e-d9d2fc4de9bf" />
<img width="850" height="480" alt="Bildschirmfoto 2026-07-09 um 20 48 17" src="https://github.com/user-attachments/assets/d38e89f8-1dd0-4250-ab6a-78ebd076400f" />



## Features

- **Three view modes** — list (cards or a compact flat style), an image-first grid, and widescreen (one full-width 16:9 image per row); cycle with the toolbar button, remembered **per folder**
- **Sidebar mode** — dock the gallery in the left sidebar instead of a tab; on mobile it shows up in the slide-in panel next to the file explorer
- **Configurable toolbar buttons** — choose which actions appear next to the search bar: sort, view toggle, new document, create folder, favorites, recently opened, settings
- **Folder navigation** — subfolders appear at the top as clickable entries with a breadcrumb trail and an optional file count next to the name
- **Live search** — filter notes and folders by title or tag instantly
- **Search scope toggle** — switch between searching only the current folder or the entire vault; at vault root the scope is always vault-wide
- **Tag chips** — clickable tag filters above the list, sourced from the current view or the whole vault (configurable, or turned off)
- **+ button → action menu:**
  - **Sort** — choose from sort options with the active one highlighted (see below)
  - View toggle — cycle between list, grid and widescreen
  - Favorites — shows all notes with `favorite: true` in frontmatter
  - Recently opened — shows the last N modified notes across the vault
  - New document — create a note directly in the current folder
  - Create folder — create a new subfolder
  - Every entry is hidden automatically while its toolbar button is enabled — actions are never duplicated and never lost
- **Sorting** — via the + menu, or an optional sort button in the toolbar (while the toolbar button is enabled, the + menu hides its sort entries automatically), per view session:
  - Modified (newest → oldest / oldest → newest)
  - Created (newest → oldest / oldest → newest) — respects `date`/`created` frontmatter
  - Name (A → Z / Z → A) — applies to both notes and subfolders
  - Title date (newest → oldest / oldest → newest) — parses a date at the start of the filename
- **Long-press (mobile) / right-click (desktop) → context menu on notes:**
  - Add / remove favorite
  - Rename
  - Move to folder — pick any vault folder from a searchable list
  - Create folder — create a new subfolder in the current location
  - Archive — move note to the configured archive folder
  - Open in new tab
  - Delete (with confirmation)
- **Long-press (mobile) / right-click (desktop) → context menu on folders:**
  - New note here
  - Create folder — create a subfolder inside it
  - Rename folder
  - Archive folder
  - Open in new tab
  - Delete folder (with confirmation)
- **Favorites** — marked with ★ in the list, stored as `favorite: true` in frontmatter (usable by other plugins like Dataview)
- **Settings backup** — export all plugin settings to a file in the vault and import them back; survives uninstalling the plugin and syncs with the vault
- **Note counter** — shows number of notes and subfolders in the toolbar
- **Auto-refresh** — gallery updates automatically when notes are added, modified, or deleted
- **State persistence** — remembers the open folder after restarting Obsidian
- **Ribbon icon + command** — open the explorer without right-clicking a folder
- **Multilingual** — German and English UI
- **Mobile compatible** — works on Android and iOS

## Installation

### Community Plugins (recommended)

1. Open **Settings → Community plugins → Browse**
2. Search for "Visual Explorer"
3. Click **Install**, then **Enable**

### Manual installation

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Sh3llingFord/visual-explorer/releases/latest)
2. Create a folder `.obsidian/plugins/visual-explorer/` in your vault
3. Copy the three files into that folder
4. Enable the plugin under **Settings → Community Plugins**

## Usage

### Opening the explorer
- **Right-click any folder** in the file explorer → "Als Galerie öffnen" / "Open as gallery"
- **Ribbon icon** (left sidebar) → opens the explorer at vault root
- **Command palette** → "Visual Explorer öffnen" / "Open Visual Explorer"

### Sidebar mode
By default the gallery opens as a workspace tab. Set **Settings → Visual Explorer → Open in** to **Left sidebar** to dock it in the left sidebar instead — the ribbon icon, command and folder context menu then all open (and reuse) a single gallery leaf there, right next to the native file explorer. On mobile, that's the slide-in panel at the bottom of the left drawer. Opening a note always opens it in a new tab in the main area, never inside the sidebar leaf.

### Navigation
- **Subfolders** appear at the top with a › chevron and bold name — click to navigate into them
- **Breadcrumb** at the top left shows the current path — click any segment to go back
- **Search field** filters notes and folders live by title or tag

### Search scope toggle
Next to the search field is a scope button:

| Icon | State | Behaviour |
|---|---|---|
| Folder | Folder scope | Only searches notes in the current folder (recursively) |
| Globe | Vault-wide | Searches all notes across the entire vault |

At vault root the button always shows the globe icon — the scope is vault-wide there by default and cannot be changed (root already covers the whole vault).

### Tag chips
When notes in the current view (or the whole vault, depending on settings) have `tags` or `categories` in their frontmatter, clickable tag chips appear below the search bar. Clicking a chip sets it as the search query; clicking again clears it.

### Sorting
Select a sort option at the top of the **+** menu — or enable the **sort button** (↑↓) in Settings → Toolbar. While the toolbar sort button is enabled, the sort entries are hidden from the + menu automatically, so they never appear twice. The active sort is marked with a checkmark. Sort state is per view session; the default is set in plugin settings.

| Option | Description |
|---|---|
| Modified (newest first) | Default — by last file modification |
| Modified (oldest first) | |
| Created (newest first) | Uses `date`/`created` frontmatter if present, otherwise filesystem time |
| Created (oldest first) | |
| Name (A–Z) | Alphabetical — applies to subfolders too |
| Name (Z–A) | |
| Title date (newest first) | Parses a date at the start of the filename (configurable format) |
| Title date (oldest first) | |

### View modes
The view toggle cycles through three modes:

- **List** — cards (or, with the compact card style, flat rows with separator lines) showing title, date, category, preview and thumbnail
- **Grid** — square image tiles, two or more per row depending on width
- **Widescreen** — one note per row with a full-width 16:9 image

The choice is remembered **per folder**: switch the photography folder to grid and it stays grid, while other folders keep their own view. Folders without an explicit choice use the **Default view** from settings. In the Favorites and Recently opened views the toggle changes the global default.

### Actions via + button
- **Favorites** — shows all favorited notes
- **Recently opened** — shows the last N modified notes vault-wide
- **New document** — creates a note in the current folder
- **Create folder** — creates a new subfolder

### Toolbar buttons
The buttons between the search bar and the + button are configurable via **Settings → Toolbar**. Available actions: Sort, View toggle (list/grid/widescreen), New document, Create folder, Favorites, Recently opened, Open settings. By default only the view toggle is enabled.

### Actions via long-press / right-click on a note
- **Add / remove favorite** — sets `favorite: true` in frontmatter
- **Rename** — rename the file
- **Move to folder** — opens a searchable folder picker to move the note
- **Create folder** — creates a new subfolder in the current location
- **Archive** — moves the note to the configured archive folder
- **Open in new tab** — opens the note in a new Obsidian tab
- **Delete** — moves the note to trash

### Actions via long-press / right-click on a folder
- **New note here** — creates a note directly inside that folder
- **Create folder** — creates a subfolder inside it
- **Rename** — rename the folder
- **Archive** — moves the folder to the configured archive folder
- **Open in new tab** — opens the folder in a new Visual Explorer tab
- **Delete** — moves the folder and all its contents to trash

### Settings backup
Under **Settings → Visual Explorer → Backup**:
- **Export settings** — writes all plugin settings to `visual-explorer-settings.json` in the vault root. This file survives uninstalling the plugin (which deletes its own data) and syncs along with the rest of the vault.
- **Import settings** — reads that file back and applies it, useful after reinstalling the plugin or setting it up on another device.

## Settings

| Setting | Default | Description |
|---|---|---|
| Language | German | German / English |
| Date format | de-DE | de-DE / en-US / en-GB |
| Open on startup | Off | Automatically open Visual Explorer when Obsidian starts |
| Open in | Tab | Where the gallery opens: a workspace tab, or the left sidebar (shows up in the slide-in panel on mobile) |
| Open favorites & recent in | Current view | Whether favorites/recent replace the current view or open in a new tab |
| Card style | Cards | Cards with border and background, or a compact list with separator lines |
| Folder file count | On | Show the number of files (and subfolders) next to the folder name |
| Tag chips | Current view | Which tags appear as clickable chips: current view, whole vault, or off |
| Show preview | On | Show the first lines of note content |
| Preview lines | 1 | Number of preview text lines (1 or 2) |
| Favorites first | Off | Show favorited notes at the top of the folder view |
| Wrap title | Off | Allow long titles to wrap instead of being truncated |
| Thumbnail size | 72px | Width and height of the image preview (40–160px) |
| Files folder | `Files` | Path to the folder containing images, relative to vault root |
| Archive folder | `Archiv` | Destination folder for the Archive action, relative to vault root |
| Default view | List | List / Grid / Widescreen — for folders without their own choice |
| Default sort | Modified (newest first) | Default sort for new views |
| Title date format | dd.mm.yyyy | Date format parsed from the start of filenames for "Title date" sort |
| Recent count | 30 | How many notes to show in "Recently opened" (5–100) |
| Breadcrumb font size | 12px | Font size of the breadcrumb path (10–18px) |

### Toolbar
Each toolbar button can be individually shown or hidden in settings:
Sort, View toggle, New document, Create folder, Favorites, Recently opened, Open settings.

### Menu content
Each entry in the **+** menu can be individually shown or hidden in settings:
Sort, View toggle, Favorites, Recently opened, New document, Create folder, Open settings.
An entry is hidden automatically while its toolbar button is enabled.

## Image support

The plugin extracts the first image from each note and supports both formats:

```
![[Files/image.png]]        (Obsidian wiki-link style)
![](Files/image.png)        (Standard Markdown style)
```

URL-encoded filenames (e.g. `image%20135.png`) are decoded automatically.

## Frontmatter support

The plugin reads the following frontmatter fields:

```yaml
---
date: 2024-10-13 14:57:15
created: 2024-10-13 14:57:07
categories:
  - Photography
tags:
  - journal
favorite: true
---
```

- `date` or `created` → displayed as the note date, and used for "Created" sort ordering
- `categories` or `tags` → first value displayed as `#category`; both are also used for tag chips and search filtering
- `favorite: true` → note is marked with ★ and appears in the Favorites view (also usable by Dataview and other plugins)

## Building from source

Requirements: Node.js v18+, npm

```bash
git clone https://github.com/Sh3llingFord/visual-explorer.git
cd visual-explorer
npm install --save-dev typescript esbuild obsidian@latest
node esbuild.config.mjs
```

Releases are built automatically via GitHub Actions on every push to `main`.

## License

MIT
