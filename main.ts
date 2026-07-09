import {
  App,
  Plugin,
  TFile,
  TFolder,
  ItemView,
  WorkspaceLeaf,
  PluginSettingTab,
  Setting,
  Modal,
  Notice,
  Menu,
  AbstractInputSuggest,
  debounce,
  normalizePath,
  setIcon,
} from "obsidian";

const VIEW_TYPE = "visual-explorer";

type TitleDateFormat = "dd.mm.yyyy" | "yyyy.mm.dd" | "mm.dd.yyyy" | "dd-mm-yyyy" | "yyyy-mm-dd" | "mm-dd-yyyy";

interface NoteGallerySettings {
  thumbnailSize: number;
  filesFolder: string;
  dateLocale: string;
  sortBy: "modified-desc" | "modified-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc" | "title-date-desc" | "title-date-asc";
  titleDateFormat: TitleDateFormat;
  titleWrap: boolean;
  language: "de" | "en";
  recentCount: number;
  showPreview: boolean;
  breadcrumbFontSize: number;
  previewLines: 1 | 2;
  sortFavoritesFirst: boolean;
  openOnStartup: boolean;
  menuShowSort: boolean;
  menuShowViewToggle: boolean;
  menuShowFavorites: boolean;
  menuShowRecent: boolean;
  menuShowNewDoc: boolean;
  menuShowCreateFolder: boolean;
  menuShowOpenSettings: boolean;
  archiveFolder: string;
  coverMode: "off" | "tag" | "always";
  coverTag: string;
  viewMode: "list" | "grid";
  toolbarShowSort: boolean;
  toolbarShowViewToggle: boolean;
  toolbarShowNewDoc: boolean;
  toolbarShowCreateFolder: boolean;
  toolbarShowFavorites: boolean;
  toolbarShowRecent: boolean;
  toolbarShowOpenSettings: boolean;
  folderViewModes: Record<string, "list" | "grid">;
}

const DEFAULT_SETTINGS: NoteGallerySettings = {
  thumbnailSize: 72,
  filesFolder: "Files",
  dateLocale: "de-DE",
  sortBy: "modified-desc",
  titleDateFormat: "dd.mm.yyyy",
  titleWrap: false,
  language: "de",
  recentCount: 30,
  showPreview: true,
  breadcrumbFontSize: 12,
  previewLines: 1,
  sortFavoritesFirst: false,
  openOnStartup: false,
  menuShowSort: true,
  menuShowViewToggle: true,
  menuShowFavorites: true,
  menuShowRecent: true,
  menuShowNewDoc: true,
  menuShowCreateFolder: true,
  menuShowOpenSettings: true,
  archiveFolder: "Archiv",
  coverMode: "tag",
  coverTag: "vec",
  viewMode: "list",
  toolbarShowSort: false,
  toolbarShowViewToggle: true,
  toolbarShowNewDoc: false,
  toolbarShowCreateFolder: false,
  toolbarShowFavorites: false,
  toolbarShowRecent: false,
  toolbarShowOpenSettings: false,
  folderViewModes: {},
};

const STRINGS = {
  de: {
    search: "Suchen…",
    recent: "Zuletzt geöffnet",
    newDoc: "Neues Dokument",
    favorites: "Favoriten",
    createFolder: "Ordner erstellen",
    addFavorite: "Favorit hinzufügen",
    removeFavorite: "Favorit entfernen",
    rename: "Umbenennen",
    delete: "Löschen",
    back: "← Ordner",
    deleteTitle: "Notiz löschen?",
    deleteConfirm: (name: string) => `"${name}" wird in den Papierkorb verschoben.`,
    cancel: "Abbrechen",
    renameTitle: "Notiz umbenennen",
    renameConfirm: "Umbenennen",
    createFolderTitle: "Neuen Ordner erstellen",
    createFolderPlaceholder: "Ordnername",
    createFolderConfirm: "Erstellen",
    notes: "Notizen",
    files: "Dateien",
    subfolders: "Unterordner",
    deleted: (name: string) => `"${name}" gelöscht`,
    newNote: (date: string) => `Neue Notiz ${date}`,
    renameFolder: "Ordner umbenennen",
    deleteFolder: "Ordner löschen",
    newNoteInFolder: "Neue Notiz hier",
    deleteFolderTitle: "Ordner löschen?",
    deleteFolderConfirm: (name: string) => `"${name}" und alle Inhalte werden in den Papierkorb verschoben.`,
    actions: "Aktionen",
    error: "Fehler",
    openGallery: "Visual Explorer öffnen",
    openGalleryCommand: "Galerie öffnen",
    openAsGallery: "Als Galerie öffnen",
    stThumbSize: "Thumbnail-Größe",
    stThumbSizeDesc: "Breite und Höhe des Vorschaubilds in Pixeln",
    stFilesFolder: "Dateien-Ordner",
    stFilesFolderDesc: "Pfad zum Ordner mit Bilddateien (relativ zum Vault-Root)",
    sort: "Sortierung",
    sortModified: "Geändert",
    sortCreated: "Erstellt",
    sortName: "Name",
    sortTitleDate: "Titeldatum",
    sortNone: "Keine Sortierung",
    stSortBy: "Sortierung",
    stSortByDesc: "Standard-Sortierung für neue Ansichten",
    stSortModified: "Geändert (neu → alt)",
    stSortCreatedDesc: "Erstellt (neu → alt)",
    stSortCreatedAsc: "Erstellt (alt → neu)",
    stSortModifiedAsc: "Geändert (alt → neu)",
    stSortNameAsc: "Name (A–Z)",
    stSortNameDesc: "Name (Z–A)",
    stSortTitleDateDesc: "Titeldatum (neu → alt)",
    stSortTitleDateAsc: "Titeldatum (alt → neu)",
    stTitleDateFormat: "Datumsformat im Titel",
    stTitleDateFormatDesc: "Format des Datums am Anfang des Notiztitels, z. B. für Notizen wie '16.06.2026 Meeting' (nur für die Sortierung 'Titeldatum' relevant).",
    stDateLocale: "Datumsformat",
    stDateLocaleDesc: "Sprache für die Datumsanzeige",
    stTitleWrap: "Titel umbrechen",
    stTitleWrapDesc: "Lange Titel umbrechen statt abschneiden",
    stRecentCount: "Anzahl \"Zuletzt geöffnet\"",
    stRecentCountDesc: "Wie viele Notizen unter \"Zuletzt geöffnet\" angezeigt werden",
    stShowPreview: "Vorschautext anzeigen",
    stShowPreviewDesc: "Ersten Zeilen der Notiz unterhalb des Datums anzeigen",
    stBreadcrumbSize: "Breadcrumb-Schriftgröße",
    stBreadcrumbSizeDesc: "Schriftgröße des Breadcrumb-Pfads in Pixeln",
    stPreviewLines: "Vorschautext-Zeilen",
    stPreviewLinesDesc: "Wie viele Zeilen des Vorschautexts angezeigt werden (1 oder 2)",
    stSortFavFirst: "Favoriten zuerst",
    stSortFavFirstDesc: "Favoriten werden in der Ordneransicht oben angezeigt",
    stOpenOnStartup: "Beim Start öffnen",
    stOpenOnStartupDesc: "Visual Explorer automatisch beim Start von Obsidian öffnen",
    stSectionGeneral: "Allgemein",
    stSectionCard: "Kartenanzeige",
    stSectionSort: "Sortierung & Ansichten",
    stSectionMenu: "Menü-Inhalt",
    stMenuItemDesc: "Diesen Eintrag im \"+\"-Menü anzeigen. Er wird automatisch ausgeblendet, solange der passende Toolbar-Button aktiv ist.",
    stSectionNav: "Navigation & Layout",
    openSettings: "Einstellungen öffnen",
    openInNewTab: "In neuem Tab öffnen",
    moveNote: "In Ordner verschieben",
    moveNoteTitle: "Notiz verschieben",
    moveNoteSearch: "Ordner suchen…",
    moved: (name: string, folder: string) => `"${name}" verschoben nach ${folder}`,
    archive: "Archivieren",
    archived: (name: string, folder: string) => `"${name}" archiviert in ${folder}`,
    archiveFolderNotSet: "Kein Archiv-Ordner konfiguriert. Bitte in den Einstellungen festlegen.",
    stArchiveFolder: "Archiv-Ordner",
    stArchiveFolderDesc: "Pfad des Ordners, in den Notizen per Kontextmenü archiviert werden (relativ zum Vault-Root)",
    stCoverMode: "Cover-Layout",
    stCoverModeDesc: "Großes Titelbild statt kleinem Thumbnail",
    stCoverModeOff: "Aus",
    stCoverModeTag: "Per Tag",
    stCoverModeAlways: "Immer",
    stCoverTag: "Cover-Tag",
    stCoverTagDesc: "Notizen mit diesem Tag erhalten das Cover-Layout (nur bei \"Per Tag\")",
    searchVaultTooltip: "Im ganzen Vault suchen",
    searchFolderTooltip: "Nur im aktuellen Ordner suchen",
    viewAsList: "Als Liste anzeigen",
    viewAsGrid: "Als Raster anzeigen",
    stSectionToolbar: "Toolbar",
    stToolbarItemDesc: "Diesen Button in der Toolbar anzeigen. Solange er aktiv ist, wird der passende Eintrag im \"+\"-Menü automatisch ausgeblendet.",
    stDefaultView: "Standard-Ansicht",
    stDefaultViewDesc: "Ansicht für Ordner ohne eigene Wahl. Der Toolbar-Umschalter merkt sich die Ansicht pro Ordner.",
    stViewList: "Liste",
    stViewGrid: "Raster",
    stViewToggle: "Ansicht umschalten (Liste/Raster)",
  },
  en: {
    search: "Search…",
    recent: "Recently opened",
    newDoc: "New document",
    favorites: "Favorites",
    createFolder: "Create folder",
    addFavorite: "Add to favorites",
    removeFavorite: "Remove from favorites",
    rename: "Rename",
    delete: "Delete",
    back: "← Folder",
    deleteTitle: "Delete note?",
    deleteConfirm: (name: string) => `"${name}" will be moved to trash.`,
    cancel: "Cancel",
    renameTitle: "Rename note",
    renameConfirm: "Rename",
    createFolderTitle: "Create new folder",
    createFolderPlaceholder: "Folder name",
    createFolderConfirm: "Create",
    notes: "Notes",
    files: "Files",
    subfolders: "Subfolders",
    deleted: (name: string) => `"${name}" deleted`,
    newNote: (date: string) => `New note ${date}`,
    renameFolder: "Rename folder",
    deleteFolder: "Delete folder",
    newNoteInFolder: "New note here",
    deleteFolderTitle: "Delete folder?",
    deleteFolderConfirm: (name: string) => `"${name}" and all its contents will be moved to trash.`,
    actions: "Actions",
    error: "Error",
    openGallery: "Open Visual Explorer",
    openGalleryCommand: "Open gallery",
    openAsGallery: "Open as gallery",
    stThumbSize: "Thumbnail size",
    stThumbSizeDesc: "Width and height of the preview image in pixels",
    stFilesFolder: "Files folder",
    stFilesFolderDesc: "Path to the folder with image files (relative to vault root)",
    sort: "Sort",
    sortModified: "Modified",
    sortCreated: "Created",
    sortName: "Name",
    sortTitleDate: "Title date",
    sortNone: "No sorting",
    stSortBy: "Sort by",
    stSortByDesc: "Default sort for new views",
    stSortModified: "Modified (newest first)",
    stSortCreatedDesc: "Created (newest first)",
    stSortCreatedAsc: "Created (oldest first)",
    stSortModifiedAsc: "Modified (oldest first)",
    stSortNameAsc: "Name (A–Z)",
    stSortNameDesc: "Name (Z–A)",
    stSortTitleDateDesc: "Title date (newest first)",
    stSortTitleDateAsc: "Title date (oldest first)",
    stTitleDateFormat: "Title date format",
    stTitleDateFormatDesc: "Format of the date at the start of note titles, e.g. for notes like '16.06.2026 Meeting' (only relevant for the 'Title date' sort).",
    stDateLocale: "Date format",
    stDateLocaleDesc: "Language for date display",
    stTitleWrap: "Wrap title",
    stTitleWrapDesc: "Allow long titles to wrap instead of truncating",
    stRecentCount: "Recently opened count",
    stRecentCountDesc: "How many notes to show under \"Recently opened\"",
    stShowPreview: "Show preview",
    stShowPreviewDesc: "Show the first lines of the note below the date",
    stBreadcrumbSize: "Breadcrumb font size",
    stBreadcrumbSizeDesc: "Font size of the breadcrumb path in pixels",
    stPreviewLines: "Preview text lines",
    stPreviewLinesDesc: "How many lines of preview text to show (1 or 2)",
    stSortFavFirst: "Favorites first",
    stSortFavFirstDesc: "Show favorites at the top of the folder view",
    stOpenOnStartup: "Open on startup",
    stOpenOnStartupDesc: "Automatically open Visual Explorer when Obsidian starts",
    stSectionGeneral: "General",
    stSectionCard: "Card Display",
    stSectionSort: "Sorting & Views",
    stSectionMenu: "Menu content",
    stMenuItemDesc: "Show this entry in the \"+\" menu. It is hidden automatically while the matching toolbar button is enabled.",
    stSectionNav: "Navigation & Layout",
    openSettings: "Open settings",
    openInNewTab: "Open in new tab",
    moveNote: "Move to folder",
    moveNoteTitle: "Move note",
    moveNoteSearch: "Search folders…",
    moved: (name: string, folder: string) => `"${name}" moved to ${folder}`,
    archive: "Archive",
    archived: (name: string, folder: string) => `"${name}" archived to ${folder}`,
    archiveFolderNotSet: "No archive folder configured. Please set one in the plugin settings.",
    stArchiveFolder: "Archive folder",
    stArchiveFolderDesc: "Path of the folder notes are moved to when archived via the context menu (relative to vault root)",
    stCoverMode: "Cover layout",
    stCoverModeDesc: "Large cover image instead of a small thumbnail",
    stCoverModeOff: "Off",
    stCoverModeTag: "By tag",
    stCoverModeAlways: "Always",
    stCoverTag: "Cover tag",
    stCoverTagDesc: "Notes with this tag use the cover layout (only with \"By tag\")",
    searchVaultTooltip: "Search the whole vault",
    searchFolderTooltip: "Search the current folder only",
    viewAsList: "Show as list",
    viewAsGrid: "Show as grid",
    stSectionToolbar: "Toolbar",
    stToolbarItemDesc: "Show this button in the toolbar. While it is enabled, the matching entry in the \"+\" menu is hidden automatically.",
    stDefaultView: "Default view",
    stDefaultViewDesc: "View for folders without their own choice. The toolbar toggle remembers the view per folder.",
    stViewList: "List",
    stViewGrid: "Grid",
    stViewToggle: "Toggle view (list/grid)",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function extractFirstImage(content: string): string | null {
  const wikiMatch = content.match(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp))[^\]]*\]\]/i);
  if (wikiMatch) return wikiMatch[1];
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+\.(png|jpg|jpeg|gif|webp))[^)]*\)/i);
  if (mdMatch) return decodeURIComponent(mdMatch[1]);
  return null;
}

