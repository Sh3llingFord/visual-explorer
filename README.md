# Visual Explorer

A card-based note browser for Obsidian. Displays notes as a visual list with image thumbnails, category tags, dates, and a text preview — making it easy to browse and navigate your vault.

## Features

- **Card view** — each note shows title, category, date, image thumbnail, and optional text preview
- **Folder navigation** — subfolders always appear at the top as clickable entries with a breadcrumb trail
- **Live search** — filter notes and folders by title or tag instantly
- **+ button → action menu:**
  - **Sort** — choose from 6 sort options with the active one highlighted (see below)
  - Favorites — shows all notes with `favorite: true` in frontmatter
  - Recently opened — shows the last N modified notes across the vault
  - New document — create a note directly in the current folder
  - Create folder — create a new subfolder
- **Sorting** — select directly in the toolbar, per view session:
  - Modified (newest → oldest / oldest → newest)
  - Created (newest → oldest / oldest → newest) — respects `date`/`created` frontmatter
  - Name (A → Z / Z → A) — applies to both notes and subfolders
- **Long-press (mobile) / right-click (desktop) → context menu on notes:**
  - Add / remove favorite
  - Rename
  - Move to folder — pick any vault folder from a searchable list
  - Open in new tab
  - Delete (with confirmation)
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

### Sorting
Tap the **+** button and select a sort option at the top of the menu. The active sort is marked with a checkmark. Sort state is per view session; the default is set in plugin settings.

| Option | Description |
|---|---|
| Modified (newest first) | Default — by last file modification |
| Modified (oldest first) | |
| Created (newest first) | Uses `date`/`created` frontmatter if present, otherwise filesystem time |
| Created (oldest first) | |
| Name (A–Z) | Alphabetical — applies to subfolders too |
| Name (Z–A) | |

### Actions via + button
- **Favorites** — shows all favorited notes
- **Recently opened** — shows the last N modified notes vault-wide
- **New document** — creates a note in the current folder
- **Create folder** — creates a new subfolder

### Actions via long-press / right-click on a note
- **Add / remove favorite** — sets `favorite: true` in frontmatter
- **Rename** — rename the file
- **Move to folder** — opens a searchable folder picker to move the note
- **Open in new tab** — opens the note in a new Obsidian tab
- **Delete** — moves the note to trash

## Settings

| Setting | Default | Description |
|---|---|---|
| Thumbnail size | 72px | Width and height of the image preview (40–160px) |
| Files folder | `Files` | Path to the folder containing images, relative to vault root |
| Default sort | Modified (newest first) | Default sort for new views |
| Date format | de-DE | de-DE / en-US / en-GB |
| Wrap title | Off | Allow long titles to wrap instead of being truncated |
| Language | German | German / English |
| Recent count | 30 | How many notes to show in "Recently opened" (5–100) |
| Show preview | On | Show the first lines of note content |
| Preview lines | 1 | Number of preview text lines (1 or 2) |
| Favorites first | Off | Show favorited notes at the top of the folder view |
| Breadcrumb font size | 12px | Font size of the breadcrumb path (10–18px) |

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
favorite: true
---
```

- `date` or `created` → displayed as the note date, and used for "Created" sort ordering
- `categories` or `tags` → first value displayed as `#category`
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
