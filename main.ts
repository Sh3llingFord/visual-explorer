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

const VIEW_TYPE = "note-gallery";

interface NoteGallerySettings {
  thumbnailSize: number;
  filesFolder: string;
  dateLocale: string;
  sortBy: "modified" | "created" | "name";
  titleWrap: boolean;
  backButtonPosition: "bottom-left" | "bottom-right";
  language: "de" | "en";
  recentCount: number;
  showPreview: boolean;
  breadcrumbFontSize: number;
}

const DEFAULT_SETTINGS: NoteGallerySettings = {
  thumbnailSize: 72,
  filesFolder: "Files",
  dateLocale: "de-DE",
  sortBy: "modified",
  titleWrap: false,
  backButtonPosition: "bottom-left",
  language: "de",
  recentCount: 30,
  showPreview: true,
  breadcrumbFontSize: 12,
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
    subfolders: "Unterordner",
    deleted: (name: string) => `"${name}" gelöscht`,
    newNote: (date: string) => `Neue Notiz ${date}`,
    renameFolder: "Ordner umbenennen",
    deleteFolder: "Ordner löschen",
    newNoteInFolder: "Neue Notiz hier",
    deleteFolderTitle: "Ordner löschen?",
    deleteFolderConfirm: (name: string) => `"${name}" und alle Inhalte werden in den Papierkorb verschoben.`,
    actions: "Aktionen",
    backTitle: "Zurück",
    error: "Fehler",
    openGallery: "Note Gallery öffnen",
    openAsGallery: "Als Galerie öffnen",
    stThumbSize: "Thumbnail-Größe",
    stThumbSizeDesc: "Breite und Höhe des Vorschaubilds in Pixeln",
    stFilesFolder: "Dateien-Ordner",
    stFilesFolderDesc: "Pfad zum Ordner mit Bilddateien (relativ zum Vault-Root)",
    stSortBy: "Sortierung",
    stSortByDesc: "Notizen sortieren nach",
    stSortModified: "Änderungsdatum (neueste zuerst)",
    stSortCreated: "Erstelldatum (neueste zuerst)",
    stSortName: "Name (A–Z)",
    stDateLocale: "Datumsformat",
    stDateLocaleDesc: "Sprache für die Datumsanzeige",
    stBackBtnPos: "Zurück-Button Position",
    stBackBtnPosDesc: "Position des schwebenden Zurück-Buttons",
    stBackLeft: "Unten links (Rechtshänder)",
    stBackRight: "Unten rechts (Linkshänder)",
    stTitleWrap: "Titel umbrechen",
    stTitleWrapDesc: "Lange Titel umbrechen statt abschneiden",
    stRecentCount: "Anzahl \"Zuletzt geöffnet\"",
    stRecentCountDesc: "Wie viele Notizen unter \"Zuletzt geöffnet\" angezeigt werden",
    stShowPreview: "Vorschautext anzeigen",
    stShowPreviewDesc: "Ersten Zeilen der Notiz unterhalb des Datums anzeigen",
    stBreadcrumbSize: "Breadcrumb-Schriftgröße",
    stBreadcrumbSizeDesc: "Schriftgröße des Breadcrumb-Pfads in Pixeln",
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
    subfolders: "Subfolders",
    deleted: (name: string) => `"${name}" deleted`,
    newNote: (date: string) => `New note ${date}`,
    renameFolder: "Rename folder",
    deleteFolder: "Delete folder",
    newNoteInFolder: "New note here",
    deleteFolderTitle: "Delete folder?",
    deleteFolderConfirm: (name: string) => `"${name}" and all its contents will be moved to trash.`,
    actions: "Actions",
    backTitle: "Back",
    error: "Error",
    openGallery: "Open Note Gallery",
    openAsGallery: "Open as gallery",
    stThumbSize: "Thumbnail size",
    stThumbSizeDesc: "Width and height of the preview image in pixels",
    stFilesFolder: "Files folder",
    stFilesFolderDesc: "Path to the folder with image files (relative to vault root)",
    stSortBy: "Sort by",
    stSortByDesc: "Criterion for sorting notes",
    stSortModified: "Date modified (newest first)",
    stSortCreated: "Date created (newest first)",
    stSortName: "Name (A–Z)",
    stDateLocale: "Date format",
    stDateLocaleDesc: "Language for date display",
    stBackBtnPos: "Back button position",
    stBackBtnPosDesc: "Position of the floating back button",
    stBackLeft: "Bottom left (right-handed)",
    stBackRight: "Bottom right (left-handed)",
    stTitleWrap: "Wrap title",
    stTitleWrapDesc: "Allow long titles to wrap instead of truncating",
    stRecentCount: "Recently opened count",
    stRecentCountDesc: "How many notes to show under \"Recently opened\"",
    stShowPreview: "Show preview",
    stShowPreviewDesc: "Show the first lines of the note below the date",
    stBreadcrumbSize: "Breadcrumb font size",
    stBreadcrumbSizeDesc: "Font size of the breadcrumb path in pixels",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

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
  if (Array.isArray(cats) && cats.length > 0) return "#" + cats[0];
  const tags = frontmatter?.tags;
  if (Array.isArray(tags) && tags.length > 0) return "#" + tags[0];
  return "";
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

// ── Context Menu ─────────────────────────────────────────────────────────────

function showContextMenu(
  app: App,
  e: MouseEvent | TouchEvent,
  items: { label: string; icon?: string; danger?: boolean; action: () => void }[]
) {
  const menu = new Menu();

  for (const item of items) {
    menu.addItem((menuItem) => {
      menuItem.setTitle(item.label);
      if (item.icon) menuItem.setIcon(item.icon);
      if (item.danger) menuItem.setWarning(true);
      menuItem.onClick(() => item.action());
    });
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
  private _viewportCleanup?: () => void;

  constructor(leaf: WorkspaceLeaf, folder: TFolder, plugin: NoteGalleryPlugin) {
    super(leaf);
    this.folder = folder;
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Note Gallery"; }
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
        this.breadcrumb = this.buildBreadcrumb(found);
      }
    }
    this.load();
    await this.render();
  }

  buildBreadcrumb(folder: TFolder): TFolder[] {
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
    this.mode = "folder";
    this.folder = folder;
    this.folderPath = folder.path;
    this.breadcrumb = this.buildBreadcrumb(folder);
    this.searchQuery = "";
    await this.render();
  }

  async onOpen() {
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

    const { thumbnailSize, filesFolder, dateLocale, sortBy, titleWrap, backButtonPosition, language, breadcrumbFontSize } = this.plugin.settings;
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

    const listContainer = container.createDiv({ cls: "note-gallery-list" });
    await this.renderList(listContainer, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);

    this.buildFloatingBackBtn(container, s, backButtonPosition);
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
      showContextMenu(this.app, e, [
        {
          label: s.favorites,
          icon: "star",
          action: () => { this.mode = "favorites"; this.searchQuery = ""; this.render(); }
        },
        {
          label: s.recent,
          icon: "clock",
          action: () => { this.mode = "recent"; this.searchQuery = ""; this.render(); }
        },
        {
          label: s.newDoc,
          icon: "file-plus",
          action: async () => { await this.createNoteWithName(this.folder.path); }
        },
        {
          label: s.createFolder,
          icon: "folder-plus",
          action: () => {
            new CreateFolderModal(this.app, this.folder.path, s, async (name) => {
              const path = this.folder.path + "/" + name;
              await this.app.vault.createFolder(path);
              await this.render();
            }).open();
          }
        },
      ]);
    });
  }

  private buildFloatingBackBtn(container: HTMLElement, s: typeof STRINGS["de"], backButtonPosition: string) {
    const isRoot = !this.folder.parent || this.folder.path === "/";
    if (!isRoot && this.mode === "folder") {
      const backBtn = container.createDiv({ cls: "note-gallery-back-btn" });
      backBtn.setText("←");
      backBtn.title = s.backTitle;
      if (backButtonPosition === "bottom-right") backBtn.addClass("note-gallery-back-btn--right");
      backBtn.addEventListener("click", () => {
        if (this.folder.parent) this.navigateTo(this.folder.parent);
      });
    }
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
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const subfolder of subfolders) {
      const card = listContainer.createDiv({ cls: "note-gallery-card note-gallery-folder-card" });
      const chevron = card.createDiv({ cls: "note-gallery-folder-chevron" });
      chevron.setText("›");
      const textDiv = card.createDiv({ cls: "note-gallery-text" });
      textDiv.createDiv({ cls: "note-gallery-title note-gallery-folder-title", text: subfolder.name });
      const fileCount = subfolder.children.filter(f => f instanceof TFile && (f as TFile).extension === "md").length;
      const folderCount = subfolder.children.filter(f => f instanceof TFolder).length;
      const meta = [fileCount + " " + s.notes, folderCount > 0 ? folderCount + " " + s.subfolders : ""].filter(Boolean).join(" · ");
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
              const modal = new Modal(this.app);
              modal.titleEl.setText(s.renameFolder);
              const input = modal.contentEl.createEl("input", { type: "text", cls: "note-gallery-rename-input" });
              input.value = subfolder.name;
              input.select();
              const btnRow = modal.contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
              btnRow.createEl("button", { text: s.cancel }).addEventListener("click", () => modal.close());
              const confirmBtn = btnRow.createEl("button", { text: s.renameConfirm, cls: "mod-cta" });
              confirmBtn.addEventListener("click", async () => {
                const newName = input.value.trim();
                if (newName && newName !== subfolder.name) {
                  const newPath = (subfolder.parent?.path ?? "") + "/" + newName;
                  await this.app.fileManager.renameFile(subfolder, newPath);
                  await this.render();
                }
                modal.close();
              });
              input.addEventListener("keydown", (e) => { if (e.key === "Enter") confirmBtn.click(); if (e.key === "Escape") modal.close(); });
              modal.open();
              setTimeout(() => input.focus(), 50);
            }
          },
          {
            label: s.deleteFolder,
            icon: "trash",
            danger: true,
            action: () => {
              const modal = new Modal(this.app);
              modal.titleEl.setText(s.deleteFolderTitle);
              modal.contentEl.createEl("p", { text: s.deleteFolderConfirm(subfolder.name) });
              const btnRow = modal.contentEl.createDiv({ cls: "note-gallery-modal-buttons" });
              btnRow.createEl("button", { text: s.cancel }).addEventListener("click", () => modal.close());
              const deleteBtn = btnRow.createEl("button", { text: s.deleteFolder, cls: "mod-warning" });
              deleteBtn.addEventListener("click", async () => {
                await this.app.vault.trash(subfolder, true);
                new Notice(s.deleted(subfolder.name));
                await this.render();
                modal.close();
              });
              modal.open();
            }
          },
        ]);
      };

      card.addEventListener("contextmenu", (e) => openFolderMenu(e));
      let longPressTimer: ReturnType<typeof setTimeout>;
      card.addEventListener("touchstart", (e) => { longPressTimer = setTimeout(() => openFolderMenu(e), 500); }, { passive: true });
      card.addEventListener("touchend", () => clearTimeout(longPressTimer));
      card.addEventListener("touchmove", () => clearTimeout(longPressTimer));
      card.addEventListener("click", () => this.navigateTo(subfolder));
    }

    let files = this.folder.children
      .filter((f): f is TFile => f instanceof TFile && f.extension === "md")
      .filter(f => {
        if (!q) return true;
        if (f.basename.toLowerCase().includes(q)) return true;
        const meta = this.app.metadataCache.getFileCache(f);
        const tags = [
          ...(Array.isArray(meta?.frontmatter?.tags) ? meta.frontmatter.tags : []),
          ...(Array.isArray(meta?.frontmatter?.categories) ? meta.frontmatter.categories : []),
        ];
        return tags.some(t => String(t).toLowerCase().includes(q));
      });

    files = files.sort((a, b) => {
      if (sortBy === "name") return a.basename.localeCompare(b.basename);
      if (sortBy === "created") return b.stat.ctime - a.stat.ctime;
      return b.stat.mtime - a.stat.mtime;
    });

    // Counter
    const toolbar = this.containerEl.querySelector(".note-gallery-toolbar") as HTMLElement;
    const existingCounter = toolbar?.querySelector(".note-gallery-counter");
    if (existingCounter) existingCounter.remove();
    if (toolbar) {
      const counter = toolbar.createDiv({ cls: "note-gallery-counter" });
      counter.setText(files.length + " " + s.notes + (subfolders.length > 0 ? ` · ${subfolders.length} ` + s.subfolders : ""));
    }

    for (const file of files) {
      await this.renderNoteCard(listContainer, file, filesFolder, dateLocale, titleWrap, thumbnailSize);
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
    const { language, showPreview } = this.plugin.settings;
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
    if (showPreview && previewText) textDiv.createDiv({ cls: "note-gallery-preview", text: previewText });

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

    // Desktop: right-click
    card.addEventListener("contextmenu", (e) => openCardMenu(e));

    // Mobile: long-press
    let longPressTimer: ReturnType<typeof setTimeout>;
    card.addEventListener("touchstart", (e) => {
      longPressTimer = setTimeout(() => openCardMenu(e), 500);
    }, { passive: true });
    card.addEventListener("touchend", () => clearTimeout(longPressTimer));
    card.addEventListener("touchmove", () => clearTimeout(longPressTimer));

    // Open note on tap/click
    card.addEventListener("click", () => {
      this.app.workspace.getLeaf(false).openFile(file);
    });
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
    containerEl.createEl("h2", { text: "Note Gallery" });

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

    new Setting(containerEl)
      .setName(s.stSortBy)
      .setDesc(s.stSortByDesc)
      .addDropdown(drop =>
        drop.addOption("modified", s.stSortModified)
          .addOption("created", s.stSortCreated)
          .addOption("name", s.stSortName)
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value) => { this.plugin.settings.sortBy = value as "modified" | "created" | "name"; await this.plugin.saveSettings(); })
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
      .setName(s.stBackBtnPos)
      .setDesc(s.stBackBtnPosDesc)
      .addDropdown(drop =>
        drop.addOption("bottom-left", s.stBackLeft)
          .addOption("bottom-right", s.stBackRight)
          .setValue(this.plugin.settings.backButtonPosition)
          .onChange(async (value) => { this.plugin.settings.backButtonPosition = value as "bottom-left" | "bottom-right"; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stTitleWrap)
      .setDesc(s.stTitleWrapDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.titleWrap)
          .onChange(async (value) => { this.plugin.settings.titleWrap = value; await this.plugin.saveSettings(); })
      );

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
      .setName(s.stRecentCount)
      .setDesc(s.stRecentCountDesc)
      .addSlider(slider =>
        slider.setLimits(5, 100, 5).setValue(this.plugin.settings.recentCount).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.recentCount = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName(s.stShowPreview)
      .setDesc(s.stShowPreviewDesc)
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.showPreview)
          .onChange(async (value) => { this.plugin.settings.showPreview = value; await this.plugin.saveSettings(); })
      );

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
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

}