function extractPreviewText(content: string): string {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");
  const withoutImages = withoutFrontmatter
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  const plain = withoutImages
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\n+/g, " ")
    .trim();
  return plain.slice(0, 120) + (plain.length > 120 ? "…" : "");
}

function extractCategories(frontmatter: Record<string, unknown>): string {
  const cats = frontmatter?.categories;
  if (Array.isArray(cats) && cats.length > 0) return cats.map((c: unknown) => "#" + c).join(" · ");
  const tags = frontmatter?.tags;
  if (Array.isArray(tags) && tags.length > 0) return tags.map((t: unknown) => "#" + t).join(" · ");
  return "";
}

function getEffectiveCreatedTime(file: TFile, app: App): number {
  const raw = app.metadataCache.getFileCache(file)?.frontmatter;
  const val = raw?.date || raw?.created;
  if (val) {
    const d = new Date(String(val));
    if (!isNaN(d.getTime())) return d.getTime();
  }
  return file.stat.ctime;
}

const TITLE_DATE_FORMATS: Record<TitleDateFormat, { order: ("d" | "m" | "y")[]; sep: string }> = {
  "dd.mm.yyyy": { order: ["d", "m", "y"], sep: "." },
  "yyyy.mm.dd": { order: ["y", "m", "d"], sep: "." },
  "mm.dd.yyyy": { order: ["m", "d", "y"], sep: "." },
  "dd-mm-yyyy": { order: ["d", "m", "y"], sep: "-" },
  "yyyy-mm-dd": { order: ["y", "m", "d"], sep: "-" },
  "mm-dd-yyyy": { order: ["m", "d", "y"], sep: "-" },
};

function getTitleDateTime(file: TFile, format: TitleDateFormat): number | null {
  const { order, sep } = TITLE_DATE_FORMATS[format];
  const re = new RegExp(`^(\\d{2,4})\\${sep}(\\d{2})\\${sep}(\\d{2,4})`);
  const match = file.basename.match(re);
  if (!match) return null;
  const parts: Record<string, number> = {};
  order.forEach((key, i) => { parts[key] = parseInt(match[i + 1], 10); });
  const { d, m, y } = parts as { d: number; m: number; y: number };
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date.getTime();
}

function formatDate(frontmatter: Record<string, unknown>, file: TFile, locale: string): string {
  const raw = frontmatter?.date || frontmatter?.created;
  if (raw) {
    const d = new Date(String(raw));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
  }
  return new Date(file.stat.mtime).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function isFavorite(frontmatter: Record<string, unknown>): boolean {
  return frontmatter?.favorite === true;
}

// ── Modals ───────────────────────────────────────────────────────────────────

class ConfirmDeleteModal extends Modal {
  private fileName: string;
  private onConfirm: () => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, fileName: string, s: typeof STRINGS["de"], onConfirm: () => void) {
    super(app);
    this.fileName = fileName;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.deleteTitle });
    contentEl.createEl("p", { text: this.s.deleteConfirm(this.fileName) });
    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
    const cancelBtn = btnRow.createEl("button", { text: this.s.cancel });
    cancelBtn.addEventListener("click", () => this.close());
    const deleteBtn = btnRow.createEl("button", { text: this.s.delete, cls: "mod-warning" });
    deleteBtn.addEventListener("click", () => { this.onConfirm(); this.close(); });
  }

  onClose() { this.contentEl.empty(); }
}

class RenameModal extends Modal {
  private file: TFile;
  private onConfirm: (newName: string) => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, file: TFile, s: typeof STRINGS["de"], onConfirm: (newName: string) => void) {
    super(app);
    this.file = file;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.renameTitle });
    const input = contentEl.createEl("input", { type: "text", cls: "note-gallery-rename-input" });
    input.value = this.file.basename;
    input.select();
    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
    const cancelBtn = btnRow.createEl("button", { text: this.s.cancel });
    cancelBtn.addEventListener("click", () => this.close());
    const confirmBtn = btnRow.createEl("button", { text: this.s.renameConfirm, cls: "mod-cta" });
    confirmBtn.addEventListener("click", () => {
      const newName = input.value.trim();
      if (newName && newName !== this.file.basename) {
        this.onConfirm(newName);
      }
      this.close();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmBtn.click();
      if (e.key === "Escape") this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

class CreateFolderModal extends Modal {
  private parentPath: string;
  private onConfirm: (name: string) => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, parentPath: string, s: typeof STRINGS["de"], onConfirm: (name: string) => void) {
    super(app);
    this.parentPath = parentPath;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.createFolderTitle });
    const input = contentEl.createEl("input", { type: "text", cls: "note-gallery-rename-input", placeholder: this.s.createFolderPlaceholder });
    input.focus();
    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
    const cancelBtn = btnRow.createEl("button", { text: this.s.cancel });
    cancelBtn.addEventListener("click", () => this.close());
    const confirmBtn = btnRow.createEl("button", { text: this.s.createFolderConfirm, cls: "mod-cta" });
    confirmBtn.addEventListener("click", () => {
      const name = input.value.trim();
      if (name) { this.onConfirm(name); }
      this.close();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmBtn.click();
      if (e.key === "Escape") this.close();
    });
  }

  onClose() { this.contentEl.empty(); }
}

