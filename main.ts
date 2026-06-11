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
} from "obsidian";

const VIEW_TYPE = "visual-explorer";

interface NoteGallerySettings {
  thumbnailSize: number;
  filesFolder: string;
  dateLocale: string;
  sortBy: "modified-desc" | "modified-asc" | "created-desc" | "created-asc" | "name-asc" | "name-desc";
  titleWrap: boolean;
  language: "de" | "en";
  recentCount: number;
  showPreview: boolean;
  breadcrumbFontSize: number;
  previewLines: 1 | 2;
  sortFavoritesFirst: boolean;
  openOnStartup: boolean;
}

const DEFAULT_SETTINGS: NoteGallerySettings = {
  thumbnailSize: 72,
  filesFolder: "Files",
  dateLocale: "de-DE",
  sortBy: "modified-desc",
  titleWrap: false,
  language: "de",
  recentCount: 30,
  showPreview: true,
  breadcrumbFontSize: 12,
  previewLines: 1,
  sortFavoritesFirst: false,
  openOnStartup: false,
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
    openAsGallery: "Als Galerie öffnen",
    stThumbSize: "Thumbnail-Größe",
    stThumbSizeDesc: "Breite und Höhe des Vorschaubilds in Pixeln",
    stFilesFolder: "Dateien-Ordner",
    stFilesFolderDesc: "Pfad zum Ordner mit Bilddateien (relativ zum Vault-Root)",
    sort: "Sortierung",
    sortModifiedDesc: "Geändert (neu → alt)",
    sortModifiedAsc: "Geändert (alt → neu)",
    sortCreatedDesc: "Erstellt (neu → alt)",
    sortCreatedAsc: "Erstellt (alt → neu)",
    sortNameAsc: "Name (A–Z)",
    sortNameDesc: "Name (Z–A)",
    stSortBy: "Sortierung",
    stSortByDesc: "Standard-Sortierung für neue Ansichten",
    stSortModified: "Geändert (neu → alt)",
    stSortCreatedDesc: "Erstellt (neu → alt)",
    stSortCreatedAsc: "Erstellt (alt → neu)",
    stSortModifiedAsc: "Geändert (alt → neu)",
    stSortNameAsc: "Name (A–Z)",
    stSortNameDesc: "Name (Z–A)",
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
    stSectionNav: "Navigation & Layout",
    openSettings: "Einstellungen öffnen",
    openInNewTab: "In neuem Tab öffnen",
    moveNote: "In Ordner verschieben",
    moveNoteTitle: "Notiz verschieben",
    moveNoteSearch: "Ordner suchen…",
    moved: (name: string, folder: string) => `"${name}" verschoben nach ${folder}`,
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
    openAsGallery: "Open as gallery",
    stThumbSize: "Thumbnail size",
    stThumbSizeDesc: "Width and height of the preview image in pixels",
    stFilesFolder: "Files folder",
    stFilesFolderDesc: "Path to the folder with image files (relative to vault root)",
    sort: "Sort",
    sortModifiedDesc: "Modified (newest first)",
    sortModifiedAsc: "Modified (oldest first)",
    sortCreatedDesc: "Created (newest first)",
    sortCreatedAsc: "Created (oldest first)",
    sortNameAsc: "Name (A–Z)",
    sortNameDesc: "Name (Z–A)",
    stSortBy: "Sort by",
    stSortByDesc: "Default sort for new views",
    stSortModified: "Modified (newest first)",
    stSortCreatedDesc: "Created (newest first)",
    stSortCreatedAsc: "Created (oldest first)",
    stSortModifiedAsc: "Modified (oldest first)",
    stSortNameAsc: "Name (A–Z)",
    stSortNameDesc: "Name (Z–A)",
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
    stSectionNav: "Navigation & Layout",
    openSettings: "Open settings",
    openInNewTab: "Open in new tab",
    moveNote: "Move to folder",
    moveNoteTitle: "Move note",
    moveNoteSearch: "Search folders…",
    moved: (name: string, folder: string) => `"${name}" moved to ${folder}`,
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
  private breadcrumb: TFolder[] = [];
  private mode: "folder" | "recent" | "favorites" = "folder";
  private currentSort: string = "modified-desc";
  private _viewportCleanup?: () => void;

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
    if (path) {
      this.folderPath = path;
      const found = this.app.vault.getAbstractFileByPath(path);
      if (found instanceof TFolder) {
        this.folder = found;
        this.breadcrumb = this.computeBreadcrumb(found);
      }
    }
    this.mode = "folder";
    this.searchQuery = "";
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
            const path = (folderPath ? folderPath + "/" : "") + name + ".md";
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
    this.containerEl.style.position = "relative";

    if (window.visualViewport) {
      const adjustHeight = () => {
        const top = container.getBoundingClientRect().top;
        container.style.height = (window.visualViewport!.height - top) + 'px';
      };
      adjustHeight();
      window.visualViewport.addEventListener('resize', adjustHeight);
      this._viewportCleanup = () =>
        window.visualViewport!.removeEventListener('resize', adjustHeight);
    }

    const toolbar = container.createDiv({ cls: "note-gallery-toolbar" });
    this.buildBreadcrumb(toolbar, s, breadcrumbFontSize);
    this.buildControlsRow(toolbar, container, s, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);

    const allTags = this.collectTagsForCurrentView();
    if (allTags.length > 0) this.buildTagChips(toolbar, allTags);

    const listContainer = container.createDiv({ cls: "note-gallery-list" });
    await this.renderList(listContainer, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
  }

  private buildBreadcrumb(toolbar: HTMLElement, s: typeof STRINGS["de"], breadcrumbFontSize: number) {
    if (this.mode === "folder") {
      const breadcrumbEl = toolbar.createDiv({ cls: "note-gallery-breadcrumb" });
      breadcrumbEl.style.fontSize = breadcrumbFontSize + "px";
      this.breadcrumb.forEach((crumb, i) => {
        if (i > 0) breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-sep", text: " / " });
        const crumbEl = breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-item", text: crumb.name || "Vault" });
        if (i < this.breadcrumb.length - 1) {
          crumbEl.addClass("note-gallery-breadcrumb-link");
          crumbEl.addEventListener("click", () => this.navigateTo(crumb));
        }
      });
    } else {
      const modeLabel = toolbar.createDiv({ cls: "note-gallery-breadcrumb" });
      modeLabel.style.fontSize = breadcrumbFontSize + "px";
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
    clearBtn.style.display = this.searchQuery ? "flex" : "none";

    searchInput.addEventListener("input", async () => {
      this.searchQuery = searchInput.value;
      clearBtn.style.display = this.searchQuery ? "flex" : "none";
      const lc = container.querySelector(".note-gallery-list") as HTMLElement;
      if (lc) await this.renderList(lc, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
    });

    searchInput.addEventListener("keydown", async (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.searchQuery = "";
        searchInput.value = "";
        clearBtn.style.display = "none";
        await this.render();
      }
    });

    clearBtn.addEventListener("click", async () => {
      this.searchQuery = "";
      searchInput.value = "";
      clearBtn.style.display = "none";
      const lc = container.querySelector(".note-gallery-list") as HTMLElement;
      if (lc) await this.renderList(lc, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
      searchInput.focus();
    });

    const newBtn = controls.createEl("button", { cls: "note-gallery-new-btn", text: "+" });
    newBtn.title = s.actions;
    newBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const sortOptions: { value: string; label: string }[] = [
        { value: "modified-desc", label: s.sortModifiedDesc },
        { value: "modified-asc",  label: s.sortModifiedAsc },
        { value: "created-desc",  label: s.sortCreatedDesc },
        { value: "created-asc",   label: s.sortCreatedAsc },
        { value: "name-asc",      label: s.sortNameAsc },
        { value: "name-desc",     label: s.sortNameDesc },
      ];
      const menu = new Menu();
      for (const opt of sortOptions) {
        menu.addItem(item => {
          item.setTitle(opt.label);
          item.setIcon("arrow-up-down");
          item.setChecked(this.currentSort === opt.value);
          item.onClick(async () => {
            this.currentSort = opt.value;
            const lc = container.querySelector(".note-gallery-list") as HTMLElement;
            if (lc) await this.renderList(lc, filesFolder, dateLocale, this.currentSort, titleWrap, thumbnailSize);
          });
        });
      }
      menu.addSeparator();
      menu.addItem(item => {
        item.setTitle(s.favorites).setIcon("star");
        item.onClick(() => { this.mode = "favorites"; this.searchQuery = ""; this.render(); });
      });
      menu.addItem(item => {
        item.setTitle(s.recent).setIcon("clock");
        item.onClick(() => { this.mode = "recent"; this.searchQuery = ""; this.render(); });
      });
      menu.addSeparator();
      menu.addItem(item => {
        item.setTitle(s.newDoc).setIcon("file-plus");
        item.onClick(async () => { await this.createNoteWithName(this.folder.path); });
      });
      menu.addItem(item => {
        item.setTitle(s.createFolder).setIcon("folder-plus");
        item.onClick(() => {
          new CreateFolderModal(this.app, this.folder.path, s, async (name) => {
            const path = this.folder.path + "/" + name;
            await this.app.vault.createFolder(path);
            await this.render();
          }).open();
        });
      });
      menu.addSeparator();
      menu.addItem(item => {
        item.setTitle(s.openSettings).setIcon("settings");
        item.onClick(() => {
          (this.app as any).setting.open();
          (this.app as any).setting.openTabById("visual-explorer");
        });
      });
      if (e instanceof MouseEvent) menu.showAtMouseEvent(e);
      else { const t = e.touches[0] || e.changedTouches[0]; menu.showAtPosition({ x: t.clientX, y: t.clientY }); }
    });
  }

  async renderList(
    listContainer: HTMLElement,
    filesFolder: string,
    dateLocale: string,
    sortBy: string,
    titleWrap: boolean,
    thumbnailSize: number
  ) {
    listContainer.empty();
    const { language, recentCount, showPreview } = this.plugin.settings;
    const s = STRINGS[language];
    const q = this.searchQuery.toLowerCase();

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

      // Counter
      const toolbar = this.containerEl.querySelector(".note-gallery-toolbar") as HTMLElement;
      const existingCounter = toolbar?.querySelector(".note-gallery-counter");
      if (existingCounter) existingCounter.remove();
      if (toolbar) {
        const counter = toolbar.createDiv({ cls: "note-gallery-counter" });
        counter.setText(files.length + " " + s.notes);
      }

      for (const file of files) {
        await this.renderNoteCard(listContainer, file, filesFolder, dateLocale, titleWrap, thumbnailSize);
      }

      listContainer.createDiv({ cls: "note-gallery-list-spacer" });
      return;
    }

    // ── Folder mode ──────────────────────────────────────────
    const subfolders = this.folder.children
      .filter((f): f is TFolder => f instanceof TFolder)
      .filter(f => !q || f.name.toLowerCase().includes(q))
      .sort((a, b) => sortBy === "name-desc"
        ? b.name.localeCompare(a.name)
        : a.name.localeCompare(b.name));

    for (const subfolder of subfolders) {
      const card = listContainer.createDiv({ cls: "note-gallery-card note-gallery-folder-card" });
      const chevron = card.createDiv({ cls: "note-gallery-folder-chevron" });
      chevron.setText("›");
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
                const newPath = (subfolder.parent?.path ?? "") + "/" + newName;
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
    }

    let files = this.folder.children
      .filter((f): f is TFile => f instanceof TFile)
      .filter(f => {
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

    // Counter
    const toolbar = this.containerEl.querySelector(".note-gallery-toolbar") as HTMLElement;
    const existingCounter = toolbar?.querySelector(".note-gallery-counter");
    if (existingCounter) existingCounter.remove();
    if (toolbar) {
      const counter = toolbar.createDiv({ cls: "note-gallery-counter" });
      counter.setText(files.length + " " + s.files + (subfolders.length > 0 ? ` · ${subfolders.length} ` + s.subfolders : ""));
    }

    for (const file of files) {
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
    const content = await this.app.vault.read(file);
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;

    const imgPath = extractFirstImage(content);
    const previewText = extractPreviewText(content);
    const category = extractCategories(frontmatter);
    const dateStr = formatDate(frontmatter, file, dateLocale);
    const favorite = isFavorite(frontmatter);

    const card = listContainer.createDiv({ cls: "note-gallery-card" });

    // Left: text
    const textDiv = card.createDiv({ cls: "note-gallery-text" });
    const titleRow = textDiv.createDiv({ cls: "note-gallery-title-row" });
    if (favorite) titleRow.createSpan({ cls: "note-gallery-favorite-star", text: "★ " });
    const titleEl = titleRow.createSpan({ cls: "note-gallery-title" });
    titleEl.setText(file.basename);
    if (titleWrap) titleEl.addClass("note-gallery-title--wrap");

    if (category) textDiv.createDiv({ cls: "note-gallery-category", text: category });
    textDiv.createDiv({ cls: "note-gallery-date", text: dateStr });
    if (showPreview && previewText) {
      const previewEl = textDiv.createDiv({ text: previewText });
      previewEl.addClass(previewLines === 2 ? "note-gallery-preview--two-lines" : "note-gallery-preview");
    }

    // Right: image
    if (imgPath) {
      const imgDiv = card.createDiv({ cls: "note-gallery-thumb" });
      imgDiv.style.width = thumbnailSize + "px";
      imgDiv.style.height = thumbnailSize + "px";

      const pathsToTry = [
        imgPath,
        filesFolder + "/" + imgPath.split("/").pop(),
        "Vault/" + imgPath,
        "Vault/" + filesFolder + "/" + imgPath.split("/").pop(),
        file.parent?.path + "/" + imgPath,
      ].filter(Boolean) as string[];

      let imgFile: TFile | null = null;
      for (const p of pathsToTry) {
        const found = this.app.vault.getAbstractFileByPath(p);
        if (found instanceof TFile) { imgFile = found; break; }
      }

      if (imgFile) {
        const url = this.app.vault.getResourcePath(imgFile);
        const img = imgDiv.createEl("img");
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
              const newPath = file.parent?.path + "/" + newName + ".md";
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

    const card = listContainer.createDiv({ cls: "note-gallery-card" });

    const textDiv = card.createDiv({ cls: "note-gallery-text" });
    const titleRow = textDiv.createDiv({ cls: "note-gallery-title-row" });
    const titleEl = titleRow.createSpan({ cls: "note-gallery-title" });
    titleEl.setText(file.name);
    if (titleWrap) titleEl.addClass("note-gallery-title--wrap");

    textDiv.createDiv({ cls: "note-gallery-category", text: file.extension.toUpperCase() });
    textDiv.createDiv({ cls: "note-gallery-date", text: dateStr });

    if (isImage) {
      const imgDiv = card.createDiv({ cls: "note-gallery-thumb" });
      imgDiv.style.width = thumbnailSize + "px";
      imgDiv.style.height = thumbnailSize + "px";
      const url = this.app.vault.getResourcePath(file);
      const img = imgDiv.createEl("img");
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
              const newPath = file.parent?.path + "/" + newName + "." + file.extension;
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
      .setName(s.stFilesFolder)
      .setDesc(s.stFilesFolderDesc)
      .addText(text =>
        text.setPlaceholder("Files").setValue(this.plugin.settings.filesFolder)
          .onChange(async (value) => { this.plugin.settings.filesFolder = value.trim(); await this.plugin.saveSettings(); })
      );

    // ── Sortierung & Ansichten / Sorting & Views ──────────────────
    containerEl.createEl("h3", { text: s.stSectionSort, cls: "note-gallery-settings-section" });

    new Setting(containerEl)
      .setName(s.stSortBy)
      .setDesc(s.stSortByDesc)
      .addDropdown(drop =>
        drop.addOption("modified-desc", s.stSortModified)
          .addOption("modified-asc",  s.stSortModifiedAsc)
          .addOption("created-desc",  s.stSortCreatedDesc)
          .addOption("created-asc",   s.stSortCreatedAsc)
          .addOption("name-asc",      s.stSortNameAsc)
          .addOption("name-desc",     s.stSortNameDesc)
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value) => {
            this.plugin.settings.sortBy = value as NoteGallerySettings["sortBy"];
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(s.stRecentCount)
      .setDesc(s.stRecentCountDesc)
      .addSlider(slider =>
        slider.setLimits(5, 100, 5).setValue(this.plugin.settings.recentCount).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.recentCount = value; await this.plugin.saveSettings(); })
      );

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

    this.app.workspace.onLayoutReady(() => {
      if (this.settings.openOnStartup) {
        this.activateView();
      }
    });

    const sInit = STRINGS[this.settings.language];
    this.addRibbonIcon("layout-grid", sInit.openGallery, async () => {
      await this.openGallery(this.app.vault.getRoot());
    });

    this.addCommand({
      id: "open-note-gallery",
      name: sInit.openGallery,
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    const legacyMap: Record<string, NoteGallerySettings["sortBy"]> = {
      modified: "modified-desc",
      created: "created-desc",
      name: "name-asc",
    };
    if (legacyMap[this.settings.sortBy as string]) {
      this.settings.sortBy = legacyMap[this.settings.sortBy as string];
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
