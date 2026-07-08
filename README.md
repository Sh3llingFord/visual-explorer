# Visual Explorer

A card-based note browser for Obsidian. Displays notes as a visual list with image thumbnails, category tags, dates, and a text preview — making it easy to browse and navigate your vault.

## Features

- **Card view** — each note shows title, category, date, image thumbnail, and optional text preview
- **Grid view** — toggle between the card list and an image-first grid layout directly in the toolbar; the choice is remembered **per folder** (with a global default in settings)
- **Configurable toolbar buttons** — choose which actions appear next to the search bar: sort, view toggle, new document, create folder, favorites, recently opened, settings
- **Cover layout** — notes can display a large cover image instead of a small thumbnail (always, or per tag)
- **Folder navigation** — subfolders always appear at the top as clickable entries with a breadcrumb trail
- **Live search** — filter notes and folders by title or tag instantly
- **Search scope toggle** — switch between searching only the current folder or the entire vault; at vault root the scope is always vault-wide
- **Tag chips** — clickable tag filters appear below the search bar when tags are present in the current view
- **+ button → action menu:**
  - **Sort** — choose from sort options with the active one highlighted (see below)
  - Favorites — shows all notes with `favorite: true` in frontmatter
  - Recently opened — shows the last N modified notes across the vault
  - New document — create a note directly in the current folder
  - Create folder — create a new subfolder
- **Sorting** — via the + menu, or an optional sort button in the toolbar (while the toolbar button is enabled, the + menu hides its sort entries automatically), per view session:
  - Modified (newest → oldest / oldest → newest)
  - Created (newest → oldest / oldest → newest) — respects `date`/`created` frontmatter
  - Name (A → Z / Z → A) — applies to both notes and subfolders
  - Title date (newest → oldest / oldest → newest) — parses a date at the start of the filename
- **Long-press (mobile) / right-click (desktop) → context menu on notes:**
  - Add / remove favorite
  - Rename
  - Move to folder — pick any vault folder from a searchable list
  - Archive — move note to the configured archive folder
  - Open in new tab
  - Delete (with confirmation)
- **Long-press (mobile) / right-click (desktop) → context menu on folders:**
  - New note here
  - Rename folder
  - Archive folder
  - Open in new tab
  - Delete folder (with confirmation)
- **Favorites** — marked with ★ in the list, stored as `favorite: true` in frontmatter (usable by other plugins like Dataview)
- **Note counter** — shows number of notes and subfolders in the toolbar
- **Auto-refresh** — gallery updates automatically when notes are added, modified, or deleted
- **State persistence** — remembers the open folder after restarting Obsidian
- **Ribbon icon + command** — open the explorer without right-clicking a folder
- **Multilingual** — German and English UI
- **Mobile compatible** — works on Android and iOS

## Installation

### Via BRAT (recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) from the Obsidian Community Plugins browser
2. Open BRAT settings → **Add Beta Plugin**
3. Enter: `https://github.com/Sh3llingFord/obsidian-note-gallery`
4. Enable the plugin under **Settings → Community Plugins**

### Manual installation

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/Sh3llingFord/obsidian-note-gallery/releases/latest)
2. Create a folder `.obsidian/plugins/visual-explorer/` in your vault
3. Copy both files into that folder
4. Enable the plugin under **Settings → Community Plugins**

## Usage

### Opening the explorer
- **Right-click any folder** in the file explorer → "Als Galerie öffnen" / "Open as gallery"
- **Ribbon icon** (left sidebar) → opens the explorer at vault root
- **Command palette** → "Visual Explorer öffnen" / "Open Visual Explorer"

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
When notes in the current view have `tags` or `categories` in their frontmatter, clickable tag chips appear below the search bar. Clicking a chip sets it as the search query; clicking again clears it.

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

### Cover layout
Notes can be displayed with a large cover image spanning the full card width instead of a small thumbnail. This is configured via **Settings → Cover layout**:

- **Off** — standard thumbnail layout for all notes
- **By tag** — only notes with the configured cover tag use the cover layout
- **Always** — all notes with an image use the cover layout

### Actions via + button
- **Favorites** — shows all favorited notes
- **Recently opened** — shows the last N modified notes vault-wide
- **New document** — creates a note in the current folder
- **Create folder** — creates a new subfolder

### Toolbar buttons
The buttons between the search bar and the + button are configurable via **Settings → Toolbar**. Available actions: Sort, View toggle (list/grid), New document, Create folder, Favorites, Recently opened, Open settings. By default only the view toggle is enabled.

### Per-folder view memory
The list/grid toggle remembers the choice **per folder**: switch the photography folder to grid and it stays grid, while other folders keep their own view. Folders without an explicit choice use the **Default view** from settings. In the Favorites and Recently opened views the toggle changes the global default.

### Actions via long-press / right-click on a note
- **Add / remove favorite** — sets `favorite: true` in frontmatter
- **Rename** — rename the file
- **Move to folder** — opens a searchable folder picker to move the note
- **Archive** — moves the note to the configured archive folder
- **Open in new tab** — opens the note in a new Obsidian tab
- **Delete** — moves the note to trash

### Actions via long-press / right-click on a folder
- **New note here** — creates a note directly inside that folder
- **Rename** — rename the folder
- **Archive** — moves the folder to the configured archive folder
- **Open in new tab** — opens the folder in a new Visual Explorer tab
- **Delete** — moves the folder and all its contents to trash

## Settings

| Setting | Default | Description |
|---|---|---|
| Language | German | German / English |
| Date format | de-DE | de-DE / en-US / en-GB |
| Open on startup | Off | Automatically open Visual Explorer when Obsidian starts |
| Show preview | On | Show the first lines of note content |
| Preview lines | 1 | Number of preview text lines (1 or 2) |
| Favorites first | Off | Show favorited notes at the top of the folder view |
| Wrap title | Off | Allow long titles to wrap instead of being truncated |
| Thumbnail size | 72px | Width and height of the image preview (40–160px) |
| Cover layout | By tag | Off / By tag / Always |
| Cover tag | `vec` | Tag that triggers the cover layout (only relevant for "By tag") |
| Files folder | `Files` | Path to the folder containing images, relative to vault root |
| Archive folder | `Archiv` | Destination folder for the Archive action, relative to vault root |
| Default view | List | View for folders without their own list/grid choice |
| Default sort | Modified (newest first) | Default sort for new views |
| Title date format | dd.mm.yyyy | Date format parsed from the start of filenames for "Title date" sort |
| Recent count | 30 | How many notes to show in "Recently opened" (5–100) |
| Breadcrumb font size | 12px | Font size of the breadcrumb path (10–18px) |

### Toolbar
Each toolbar button can be individually shown or hidden in settings:
Sort, View toggle, New document, Create folder, Favorites, Recently opened, Open settings.

### Menu content
Each entry in the **+** menu can be individually shown or hidden in settings:
Sort, Favorites, Recently opened, New document, Create folder, Open settings.

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
git clone https://github.com/Sh3llingFord/obsidian-note-gallery.git
cd obsidian-note-gallery
npm install --save-dev typescript esbuild obsidian@latest
node esbuild.config.mjs
```

Releases are built automatically via GitHub Actions on every push to `main`.

## License

MIT