class RenameFolderModal extends Modal {
  private folder: TFolder;
  private onConfirm: (newName: string) => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, folder: TFolder, s: typeof STRINGS["de"], onConfirm: (newName: string) => void) {
    super(app);
    this.folder = folder;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.renameFolder });
    const input = contentEl.createEl("input", { type: "text", cls: "note-gallery-rename-input" });
    input.value = this.folder.name;
    input.select();
    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
    btnRow.createEl("button", { text: this.s.cancel }).addEventListener("click", () => this.close());
    const confirmBtn = btnRow.createEl("button", { text: this.s.renameConfirm, cls: "mod-cta" });
    confirmBtn.addEventListener("click", () => {
      const newName = input.value.trim();
      if (newName && newName !== this.folder.name) this.onConfirm(newName);
      this.close();
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") confirmBtn.click();
      if (e.key === "Escape") this.close();
    });
    setTimeout(() => input.focus(), 50);
  }

  onClose() { this.contentEl.empty(); }
}

class ConfirmDeleteFolderModal extends Modal {
  private folderName: string;
  private onConfirm: () => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, folderName: string, s: typeof STRINGS["de"], onConfirm: () => void) {
    super(app);
    this.folderName = folderName;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.deleteFolderTitle });
    contentEl.createEl("p", { text: this.s.deleteFolderConfirm(this.folderName) });
    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
    btnRow.createEl("button", { text: this.s.cancel }).addEventListener("click", () => this.close());
    const deleteBtn = btnRow.createEl("button", { text: this.s.deleteFolder, cls: "mod-warning" });
    deleteBtn.addEventListener("click", () => { this.onConfirm(); this.close(); });
  }

  onClose() { this.contentEl.empty(); }
}

class MoveFolderModal extends Modal {
  private file: TFile;
  private onConfirm: (folder: TFolder) => void;
  private s: typeof STRINGS["de"];

  constructor(app: App, file: TFile, s: typeof STRINGS["de"], onConfirm: (folder: TFolder) => void) {
    super(app);
    this.file = file;
    this.onConfirm = onConfirm;
    this.s = s;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.s.moveNoteTitle });

    const searchInput = contentEl.createEl("input", {
      type: "text",
      cls: "note-gallery-rename-input",
      placeholder: this.s.moveNoteSearch,
    });

    const listEl = contentEl.createDiv({ cls: "note-gallery-move-list" });

    const allFolders = this.getAllFolders();
    const currentFolderPath = this.file.parent?.path ?? "";

    const render = (query: string) => {
      listEl.empty();
      const q = query.toLowerCase();
      const filtered = allFolders.filter(f =>
        f.path !== currentFolderPath &&
        (q === "" || f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q))
      );
      if (filtered.length === 0) {
        listEl.createDiv({ cls: "note-gallery-move-empty", text: "—" });
        return;
      }
      for (const folder of filtered) {
        const item = listEl.createDiv({ cls: "note-gallery-move-item" });
        const displayPath = folder.path === "" ? "/ (Vault)" : folder.path;
        item.setText(displayPath);
        item.addEventListener("click", () => {
          this.onConfirm(folder);
          this.close();
        });
      }
    };

    render("");
    searchInput.addEventListener("input", () => render(searchInput.value));
    searchInput.focus();
  }

  private getAllFolders(): TFolder[] {
    const folders: TFolder[] = [];
    const collect = (f: TFolder) => {
      folders.push(f);
      for (const child of f.children) {
        if (child instanceof TFolder) collect(child);
      }
    };
    collect(this.app.vault.getRoot());
    return folders.sort((a, b) => a.path.localeCompare(b.path));
  }

  onClose() { this.contentEl.empty(); }
}

// ── Context Menu ─────────────────────────────────────────────────────────────

function showContextMenu(
  app: App,
  e: MouseEvent | TouchEvent,
  items: ({ label: string; icon?: string; danger?: boolean; action: () => void } | { separator: true })[]
) {
  const menu = new Menu();

  for (const item of items) {
    if ("separator" in item) {
      menu.addSeparator();
    } else {
      menu.addItem((menuItem) => {
        menuItem.setTitle(item.label);
        if (item.icon) menuItem.setIcon(item.icon);
        if (item.danger) menuItem.setWarning(true);
        menuItem.onClick(() => item.action());
      });
    }
  }

  if (e instanceof MouseEvent) {
    menu.showAtMouseEvent(e);
  } else {
    const touch = e.touches[0] || e.changedTouches[0];
    menu.showAtPosition({ x: touch.clientX, y: touch.clientY });
  }
}

// ── View ─────────────────────────────────────────────────────────────────────

class NoteGalleryView extends ItemView {
  folder: TFolder;
  private plugin: NoteGalleryPlugin;
  private folderPath: string = "";
  private searchQuery: string = "";
  private searchVaultWide: boolean = false;
  private breadcrumb: TFolder[] = [];
  private mode: "folder" | "recent" | "favorites" = "folder";
  private currentSort: string = "modified-desc";
  private _viewportCleanup?: () => void;
  private _listRenderGen = 0;

  constructor(leaf: WorkspaceLeaf, folder: TFolder, plugin: NoteGalleryPlugin) {
    super(leaf);
    this.folder = folder;
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Visual Explorer"; }
  getIcon() { return "layout-grid"; }

  getState(): Record<string, unknown> {
    return { folderPath: this.folder?.path ?? this.folderPath };
  }

  async setState(state: Record<string, unknown>, result: { history: boolean }): Promise<void> {
    const path = state?.folderPath as string | undefined;
    if (path !== undefined) {
      this.folderPath = path;
      const found = path === ""
        ? this.app.vault.getRoot()
        : this.app.vault.getAbstractFileByPath(path);
      if (found instanceof TFolder) {
        this.folder = found;
        this.breadcrumb = this.computeBreadcrumb(found);
      }
    }
    this.mode = "folder";
    this.searchQuery = "";
    this.searchVaultWide = false;
    this.load();
    await this.render();
    await super.setState(state, result);
  }

  computeBreadcrumb(folder: TFolder): TFolder[] {
    const crumbs: TFolder[] = [];
    let current: TFolder | null = folder;
    while (current) {
      crumbs.unshift(current);
      current = current.parent ?? null;
    }
    return crumbs;
  }

  async createNoteWithName(folderPath: string) {
    const s = STRINGS[this.plugin.settings.language];
    return new Promise<void>((resolve) => {
      const modal = new Modal(this.app);
      modal.titleEl.setText(s.newDoc);
      const input = modal.contentEl.createEl("input", {
        type: "text",
        cls: "note-gallery-rename-input",
        placeholder: s.newDoc,
      });
      input.focus();
      const btnRow = modal.contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
      btnRow.createEl("button", { text: s.cancel }).addEventListener("click", () => { modal.close(); resolve(); });
      const confirmBtn = btnRow.createEl("button", { text: s.createFolderConfirm, cls: "mod-cta" });
      confirmBtn.addEventListener("click", async () => {
        const name = input.value.trim();
        if (name) {
          try {
            const path = normalizePath((folderPath ? folderPath + "/" : "") + name + ".md");
            const file = await this.app.vault.create(path, "");
            await this.app.workspace.getLeaf(false).openFile(file);
            await this.render();
          } catch (err) {
            new Notice(STRINGS[this.plugin.settings.language].error + ": " + err);
          }
        }
        modal.close();
        resolve();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmBtn.click();
        if (e.key === "Escape") { modal.close(); resolve(); }
      });
      modal.open();
      setTimeout(() => input.focus(), 50);
    });
  }

  async onClose() {
    this._viewportCleanup?.();
    this._viewportCleanup = undefined;
  }

  async navigateTo(folder: TFolder) {
    // setViewState({active:true}) on an already-active leaf does not record history.
    // Push current state manually, then update the view without the active flag
    // so Obsidian doesn't overwrite the history we just wrote.
    const leafHistory = (this.leaf as any).history;
    if (leafHistory != null) {
      if (!leafHistory.backHistory) leafHistory.backHistory = [];
      leafHistory.backHistory.push({
        state: { type: VIEW_TYPE, state: { folderPath: this.folder?.path ?? "" }, active: true },
        eState: null,
      });
      leafHistory.forwardHistory = [];
    }
    await this.leaf.setViewState({
      type: VIEW_TYPE,
      state: { folderPath: folder.path },
    });
    // Re-fire active-leaf-change so Obsidian re-evaluates the nav button states
    this.app.workspace.trigger("active-leaf-change", this.leaf);
  }

  async onOpen() {
    this.currentSort = this.plugin.settings.sortBy;
    this.registerEvent(this.app.vault.on("modify", async (file) => {
      if (file instanceof TFile && file.parent?.path === this.folder?.path) await this.render();
    }));
    this.registerEvent(this.app.vault.on("create", async (file) => {
      if (file instanceof TFile && (file.parent?.path === this.folder?.path || file.parent?.parent?.path === this.folder?.path)) await this.render();
    }));
    this.registerEvent(this.app.vault.on("delete", async (file) => {
      if (file instanceof TFile && (file.parent?.path === this.folder?.path || file.parent?.parent?.path === this.folder?.path)) await this.render();
    }));
    this.registerEvent(this.app.vault.on("rename", async (file) => {
      if (file instanceof TFile && (file.parent?.path === this.folder?.path || file.parent?.parent?.path === this.folder?.path)) await this.render();
    }));
    await this.render();
  }

  async render() {
    if (!this.folder) return;

    this._viewportCleanup?.();
    this._viewportCleanup = undefined;

    const { thumbnailSize, filesFolder, dateLocale, titleWrap, language, breadcrumbFontSize } = this.plugin.settings;
    const sortBy = this.currentSort;
    const s = STRINGS[language];

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("note-gallery-container");
    this.containerEl.addClass("note-gallery-view");
    // Dynamic, user-configured sizes go through CSS variables so all
    // visual rules stay in styles.css (theme-compatible, no inline styles).
    container.style.setProperty("--note-gallery-thumb-size", thumbnailSize + "px");
    container.style.setProperty("--note-gallery-breadcrumb-size", breadcrumbFontSize + "px");

    if (window.visualViewport) {
      const adjustHeight = () => {
        const top = container.getBoundingClientRect().top;
        container.style.setProperty("--note-gallery-viewport-height", (window.visualViewport!.height - top) + "px");
      };
      adjustHeight();
      window.visualViewport.addEventListener('resize', adjustHeight);
      this._viewportCleanup = () =>
        window.visualViewport!.removeEventListener('resize', adjustHeight);
    }

    const toolbar = container.createDiv({ cls: "note-gallery-toolbar" });
    this.buildBreadcrumb(toolbar, s);
    this.buildControlsRow(toolbar, container, s, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);

    const allTags = this.collectTagsForCurrentView();
    if (allTags.length > 0) this.buildTagChips(toolbar, allTags);

    const listContainer = container.createDiv({ cls: "note-gallery-list" });
    await this.renderList(listContainer, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
  }

  private buildBreadcrumb(toolbar: HTMLElement, s: typeof STRINGS["de"]) {
    const header = toolbar.createDiv({ cls: "note-gallery-header" });
    if (this.mode === "folder") {
      const breadcrumbEl = header.createDiv({ cls: "note-gallery-breadcrumb" });
      this.breadcrumb.forEach((crumb, i) => {
        if (i > 0) breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-sep", text: " / " });
        const crumbEl = breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-item", text: crumb.name || "Vault" });
        if (i < this.breadcrumb.length - 1) {
          crumbEl.addClass("note-gallery-breadcrumb-link");
          crumbEl.addEventListener("click", () => this.navigateTo(crumb));
        }
      });
    } else {
      const modeLabel = header.createDiv({ cls: "note-gallery-breadcrumb" });
      modeLabel.createSpan({ cls: "note-gallery-breadcrumb-link", text: s.back })
        .addEventListener("click", () => { this.mode = "folder"; this.render(); });
      modeLabel.createSpan({ cls: "note-gallery-breadcrumb-sep", text: " / " });
      modeLabel.createSpan({ text: this.mode === "recent" ? s.recent : s.favorites });
    }
  }

  private buildControlsRow(
    toolbar: HTMLElement,
    container: HTMLElement,
    s: typeof STRINGS["de"],
    filesFolder: string,
    dateLocale: string,
    sortBy: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    const controls = toolbar.createDiv({ cls: "note-gallery-controls" });

    const searchWrapper = controls.createDiv({ cls: "note-gallery-search-wrapper" });
    const searchInput = searchWrapper.createEl("input", {
      cls: "note-gallery-search",
      type: "text",
      placeholder: s.search,
    });
    searchInput.value = this.searchQuery;

    const clearBtn = searchWrapper.createDiv({ cls: "note-gallery-search-clear" });
    clearBtn.setText("✕");
    clearBtn.toggleClass("is-hidden", !this.searchQuery);

    const debouncedSearchRender = debounce(() => {
      const lc = container.querySelector(".note-gallery-list") as HTMLElement;
      if (lc) this.renderList(lc, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
    }, 150);

    // Search scope toggle: current folder ↔ whole vault
    // At root, always vault-wide (globe, non-interactive); elsewhere toggleable.
    // Use parent == null to detect root reliably (path can vary across Obsidian versions).
    const isAtRoot = this.folder.parent == null;
    const scopeBtn = controls.createDiv({ cls: "note-gallery-icon-btn note-gallery-search-scope" });
    if (isAtRoot) {
      setIcon(scopeBtn, "globe");
      scopeBtn.toggleClass("is-active", true);
      scopeBtn.setAttribute("aria-label", s.searchVaultTooltip);
      scopeBtn.title = s.searchVaultTooltip;
    } else {
      const updateScopeBtn = () => {
        // folder-search (not plain folder): a bare folder icon next to the
        // action buttons reads as "create folder" instead of "search scope"
        setIcon(scopeBtn, this.searchVaultWide ? "globe" : "folder-search");
        scopeBtn.toggleClass("is-active", this.searchVaultWide);
        scopeBtn.setAttribute("aria-label", this.searchVaultWide ? s.searchVaultTooltip : s.searchFolderTooltip);
        scopeBtn.title = this.searchVaultWide ? s.searchVaultTooltip : s.searchFolderTooltip;
      };
      updateScopeBtn();
      scopeBtn.addEventListener("click", () => {
        this.searchVaultWide = !this.searchVaultWide;
        updateScopeBtn();
        const lc = container.querySelector(".note-gallery-list") as HTMLElement;
        if (lc) this.renderList(lc, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
      });
    }

    searchInput.addEventListener("input", () => {
      this.searchQuery = searchInput.value;
      clearBtn.toggleClass("is-hidden", !this.searchQuery);
      debouncedSearchRender();
    });

    searchInput.addEventListener("keydown", async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.searchQuery = "";
        searchInput.value = "";
        clearBtn.addClass("is-hidden");
        await this.render();
      }
    });

    clearBtn.addEventListener("click", async () => {
      this.searchQuery = "";
      searchInput.value = "";
      clearBtn.addClass("is-hidden");
      const lc = container.querySelector(".note-gallery-list") as HTMLElement;
      if (lc) await this.renderList(lc, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
      searchInput.focus();
    });

    // Configurable toolbar buttons between the scope button and "+"
    const ts = this.plugin.settings;
    const makeToolbarBtn = (icon: string, label: string, onClick: (e: MouseEvent) => void) => {
      const btn = controls.createDiv({ cls: "note-gallery-icon-btn" });
      setIcon(btn, icon);
      btn.setAttribute("aria-label", label);
      btn.title = label;
      btn.addEventListener("click", (e) => { e.stopPropagation(); onClick(e); });
      return btn;
    };

    if (ts.toolbarShowSort) {
      makeToolbarBtn("arrow-up-down", s.sort, (e) => {
        const menu = new Menu();
        this.addSortMenuItems(menu, container, filesFolder, dateLocale, titleWrap, thumbnailSize);
        menu.showAtMouseEvent(e);
      });
    }

    if (ts.toolbarShowViewToggle) {
      const isGrid = this.getViewMode() === "grid";
      makeToolbarBtn(isGrid ? "list" : "layout-grid", isGrid ? s.viewAsList : s.viewAsGrid, () => this.toggleViewMode());
    }

    if (ts.toolbarShowNewDoc) {
      makeToolbarBtn("file-plus", s.newDoc, async () => {
        await this.createNoteWithName(this.folder.path);
      });
    }

    if (ts.toolbarShowCreateFolder) {
      makeToolbarBtn("folder-plus", s.createFolder, () => {
        new CreateFolderModal(this.app, this.folder.path, s, async (name) => {
          const path = normalizePath((this.folder.path ? this.folder.path + "/" : "") + name);
          await this.app.vault.createFolder(path);
          await this.render();
        }).open();
      });
    }

    if (ts.toolbarShowFavorites) {
      makeToolbarBtn("star", s.favorites, () => {
        this.mode = "favorites"; this.searchQuery = ""; this.render();
      });
    }

    if (ts.toolbarShowRecent) {
      makeToolbarBtn("clock", s.recent, () => {
        this.mode = "recent"; this.searchQuery = ""; this.render();
      });
    }

    if (ts.toolbarShowOpenSettings) {
      makeToolbarBtn("settings", s.openSettings, () => {
        (this.app as any).setting.open();
        (this.app as any).setting.openTabById("visual-explorer");
      });
    }

    const newBtn = controls.createEl("button", { cls: "note-gallery-new-btn", text: "+" });
    newBtn.title = s.actions;
    newBtn.addEventListener("click", (e: MouseEvent | TouchEvent) => {
      e.stopPropagation();
      const ms = this.plugin.settings;

      const menu = new Menu();
      let hasItems = false;
      const addGroup = (build: () => void) => {
        if (hasItems) menu.addSeparator();
        build();
        hasItems = true;
      };

      // Every toolbar action is also available in the "+" menu, but an
      // entry is hidden automatically while its toolbar button is enabled
      // (never duplicated, never lost). The menuShow* settings still allow
      // hiding entries entirely.
      const inMenu = (menuFlag: boolean, toolbarFlag: boolean) => menuFlag && !toolbarFlag;

      if (inMenu(ms.menuShowSort, ms.toolbarShowSort)) {
        addGroup(() => this.addSortMenuItems(menu, container, filesFolder, dateLocale, titleWrap, thumbnailSize));
      }

      if (inMenu(ms.menuShowViewToggle, ms.toolbarShowViewToggle)) {
        const isGrid = this.getViewMode() === "grid";
        addGroup(() => menu.addItem(item => {
          item.setTitle(isGrid ? s.viewAsList : s.viewAsGrid).setIcon(isGrid ? "list" : "layout-grid");
          item.onClick(() => this.toggleViewMode());
        }));
      }

      const navBuilders: (() => void)[] = [];
      if (inMenu(ms.menuShowFavorites, ms.toolbarShowFavorites)) navBuilders.push(() => menu.addItem(item => {
        item.setTitle(s.favorites).setIcon("star");
        item.onClick(() => { this.mode = "favorites"; this.searchQuery = ""; this.render(); });
      }));
      if (inMenu(ms.menuShowRecent, ms.toolbarShowRecent)) navBuilders.push(() => menu.addItem(item => {
        item.setTitle(s.recent).setIcon("clock");
        item.onClick(() => { this.mode = "recent"; this.searchQuery = ""; this.render(); });
      }));
      if (navBuilders.length) addGroup(() => navBuilders.forEach(b => b()));

      const createBuilders: (() => void)[] = [];
      if (inMenu(ms.menuShowNewDoc, ms.toolbarShowNewDoc)) createBuilders.push(() => menu.addItem(item => {
        item.setTitle(s.newDoc).setIcon("file-plus");
        item.onClick(async () => { await this.createNoteWithName(this.folder.path); });
      }));
      if (inMenu(ms.menuShowCreateFolder, ms.toolbarShowCreateFolder)) createBuilders.push(() => menu.addItem(item => {
        item.setTitle(s.createFolder).setIcon("folder-plus");
        item.onClick(() => {
          new CreateFolderModal(this.app, this.folder.path, s, async (name) => {
            const path = normalizePath((this.folder.path ? this.folder.path + "/" : "") + name);
            await this.app.vault.createFolder(path);
            await this.render();
          }).open();
        });
      }));
      if (createBuilders.length) addGroup(() => createBuilders.forEach(b => b()));

      if (inMenu(ms.menuShowOpenSettings, ms.toolbarShowOpenSettings)) {
        addGroup(() => menu.addItem(item => {
          item.setTitle(s.openSettings).setIcon("settings");
          item.onClick(() => {
            (this.app as any).setting.open();
            (this.app as any).setting.openTabById("visual-explorer");
          });
        }));
      }

      if (e instanceof MouseEvent) menu.showAtMouseEvent(e);
      else { const t = e.touches[0] || e.changedTouches[0]; menu.showAtPosition({ x: t.clientX, y: t.clientY }); }
    });
  }

  private async toggleViewMode() {
    const next = this.getViewMode() === "grid" ? "list" : "grid";
    if (this.mode === "folder") this.plugin.settings.folderViewModes[this.folder.path] = next;
    else this.plugin.settings.viewMode = next;
    await this.plugin.saveSettings();
    await this.render();
  }

  // Per-folder view choice (exact path match); global viewMode is the
  // fallback and the value used by the recent/favorites modes.
  private getViewMode(): "list" | "grid" {
    if (this.mode === "folder" && this.folder) {
      return this.plugin.settings.folderViewModes[this.folder.path] ?? this.plugin.settings.viewMode;
    }
    return this.plugin.settings.viewMode;
  }

  // Shared between the toolbar sort button and the "+" menu.
  private addSortMenuItems(
    menu: Menu,
    container: HTMLElement,
    filesFolder: string,
    dateLocale: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    const ms = this.plugin.settings;
    const s = STRINGS[ms.language];
    const sortTypes: { label: string; asc: string; desc: string; defaultDir: "asc" | "desc" }[] = [
      { label: s.sortModified,  asc: "modified-asc",   desc: "modified-desc",   defaultDir: "desc" },
      { label: s.sortCreated,   asc: "created-asc",    desc: "created-desc",    defaultDir: "desc" },
      { label: s.sortName,      asc: "name-asc",       desc: "name-desc",       defaultDir: "asc" },
      { label: s.sortTitleDate, asc: "title-date-asc", desc: "title-date-desc", defaultDir: "desc" },
    ];

    const rerenderList = async () => {
      const lc = container.querySelector(".note-gallery-list") as HTMLElement;
      if (lc) await this.renderList(lc, filesFolder, dateLocale, this.currentSort, titleWrap, thumbnailSize);
    };

    for (const t of sortTypes) {
      const isAsc = this.currentSort === t.asc;
      const isDesc = this.currentSort === t.desc;
      menu.addItem(item => {
        item.setTitle(t.label);
        item.setIcon(isAsc ? "arrow-up" : isDesc ? "arrow-down" : "arrow-up-down");
        item.setChecked(isAsc || isDesc);
        item.onClick(async () => {
          this.currentSort = isAsc ? t.desc : isDesc ? t.asc : (t.defaultDir === "asc" ? t.asc : t.desc);
          await rerenderList();
        });
      });
    }
    menu.addItem(item => {
      item.setTitle(s.sortNone);
      item.setIcon("rotate-ccw");
      item.setChecked(this.currentSort === ms.sortBy);
      item.onClick(async () => {
        this.currentSort = ms.sortBy;
        await rerenderList();
      });
    });
  }

  private collectFilesRecursively(folder: TFolder): TFile[] {
    const result: TFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile) result.push(child);
      else if (child instanceof TFolder) result.push(...this.collectFilesRecursively(child));
    }
    return result;
  }

  async renderList(
    listContainer: HTMLElement,
    filesFolder: string,
    dateLocale: string,
    sortBy: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    const gen = ++this._listRenderGen;
    listContainer.empty();
    const { language, recentCount, showPreview } = this.plugin.settings;
    const s = STRINGS[language];
    const q = this.searchQuery.toLowerCase();
    const isGrid = this.getViewMode() === "grid";
    listContainer.toggleClass("note-gallery-list--grid", isGrid);

    const setCounter = (text: string) => {
      const existingCounter = this.containerEl.querySelector(".note-gallery-counter");
      if (existingCounter) existingCounter.remove();
      const header = this.containerEl.querySelector(".note-gallery-header") as HTMLElement;
      if (header) header.createDiv({ cls: "note-gallery-counter", text });
    };

    // ── Recent / Favorites mode ──────────────────────────────
    if (this.mode === "recent" || this.mode === "favorites") {
      let files = this.app.vault.getMarkdownFiles();

      if (this.mode === "recent") {
        files = files.sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, recentCount);
      } else {
        files = files.filter(f => {
          const cache = this.app.metadataCache.getFileCache(f);
          return isFavorite((cache?.frontmatter ?? {}) as Record<string, unknown>);
        });
      }

      if (q) files = files.filter(f => {
        if (f.basename.toLowerCase().includes(q)) return true;
        const meta = this.app.metadataCache.getFileCache(f);
        const tags = [
          ...(Array.isArray(meta?.frontmatter?.tags) ? meta.frontmatter.tags : []),
          ...(Array.isArray(meta?.frontmatter?.categories) ? meta.frontmatter.categories : []),
        ];
        return tags.some(t => String(t).toLowerCase().includes(q));
      });

      setCounter(files.length + " " + s.notes);

      for (const file of files) {
        if (this._listRenderGen !== gen) return;
        await this.renderNoteCard(listContainer, file, filesFolder, dateLocale, titleWrap, thumbnailSize);
      }

      listContainer.createDiv({ cls: "note-gallery-list-spacer" });
      return;
    }

    // ── Folder mode ──────────────────────────────────────────
    // When a search query is active, skip folder cards and search all files recursively.
    const subfolders = q ? [] : this.folder.children
      .filter((f): f is TFolder => f instanceof TFolder)
      .sort((a, b) => sortBy === "name-desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name));

    for (const subfolder of subfolders) {
      const card = listContainer.createDiv({ cls: "note-gallery-card note-gallery-folder-card" });
      if (isGrid) {
        card.addClass("note-gallery-card--grid");
        const media = card.createDiv({ cls: "note-gallery-grid-media note-gallery-grid-media--folder" });
        setIcon(media, "folder");
      } else {
        const folderIcon = card.createDiv({ cls: "note-gallery-folder-chevron" });
        setIcon(folderIcon, "folder");
      }
      const textDiv = card.createDiv({ cls: "note-gallery-text" });
      textDiv.createDiv({ cls: "note-gallery-title note-gallery-folder-title", text: subfolder.name });
      const fileCount = subfolder.children.filter(f => f instanceof TFile).length;
      const folderCount = subfolder.children.filter(f => f instanceof TFolder).length;
      const meta = [fileCount + " " + s.files, folderCount > 0 ? folderCount + " " + s.subfolders : ""].filter(Boolean).join(" · ");
      textDiv.createDiv({ cls: "note-gallery-date", text: meta });

      const openFolderMenu = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(this.app, e, [
          {
            label: s.newNoteInFolder,
            icon: "file-plus",
            action: async () => {
              await this.createNoteWithName(subfolder.path);
            }
          },
          {
            label: s.renameFolder,
            icon: "pencil",
            action: () => {
              new RenameFolderModal(this.app, subfolder, s, async (newName) => {
                const newPath = normalizePath((subfolder.parent?.path ? subfolder.parent.path + "/" : "") + newName);
                await this.app.fileManager.renameFile(subfolder, newPath);
                await this.render();
              }).open();
            }
          },
          {
            label: s.openInNewTab,
            icon: "arrow-up-right",
            action: async () => {
              const newLeaf = this.app.workspace.getLeaf("tab");
              await newLeaf.setViewState({
                type: VIEW_TYPE,
                active: true,
                state: { folderPath: subfolder.path },
              });
            }
          },
          {
            label: s.archive,
            icon: "archive",
            action: async () => {
              const archivePath = this.plugin.settings.archiveFolder.trim();
              if (!archivePath) {
                new Notice(s.archiveFolderNotSet);
                return;
              }
              if (!this.app.vault.getAbstractFileByPath(archivePath)) {
                await this.app.vault.createFolder(archivePath);
              }
              const newPath = normalizePath(archivePath + "/" + subfolder.name);
              await this.app.fileManager.renameFile(subfolder, newPath);
              new Notice(s.archived(subfolder.name, archivePath));
              await this.render();
            }
          },
          {
            label: s.deleteFolder,
            icon: "trash",
            danger: true,
            action: () => {
              new ConfirmDeleteFolderModal(this.app, subfolder.name, s, async () => {
                await this.app.vault.trash(subfolder, true);
                new Notice(s.deleted(subfolder.name));
                await this.render();
              }).open();
            }
          },
        ]);
      };

      card.setAttribute("tabindex", "0");
      card.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Enter") { card.click(); }
        if (e.key === "ArrowDown") { e.preventDefault(); const next = card.nextElementSibling as HTMLElement; if (next?.classList.contains("note-gallery-card")) next.focus(); }
        if (e.key === "ArrowUp") { e.preventDefault(); const prev = card.previousElementSibling as HTMLElement; if (prev?.classList.contains("note-gallery-card")) prev.focus(); }
      });
      card.addEventListener("contextmenu", (e) => openFolderMenu(e));
      let longPressTimer: ReturnType<typeof setTimeout>;
      card.addEventListener("touchstart", (e) => { longPressTimer = setTimeout(() => openFolderMenu(e), 500); }, { passive: true });
      card.addEventListener("touchend", () => clearTimeout(longPressTimer));
      card.addEventListener("touchmove", () => clearTimeout(longPressTimer));
      card.addEventListener("touchcancel", () => clearTimeout(longPressTimer));
      card.addEventListener("click", () => this.navigateTo(subfolder));

      // Drop target: accept dragged notes/files
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        card.addClass("note-gallery-card--drag-over");
      });
      card.addEventListener("dragleave", (e) => {
        if (!card.contains(e.relatedTarget as Node)) {
          card.removeClass("note-gallery-card--drag-over");
        }
      });
      card.addEventListener("drop", async (e) => {
        e.preventDefault();
        card.removeClass("note-gallery-card--drag-over");
        const filePath = e.dataTransfer?.getData("text/plain");
        if (!filePath) return;
        const draggedFile = this.app.vault.getAbstractFileByPath(filePath);
        if (!(draggedFile instanceof TFile)) return;
        const newPath = (subfolder.path ? subfolder.path + "/" : "") + draggedFile.name;
        await this.app.fileManager.renameFile(draggedFile, newPath);
        new Notice(s.moved(draggedFile.basename, subfolder.path || "/"));
        await this.render();
      });
    }

    const filePool = q
      ? (this.searchVaultWide || this.folder.parent == null
          ? this.app.vault.getFiles().filter(f => f.extension === "md" || IMAGE_EXTS.has(f.extension.toLowerCase()))
          : this.collectFilesRecursively(this.folder))
      : this.folder.children.filter((f): f is TFile => f instanceof TFile);

    let files = filePool.filter(f => {
      if (!q) return true;
      if (f.name.toLowerCase().includes(q)) return true;
      const meta = this.app.metadataCache.getFileCache(f);
      const tags = [
        ...(Array.isArray(meta?.frontmatter?.tags) ? meta.frontmatter.tags : []),
        ...(Array.isArray(meta?.frontmatter?.categories) ? meta.frontmatter.categories : []),
      ];
      return tags.some(t => String(t).toLowerCase().includes(q));
    });

    files = files.sort((a, b) => {
      if (sortBy === "name-asc")     return a.basename.localeCompare(b.basename);
      if (sortBy === "name-desc")    return b.basename.localeCompare(a.basename);
      if (sortBy === "created-asc")  return getEffectiveCreatedTime(a, this.app) - getEffectiveCreatedTime(b, this.app);
      if (sortBy === "created-desc") return getEffectiveCreatedTime(b, this.app) - getEffectiveCreatedTime(a, this.app);
      if (sortBy === "modified-asc") return a.stat.mtime - b.stat.mtime;
      if (sortBy === "title-date-asc" || sortBy === "title-date-desc") {
        const format = this.plugin.settings.titleDateFormat;
        const ta = getTitleDateTime(a, format) ?? getEffectiveCreatedTime(a, this.app);
        const tb = getTitleDateTime(b, format) ?? getEffectiveCreatedTime(b, this.app);
        return sortBy === "title-date-asc" ? ta - tb : tb - ta;
      }
      return b.stat.mtime - a.stat.mtime; // modified-desc (default)
    });

    if (this.plugin.settings.sortFavoritesFirst) {
      files = files.sort((a, b) => {
        const favA = isFavorite((this.app.metadataCache.getFileCache(a)?.frontmatter ?? {}) as Record<string, unknown>);
        const favB = isFavorite((this.app.metadataCache.getFileCache(b)?.frontmatter ?? {}) as Record<string, unknown>);
        if (favA && !favB) return -1;
        if (!favA && favB) return 1;
        return 0;
      });
    }

    setCounter(files.length + " " + s.files + (subfolders.length > 0 ? ` · ${subfolders.length} ` + s.subfolders : ""));

    for (const file of files) {
      if (this._listRenderGen !== gen) return;
      if (file.extension === "md") {
        await this.renderNoteCard(listContainer, file, filesFolder, dateLocale, titleWrap, thumbnailSize);
      } else {
        await this.renderFileCard(listContainer, file, dateLocale, titleWrap, thumbnailSize);
      }
    }

    listContainer.createDiv({ cls: "note-gallery-list-spacer" });
  }

  async renderNoteCard(
    listContainer: HTMLElement,
    file: TFile,
    filesFolder: string,
    dateLocale: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    const { language, showPreview, previewLines } = this.plugin.settings;
    const s = STRINGS[language];
    const content = await this.app.vault.cachedRead(file);
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;

    const imgPath = extractFirstImage(content);
    const previewText = extractPreviewText(content);
    const category = extractCategories(frontmatter);
    const dateStr = formatDate(frontmatter, file, dateLocale);
    const favorite = isFavorite(frontmatter);
    const { coverMode, coverTag } = this.plugin.settings;
    const isGrid = this.getViewMode() === "grid";
    const coverTags: string[] = Array.isArray(frontmatter?.tags) ? (frontmatter.tags as unknown[]).map(String) : [];
    // Grid tiles already show a large image, so the cover layout only applies in list view.
    const isCoverMode = !isGrid && (
      coverMode === "always" ||
      (coverMode === "tag" && coverTag.trim() !== "" && coverTags.includes(coverTag.trim())));

    const card = listContainer.createDiv({ cls: "note-gallery-card" });
    if (isCoverMode) card.addClass("note-gallery-card--cover");
    if (isGrid) card.addClass("note-gallery-card--grid");

    // Drag: allow note to be dragged onto a folder card
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", file.path);
      card.addClass("note-gallery-card--dragging");
    });
    card.addEventListener("dragend", () => {
      card.removeClass("note-gallery-card--dragging");
    });

    // Grid: media area on top (image or placeholder icon)
    const gridMedia = isGrid ? card.createDiv({ cls: "note-gallery-grid-media" }) : null;

    // Text (left in list view, below the media area in grid view)
    const textDiv = card.createDiv({ cls: "note-gallery-text" });
    const titleRow = textDiv.createDiv({ cls: "note-gallery-title-row" });
    if (favorite) titleRow.createSpan({ cls: "note-gallery-favorite-star", text: "★ " });
    const titleEl = titleRow.createSpan({ cls: "note-gallery-title" });
    titleEl.setText(file.basename);
    if (titleWrap && !isCoverMode && !isGrid) titleEl.addClass("note-gallery-title--wrap");

    const metaDiv = textDiv.createDiv({ cls: "note-gallery-meta" });
    if (category) {
      metaDiv.createSpan({ cls: "note-gallery-category", text: category });
      metaDiv.createSpan({ cls: "note-gallery-meta-sep", text: " · " });
    }
    metaDiv.createSpan({ text: dateStr });

    if (showPreview && previewText && !isGrid) {
      const previewEl = textDiv.createDiv({ text: previewText });
      previewEl.addClass(previewLines === 2 ? "note-gallery-preview--two-lines" : "note-gallery-preview");
    }

    // Image
    let imgFile: TFile | null = null;
    if (imgPath) {
      const pathsToTry = ([
        imgPath,
        filesFolder + "/" + imgPath.split("/").pop(),
        "Vault/" + imgPath,
        "Vault/" + filesFolder + "/" + imgPath.split("/").pop(),
        (file.parent?.path ? file.parent.path + "/" : "") + imgPath,
      ].filter(Boolean) as string[]).map((p) => normalizePath(p));

      for (const p of pathsToTry) {
        const found = this.app.vault.getAbstractFileByPath(p);
        if (found instanceof TFile) { imgFile = found; break; }
      }
    }

    if (gridMedia) {
      if (imgFile) {
        const img = gridMedia.createEl("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = this.app.vault.getResourcePath(imgFile);
        img.alt = file.basename;
      } else {
        setIcon(gridMedia, "file-text");
      }
    } else if (imgFile) {
      const url = this.app.vault.getResourcePath(imgFile);
      if (isCoverMode) {
        const coverDiv = card.createDiv({ cls: "note-gallery-cover-img" });
        const img = coverDiv.createEl("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = url;
        img.alt = file.basename;
      } else {
        const imgDiv = card.createDiv({ cls: "note-gallery-thumb" });
        const img = imgDiv.createEl("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = url;
        img.alt = file.basename;
      }
    }

    // Long-press (mobile) / right-click (desktop) → context menu
    const openCardMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(this.app, e, [
        {
          label: favorite ? s.removeFavorite : s.addFavorite,
          icon: "star",
          action: async () => {
            await this.app.fileManager.processFrontMatter(file, (fm) => {
              if (favorite) delete fm.favorite;
              else fm.favorite = true;
            });
            await this.render();
          }
        },
        {
          label: s.rename,
          icon: "pencil",
          action: () => {
            new RenameModal(this.app, file, s, async (newName) => {
              const newPath = normalizePath((file.parent?.path ? file.parent.path + "/" : "") + newName + ".md");
              await this.app.fileManager.renameFile(file, newPath);
              await this.render();
            }).open();
          }
        },
        {
          label: s.moveNote,
          icon: "folder-input",
          action: () => {
            new MoveFolderModal(this.app, file, s, async (targetFolder) => {
              const newPath = (targetFolder.path ? targetFolder.path + "/" : "") + file.name;
              await this.app.fileManager.renameFile(file, newPath);
              new Notice(s.moved(file.basename, targetFolder.path || "/"));
              await this.render();
            }).open();
          }
        },
        {
          label: s.openInNewTab,
          icon: "arrow-up-right",
          action: async () => {
            const newLeaf = this.app.workspace.getLeaf("tab");
            await newLeaf.openFile(file);
            const leafHistory = (newLeaf as any).history;
            if (leafHistory?.backHistory != null) {
              leafHistory.backHistory = [{
                state: { type: VIEW_TYPE, state: { folderPath: this.folder?.path ?? "" }, active: true },
                eState: null,
              }];
              leafHistory.forwardHistory = [];
            }
          }
        },
        {
          label: s.archive,
          icon: "archive",
          action: async () => {
            const archivePath = this.plugin.settings.archiveFolder.trim();
            if (!archivePath) {
              new Notice(s.archiveFolderNotSet);
              return;
            }
            if (!this.app.vault.getAbstractFileByPath(archivePath)) {
              await this.app.vault.createFolder(archivePath);
            }
            const newPath = normalizePath(archivePath + "/" + file.name);
            await this.app.fileManager.renameFile(file, newPath);
            new Notice(s.archived(file.basename, archivePath));
            await this.render();
          }
        },
        {
          label: s.delete,
          icon: "trash",
          danger: true,
          action: () => {
            new ConfirmDeleteModal(this.app, file.basename, s, async () => {
              await this.app.vault.trash(file, true);
              new Notice(s.deleted(file.basename));
              await this.render();
            }).open();
          }
        },
      ]);
    };

    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { card.click(); }
      if (e.key === "ArrowDown") { e.preventDefault(); const next = card.nextElementSibling as HTMLElement; if (next?.classList.contains("note-gallery-card")) next.focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); const prev = card.previousElementSibling as HTMLElement; if (prev?.classList.contains("note-gallery-card")) prev.focus(); }
    });

    // Desktop: right-click
    card.addEventListener("contextmenu", (e) => openCardMenu(e));

    // Mobile: long-press
    let longPressTimer: ReturnType<typeof setTimeout>;
    card.addEventListener("touchstart", (e) => {
      longPressTimer = setTimeout(() => openCardMenu(e), 500);
    }, { passive: true });
    card.addEventListener("touchend", () => clearTimeout(longPressTimer));
    card.addEventListener("touchmove", () => clearTimeout(longPressTimer));
    card.addEventListener("touchcancel", () => clearTimeout(longPressTimer));

    // Open note on tap/click
    card.addEventListener("click", () => {
      this.leaf.openFile(file);
    });
  }

  async renderFileCard(
    listContainer: HTMLElement,
    file: TFile,
    dateLocale: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    const { language } = this.plugin.settings;
    const s = STRINGS[language];

    const isImage = IMAGE_EXTS.has(file.extension.toLowerCase());
    const dateStr = new Date(file.stat.mtime).toLocaleDateString(dateLocale, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const isGrid = this.getViewMode() === "grid";
    const card = listContainer.createDiv({ cls: "note-gallery-card" });
    if (isGrid) card.addClass("note-gallery-card--grid");

    // Drag: allow file to be dragged onto a folder card
    card.draggable = true;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer?.setData("text/plain", file.path);
      card.addClass("note-gallery-card--dragging");
    });
    card.addEventListener("dragend", () => {
      card.removeClass("note-gallery-card--dragging");
    });

    const gridMedia = isGrid ? card.createDiv({ cls: "note-gallery-grid-media" }) : null;

    const textDiv = card.createDiv({ cls: "note-gallery-text" });
    const titleRow = textDiv.createDiv({ cls: "note-gallery-title-row" });
    const titleEl = titleRow.createSpan({ cls: "note-gallery-title" });
    titleEl.setText(file.name);
    if (titleWrap && !isGrid) titleEl.addClass("note-gallery-title--wrap");

    const metaDiv = textDiv.createDiv({ cls: "note-gallery-meta" });
    metaDiv.createSpan({ cls: "note-gallery-category", text: file.extension.toUpperCase() });
    metaDiv.createSpan({ cls: "note-gallery-meta-sep", text: " · " });
    metaDiv.createSpan({ text: dateStr });

    if (gridMedia) {
      if (isImage) {
        const img = gridMedia.createEl("img");
        img.loading = "lazy";
        img.decoding = "async";
        img.src = this.app.vault.getResourcePath(file);
        img.alt = file.name;
      } else {
        setIcon(gridMedia, "file");
      }
    } else if (isImage) {
      const imgDiv = card.createDiv({ cls: "note-gallery-thumb" });
      const url = this.app.vault.getResourcePath(file);
      const img = imgDiv.createEl("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.src = url;
      img.alt = file.name;
    }

    const openCardMenu = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showContextMenu(this.app, e, [
        {
          label: s.rename,
          icon: "pencil",
          action: () => {
            new RenameModal(this.app, file, s, async (newName) => {
              const newPath = normalizePath((file.parent?.path ? file.parent.path + "/" : "") + newName + "." + file.extension);
              await this.app.fileManager.renameFile(file, newPath);
              await this.render();
            }).open();
          }
        },
        {
          label: s.openInNewTab,
          icon: "arrow-up-right",
          action: async () => {
            const newLeaf = this.app.workspace.getLeaf("tab");
            await newLeaf.openFile(file);
            const leafHistory = (newLeaf as any).history;
            if (leafHistory?.backHistory != null) {
              leafHistory.backHistory = [{
                state: { type: VIEW_TYPE, state: { folderPath: this.folder?.path ?? "" }, active: true },
                eState: null,
              }];
              leafHistory.forwardHistory = [];
            }
          }
        },
        {
          label: s.delete,
          icon: "trash",
          danger: true,
          action: () => {
            new ConfirmDeleteModal(this.app, file.name, s, async () => {
              await this.app.vault.trash(file, true);
              new Notice(s.deleted(file.name));
              await this.render();
            }).open();
          }
        },
      ]);
    };

    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") { card.click(); }
      if (e.key === "ArrowDown") { e.preventDefault(); const next = card.nextElementSibling as HTMLElement; if (next?.classList.contains("note-gallery-card")) next.focus(); }
      if (e.key === "ArrowUp") { e.preventDefault(); const prev = card.previousElementSibling as HTMLElement; if (prev?.classList.contains("note-gallery-card")) prev.focus(); }
    });

    card.addEventListener("contextmenu", (e) => openCardMenu(e));
    let longPressTimer: ReturnType<typeof setTimeout>;
    card.addEventListener("touchstart", (e) => {
      longPressTimer = setTimeout(() => openCardMenu(e), 500);
    }, { passive: true });
    card.addEventListener("touchend", () => clearTimeout(longPressTimer));
    card.addEventListener("touchmove", () => clearTimeout(longPressTimer));
    card.addEventListener("touchcancel", () => clearTimeout(longPressTimer));

    card.addEventListener("click", () => {
      this.leaf.openFile(file);
    });
  }

  private collectTagsForCurrentView(): string[] {
    const allTags = new Set<string>();
    let files: TFile[];

    if (this.mode === "folder") {
      files = this.folder.children
        .filter((f): f is TFile => f instanceof TFile && f.extension === "md");
    } else if (this.mode === "recent") {
      files = this.app.vault.getMarkdownFiles()
        .sort((a, b) => b.stat.mtime - a.stat.mtime)
        .slice(0, this.plugin.settings.recentCount);
    } else {
      files = this.app.vault.getMarkdownFiles().filter(f => {
        const cache = this.app.metadataCache.getFileCache(f);
        return isFavorite((cache?.frontmatter ?? {}) as Record<string, unknown>);
      });
    }

    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const cats = cache?.frontmatter?.categories;
      const tags = cache?.frontmatter?.tags;
      if (Array.isArray(cats)) cats.forEach((c: unknown) => allTags.add(String(c)));
      if (Array.isArray(tags)) tags.forEach((t: unknown) => allTags.add(String(t)));
    }

    return [...allTags].sort();
  }

  private buildTagChips(toolbar: HTMLElement, tags: string[]) {
    const chipsRow = toolbar.createDiv({ cls: "note-gallery-tag-chips" });
    for (const tag of tags) {
      const chip = chipsRow.createSpan({ cls: "note-gallery-tag-chip" });
      chip.setText("#" + tag);
      if (this.searchQuery === tag) chip.addClass("note-gallery-tag-chip--active");
      chip.addEventListener("click", () => {
        this.searchQuery = this.searchQuery === tag ? "" : tag;
        this.render();
      });
    }
  }
}

// ── Folder Suggest ────────────────────────────────────────────────────────────

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  private onSelectCb: (folder: TFolder) => void;

  constructor(app: App, inputEl: HTMLInputElement, onSelect: (folder: TFolder) => void) {
    super(app, inputEl);
    this.onSelectCb = onSelect;
  }

  getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    return this.app.vault.getAllLoadedFiles()
      .filter((f): f is TFolder => f instanceof TFolder && f.path.toLowerCase().includes(q))
      .sort((a, b) => a.path.localeCompare(b.path))
      .slice(0, 50);
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.setText(folder.path || "/");
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.onSelectCb(folder);
    this.close();
  }
}

// ── Settings Tab ─────────────────────────────────────────────────────────────

class NoteGallerySettingTab extends PluginSettingTab {
  plugin: NoteGalleryPlugin;

  constructor(app: App, plugin: NoteGalleryPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const s = STRINGS[this.plugin.settings.language];
    containerEl.createEl("h2", { text: "Visual Explorer" });

    // ── Allgemein / General ────────────────────────────────────────
    containerEl.createEl("h3", { text: s.stSectionGeneral, cls: "note-gallery-settings-section" });

    new Setting(containerEl)
      .setName("Sprache / Language")
      .setDesc("Sprache der Benutzeroberfläche / UI language")
      .addDropdown(drop =>
        drop.addOption("de", "Deutsch")
          .addOption("en", "English")
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => { this.plugin.settings.language = value as "de" | "en"; await this.plugin.saveSettings(); this.display(); })
      );

    new Setting(containerEl)
      .setName(s.stDateLocale)
      .setDesc(s.stDateLocaleDesc)
      .addDropdown(drop =>
        drop.addOption("de-DE", "Deutsch (13. Okt. 2024)")
          .addOption("en-US", "English (Oct 13, 2024)")
          .addOption("en-GB", "English UK (13 Oct 2024)")
          .setValue(this.plugin.settings.dateLocale)
          .onChange(async (value) => { this.plugin.settings.dateLocale = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stOpenOnStartup)
      .setDesc(s.stOpenOnStartupDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.openOnStartup)
          .onChange(async (value) => { this.plugin.settings.openOnStartup = value; await this.plugin.saveSettings(); })
      );

    // ── Kartenanzeige / Card Display ──────────────────────────────
    containerEl.createEl("h3", { text: s.stSectionCard, cls: "note-gallery-settings-section" });

    new Setting(containerEl)
      .setName(s.stShowPreview)
      .setDesc(s.stShowPreviewDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showPreview)
          .onChange(async (value) => { this.plugin.settings.showPreview = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stPreviewLines)
      .setDesc(s.stPreviewLinesDesc)
      .addDropdown(drop =>
        drop.addOption("1", "1")
          .addOption("2", "2")
          .setValue(String(this.plugin.settings.previewLines))
          .onChange(async (value) => { this.plugin.settings.previewLines = Number(value) as 1 | 2; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stSortFavFirst)
      .setDesc(s.stSortFavFirstDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.sortFavoritesFirst)
          .onChange(async (value) => { this.plugin.settings.sortFavoritesFirst = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stTitleWrap)
      .setDesc(s.stTitleWrapDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.titleWrap)
          .onChange(async (value) => { this.plugin.settings.titleWrap = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stThumbSize)
      .setDesc(s.stThumbSizeDesc)
      .addSlider(slider =>
        slider.setLimits(40, 160, 8).setValue(this.plugin.settings.thumbnailSize).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.thumbnailSize = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stCoverMode)
      .setDesc(s.stCoverModeDesc)
      .addDropdown(drop =>
        drop.addOption("off", s.stCoverModeOff)
          .addOption("tag", s.stCoverModeTag)
          .addOption("always", s.stCoverModeAlways)
          .setValue(this.plugin.settings.coverMode)
          .onChange(async (value) => { this.plugin.settings.coverMode = value as NoteGallerySettings["coverMode"]; await this.plugin.saveSettings(); this.display(); })
      );

    if (this.plugin.settings.coverMode === "tag") {
      new Setting(containerEl)
        .setName(s.stCoverTag)
        .setDesc(s.stCoverTagDesc)
        .addText(text =>
          text.setPlaceholder("vec").setValue(this.plugin.settings.coverTag)
            .onChange(async (value) => { this.plugin.settings.coverTag = value.trim(); await this.plugin.saveSettings(); })
        );
    }

    new Setting(containerEl)
      .setName(s.stFilesFolder)
      .setDesc(s.stFilesFolderDesc)
      .addText(text => {
        new FolderSuggest(this.app, text.inputEl, async (folder) => {
          this.plugin.settings.filesFolder = folder.path;
          await this.plugin.saveSettings();
        });
        text.setPlaceholder("Files").setValue(this.plugin.settings.filesFolder)
          .onChange(async (value) => {
            this.plugin.settings.filesFolder = value.trim() ? normalizePath(value.trim()) : "";
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(s.stArchiveFolder)
      .setDesc(s.stArchiveFolderDesc)
      .addText(text => {
        new FolderSuggest(this.app, text.inputEl, async (folder) => {
          this.plugin.settings.archiveFolder = folder.path;
          await this.plugin.saveSettings();
        });
        text.setPlaceholder("Archiv").setValue(this.plugin.settings.archiveFolder)
          .onChange(async (value) => {
            this.plugin.settings.archiveFolder = value.trim() ? normalizePath(value.trim()) : "";
            await this.plugin.saveSettings();
          });
      });

    // ── Sortierung & Ansichten / Sorting & Views ──────────────────
    containerEl.createEl("h3", { text: s.stSectionSort, cls: "note-gallery-settings-section" });

    new Setting(containerEl)
      .setName(s.stDefaultView)
      .setDesc(s.stDefaultViewDesc)
      .addDropdown(drop =>
        drop.addOption("list", s.stViewList)
          .addOption("grid", s.stViewGrid)
          .setValue(this.plugin.settings.viewMode)
          .onChange(async (value) => {
            this.plugin.settings.viewMode = value as NoteGallerySettings["viewMode"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(s.stSortBy)
      .setDesc(s.stSortByDesc)
      .addDropdown(drop =>
        drop.addOption("modified-desc", s.stSortModified)
          .addOption("modified-asc",   s.stSortModifiedAsc)
          .addOption("created-desc",   s.stSortCreatedDesc)
          .addOption("created-asc",    s.stSortCreatedAsc)
          .addOption("name-asc",       s.stSortNameAsc)
          .addOption("name-desc",      s.stSortNameDesc)
          .addOption("title-date-desc", s.stSortTitleDateDesc)
          .addOption("title-date-asc",  s.stSortTitleDateAsc)
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value) => {
            this.plugin.settings.sortBy = value as NoteGallerySettings["sortBy"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(s.stTitleDateFormat)
      .setDesc(s.stTitleDateFormatDesc)
      .addDropdown(drop => {
        (Object.keys(TITLE_DATE_FORMATS) as TitleDateFormat[]).forEach(f => drop.addOption(f, f));
        drop.setValue(this.plugin.settings.titleDateFormat)
          .onChange(async (value) => {
            this.plugin.settings.titleDateFormat = value as TitleDateFormat;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(s.stRecentCount)
      .setDesc(s.stRecentCountDesc)
      .addSlider(slider =>
        slider.setLimits(5, 100, 5).setValue(this.plugin.settings.recentCount).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.recentCount = value; await this.plugin.saveSettings(); })
      );

    // ── Toolbar ────────────────────────────────────────────────────
    containerEl.createEl("h3", { text: s.stSectionToolbar, cls: "note-gallery-settings-section" });

    type ToolbarToggleKey =
      | "toolbarShowSort" | "toolbarShowViewToggle"
      | "toolbarShowNewDoc" | "toolbarShowCreateFolder"
      | "toolbarShowFavorites" | "toolbarShowRecent"
      | "toolbarShowOpenSettings";

    const toolbarToggles: { key: ToolbarToggleKey; label: string }[] = [
      { key: "toolbarShowSort",         label: s.sort },
      { key: "toolbarShowViewToggle",   label: s.stViewToggle },
      { key: "toolbarShowNewDoc",       label: s.newDoc },
      { key: "toolbarShowCreateFolder", label: s.createFolder },
      { key: "toolbarShowFavorites",    label: s.favorites },
      { key: "toolbarShowRecent",       label: s.recent },
      { key: "toolbarShowOpenSettings", label: s.openSettings },
    ];

    for (const { key, label } of toolbarToggles) {
      new Setting(containerEl)
        .setName(label)
        .setDesc(s.stToolbarItemDesc)
        .addToggle(toggle =>
          toggle.setValue(this.plugin.settings[key])
            .onChange(async (value) => {
              this.plugin.settings[key] = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ── Menü-Inhalt / Menu content ─────────────────────────────────
    containerEl.createEl("h3", { text: s.stSectionMenu, cls: "note-gallery-settings-section" });

    type MenuToggleKey =
      | "menuShowSort" | "menuShowViewToggle"
      | "menuShowFavorites" | "menuShowRecent"
      | "menuShowNewDoc"    | "menuShowCreateFolder"
      | "menuShowOpenSettings";

    const menuToggles: { key: MenuToggleKey; label: string }[] = [
      { key: "menuShowSort",          label: s.sort },
      { key: "menuShowViewToggle",    label: s.stViewToggle },
      { key: "menuShowFavorites",     label: s.favorites },
      { key: "menuShowRecent",        label: s.recent },
      { key: "menuShowNewDoc",        label: s.newDoc },
      { key: "menuShowCreateFolder",  label: s.createFolder },
      { key: "menuShowOpenSettings",  label: s.openSettings },
    ];

    for (const { key, label } of menuToggles) {
      new Setting(containerEl)
        .setName(label)
        .setDesc(s.stMenuItemDesc)
        .addToggle(toggle =>
          toggle.setValue(this.plugin.settings[key])
            .onChange(async (value) => {
              this.plugin.settings[key] = value;
              await this.plugin.saveSettings();
            })
        );
    }

    // ── Navigation & Layout ───────────────────────────────────────
    containerEl.createEl("h3", { text: s.stSectionNav, cls: "note-gallery-settings-section" });

    new Setting(containerEl)
      .setName(s.stBreadcrumbSize)
      .setDesc(s.stBreadcrumbSizeDesc)
      .addSlider(slider =>
        slider.setLimits(10, 18, 1).setValue(this.plugin.settings.breadcrumbFontSize).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.breadcrumbFontSize = value; await this.plugin.saveSettings(); })
      );
  }
}

// ── Plugin ────────────────────────────────────────────────────────────────────

export default class NoteGalleryPlugin extends Plugin {
  settings: NoteGallerySettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => {
      const root = this.app.vault.getRoot();
      return new NoteGalleryView(leaf, root, this);
    });

    this.addSettingTab(new NoteGallerySettingTab(this.app, this));

    const sInit = STRINGS[this.settings.language];
    this.addRibbonIcon("layout-grid", sInit.openGallery, async () => {
      await this.openGallery(this.app.vault.getRoot());
    });

    this.addCommand({
      id: "open-note-gallery",
      name: sInit.openGalleryCommand,
      callback: async () => {
        await this.openGallery(this.app.vault.getRoot());
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item.setTitle(STRINGS[this.settings.language].openAsGallery).setIcon("layout-grid")
              .onClick(async () => {
                const leaf = this.app.workspace.getLeaf(true);
                await leaf.setViewState({
                  type: VIEW_TYPE,
                  active: true,
                  state: { folderPath: file.path },
                });
              });
          });
        }
      })
    );

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.openOnStartup) {
        this.activateView();
      }
    });
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    workspace.revealLeaf(leaf);
  }

  async openGallery(folder: TFolder) {
    const leaf = this.app.workspace.getLeaf(true);
    await leaf.setViewState({
      type: VIEW_TYPE,
      active: true,
      state: { folderPath: folder.path },
    });
  }

  async loadSettings() {
    const raw = (await this.loadData()) as Record<string, unknown> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, raw);
    // Object.assign is shallow — don't share/mutate the default map object
    this.settings.folderViewModes = { ...(this.settings.folderViewModes ?? {}) };
    // Migrate the five per-sort-type menu toggles to the single menuShowSort
    if (raw && raw.menuShowSort === undefined && raw.menuShowSortModified !== undefined) {
      this.settings.menuShowSort = !!(raw.menuShowSortModified || raw.menuShowSortCreated ||
        raw.menuShowSortName || raw.menuShowSortTitleDate || raw.menuShowSortNone);
    }
    const legacyMap: Record<string, NoteGallerySettings["sortBy"]> = {
      modified: "modified-desc",
      created: "created-desc",
      name: "name-asc",
    };
    if (legacyMap[this.settings.sortBy as string]) {
      this.settings.sortBy = legacyMap[this.settings.sortBy as string];
    }
  }

  // Settings changes apply immediately to every open view, not only to
  // views that happen to re-render later (navigation, vault events).
  // Debounced: text settings call saveSettings on every keystroke.
  private refreshViews = debounce(() => {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof NoteGalleryView) leaf.view.render();
    }
  }, 250);

  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshViews();
  }

}
