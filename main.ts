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
} from "obsidian";

const VIEW_TYPE = "note-gallery";

interface NoteGallerySettings {
  thumbnailSize: number;
  filesFolder: string;
  dateLocale: string;
  sortBy: "modified" | "created" | "name";
  titleWrap: boolean;
  backButtonPosition: "bottom-left" | "bottom-right";
}

const DEFAULT_SETTINGS: NoteGallerySettings = {
  thumbnailSize: 72,
  filesFolder: "Files",
  dateLocale: "de-DE",
  sortBy: "modified",
  titleWrap: false,
  backButtonPosition: "bottom-left",
};

function extractFirstImage(content: string): string | null {
  const wikiMatch = content.match(/!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp))[^\]]*\]\]/i);
  if (wikiMatch) return wikiMatch[1];
  const mdMatch = content.match(/!\[[^\]]*\]\(([^)]+\.(png|jpg|jpeg|gif|webp))[^)]*\)/i);
  if (mdMatch) return decodeURIComponent(mdMatch[1]);
  return null;
}

function extractPreviewText(content: string): string {
  // Remove frontmatter
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "");
  // Remove images
  const withoutImages = withoutFrontmatter
    .replace(/!\[\[[^\]]*\]\]/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "");
  // Remove markdown syntax
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
      return d.toLocaleDateString(locale, {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    }
  }
  return new Date(file.stat.mtime).toLocaleDateString(locale, {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

class ConfirmDeleteModal extends Modal {
  private fileName: string;
  private onConfirm: () => void;

  constructor(app: App, fileName: string, onConfirm: () => void) {
    super(app);
    this.fileName = fileName;
    this.onConfirm = onConfirm;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: "Notiz löschen?" });
    contentEl.createEl("p", { text: `"${this.fileName}" wird in den Papierkorb verschoben.` });

    const btnRow = contentEl.createDiv({ cls: "note-gallery-modal-buttons" });

    const cancelBtn = btnRow.createEl("button", { text: "Abbrechen" });
    cancelBtn.addEventListener("click", () => this.close());

    const deleteBtn = btnRow.createEl("button", { text: "Löschen", cls: "mod-warning" });
    deleteBtn.addEventListener("click", () => {
      this.onConfirm();
      this.close();
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}

class NoteGalleryView extends ItemView {
  folder: TFolder;
  private plugin: NoteGalleryPlugin;
  private folderPath: string = "";
  private searchQuery: string = "";
  private breadcrumb: TFolder[] = [];

  constructor(leaf: WorkspaceLeaf, folder: TFolder, plugin: NoteGalleryPlugin) {
    super(leaf);
    this.folder = folder;
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE; }

  getDisplayText() {
    return "Note Gallery";
  }

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

  async navigateTo(folder: TFolder) {
    this.folder = folder;
    this.folderPath = folder.path;
    this.breadcrumb = this.buildBreadcrumb(folder);
    this.searchQuery = "";
    await this.render();
  }

  async onOpen() {
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (file instanceof TFile && file.parent?.path === this.folder?.path) {
          await this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (file instanceof TFile && file.parent?.path === this.folder?.path) {
          await this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", async (file) => {
        if (file instanceof TFile && file.parent?.path === this.folder?.path) {
          await this.render();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", async (file) => {
        if (file instanceof TFile && file.parent?.path === this.folder?.path) {
          await this.render();
        }
      })
    );
    await this.render();
  }

  async render() {
    if (!this.folder) return;

    const { thumbnailSize, filesFolder, dateLocale, sortBy, titleWrap, backButtonPosition } = this.plugin.settings;

    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("note-gallery-container");

    // ── Toolbar ──────────────────────────────────────────────
    const toolbar = container.createDiv({ cls: "note-gallery-toolbar" });

    // Breadcrumb
    const breadcrumbEl = toolbar.createDiv({ cls: "note-gallery-breadcrumb" });
    this.breadcrumb.forEach((crumb, i) => {
      if (i > 0) breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-sep", text: " / " });
      const crumbEl = breadcrumbEl.createSpan({ cls: "note-gallery-breadcrumb-item", text: crumb.name || "Vault" });
      if (i < this.breadcrumb.length - 1) {
        crumbEl.addClass("note-gallery-breadcrumb-link");
        crumbEl.addEventListener("click", () => this.navigateTo(crumb));
      }
    });

    // Searchfield + New Note button
    const controls = toolbar.createDiv({ cls: "note-gallery-controls" });

    const searchInput = controls.createEl("input", {
      cls: "note-gallery-search",
      type: "text",
      placeholder: "Suchen…",
    });
    searchInput.value = this.searchQuery;
    searchInput.addEventListener("input", async () => {
      this.searchQuery = searchInput.value;
      await this.renderList(listContainer, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);
    });

    const newBtn = controls.createEl("button", { cls: "note-gallery-new-btn", text: "+" });
    newBtn.title = "Neue Notiz";
    newBtn.addEventListener("click", async () => {
      const name = `Neue Notiz ${new Date().toLocaleDateString("de-DE")}`;
      const path = this.folder.path + "/" + name + ".md";
      const file = await this.app.vault.create(path, "");
      await this.app.workspace.getLeaf(false).openFile(file);
    });

    // ── List ────────────────────────────────────────────────
    const listContainer = container.createDiv({ cls: "note-gallery-list" });
    await this.renderList(listContainer, filesFolder, dateLocale, sortBy, titleWrap, thumbnailSize);

    // ── Floating Back Button ─────────────────────────────────
    const isRoot = !this.folder.parent || this.folder.path === "/";
    if (!isRoot) {
      const backBtn = container.createDiv({ cls: "note-gallery-back-btn" });
      backBtn.setText("←");
      backBtn.title = "Zurück";
      if (backButtonPosition === "bottom-right") {
        backBtn.addClass("note-gallery-back-btn--right");
      }
      backBtn.addEventListener("click", () => {
        if (this.folder.parent) {
          this.navigateTo(this.folder.parent);
        }
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

    const q = this.searchQuery.toLowerCase();

    // ── Subfolders ──────────────────────────────────────────
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
      const meta = [fileCount + " Notizen", folderCount > 0 ? folderCount + " Unterordner" : ""].filter(Boolean).join(" · ");
      textDiv.createDiv({ cls: "note-gallery-date", text: meta });

      card.addEventListener("click", () => this.navigateTo(subfolder));
    }

    // ── Notes ───────────────────────────────────────────────
    let files = this.folder.children
      .filter((f): f is TFile => f instanceof TFile && f.extension === "md")
      .filter(f => !q || f.basename.toLowerCase().includes(q));

    files = files.sort((a, b) => {
      if (sortBy === "name") return a.basename.localeCompare(b.basename);
      if (sortBy === "created") return b.stat.ctime - a.stat.ctime;
      return b.stat.mtime - a.stat.mtime;
    });

    // Counter in toolbar
    const toolbar = this.containerEl.querySelector(".note-gallery-toolbar") as HTMLElement;
    const existingCounter = toolbar?.querySelector(".note-gallery-counter");
    if (existingCounter) existingCounter.remove();
    if (toolbar) {
      const counter = toolbar.createDiv({ cls: "note-gallery-counter" });
      counter.setText(files.length + (subfolders.length > 0 ? ` Notizen · ${subfolders.length} Ordner` : " Notizen"));
    }

    for (const file of files) {
      const content = await this.app.vault.read(file);
      const cache = this.app.metadataCache.getFileCache(file);
      const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;

      const imgPath = extractFirstImage(content);
      const previewText = extractPreviewText(content);
      const category = extractCategories(frontmatter);
      const dateStr = formatDate(frontmatter, file, dateLocale);

      const card = listContainer.createDiv({ cls: "note-gallery-card" });

      // Left: text
      const textDiv = card.createDiv({ cls: "note-gallery-text" });
      const titleEl = textDiv.createDiv({ cls: "note-gallery-title" });
      titleEl.setText(file.basename);
      if (titleWrap) titleEl.addClass("note-gallery-title--wrap");

      if (category) textDiv.createDiv({ cls: "note-gallery-category", text: category });
      textDiv.createDiv({ cls: "note-gallery-date", text: dateStr });

      // Preview text (shown on hover)
      if (previewText) {
        const preview = textDiv.createDiv({ cls: "note-gallery-preview", text: previewText });
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

      // Delete button
      const deleteBtn = card.createDiv({ cls: "note-gallery-delete-btn" });
      deleteBtn.setText("✕");
      deleteBtn.title = "Löschen";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        new ConfirmDeleteModal(this.app, file.basename, async () => {
          await this.app.vault.trash(file, true);
          new Notice(`"${file.basename}" gelöscht`);
          await this.render();
        }).open();
      });

      // Open note on click
      card.addEventListener("click", () => {
        this.app.workspace.getLeaf(false).openFile(file);
      });
    }
  }
}

class NoteGallerySettingTab extends PluginSettingTab {
  plugin: NoteGalleryPlugin;

  constructor(app: App, plugin: NoteGalleryPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Note Gallery" });

    new Setting(containerEl)
      .setName("Thumbnail-Größe")
      .setDesc("Breite und Höhe des Vorschaubilds in Pixeln")
      .addSlider(slider =>
        slider.setLimits(40, 160, 8).setValue(this.plugin.settings.thumbnailSize).setDynamicTooltip()
          .onChange(async (value) => { this.plugin.settings.thumbnailSize = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Dateien-Ordner")
      .setDesc("Pfad zum Ordner mit Bilddateien (relativ zum Vault-Root)")
      .addText(text =>
        text.setPlaceholder("Files").setValue(this.plugin.settings.filesFolder)
          .onChange(async (value) => { this.plugin.settings.filesFolder = value.trim(); await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Sortierung")
      .setDesc("Nach welchem Kriterium Notizen sortiert werden")
      .addDropdown(drop =>
        drop.addOption("modified", "Änderungsdatum (neueste zuerst)")
          .addOption("created", "Erstelldatum (neueste zuerst)")
          .addOption("name", "Name (A–Z)")
          .setValue(this.plugin.settings.sortBy)
          .onChange(async (value) => { this.plugin.settings.sortBy = value as "modified" | "created" | "name"; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Datumsformat")
      .setDesc("Sprache für die Datumsanzeige")
      .addDropdown(drop =>
        drop.addOption("de-DE", "Deutsch (13. Okt. 2024)")
          .addOption("en-US", "English (Oct 13, 2024)")
          .addOption("en-GB", "English UK (13 Oct 2024)")
          .setValue(this.plugin.settings.dateLocale)
          .onChange(async (value) => { this.plugin.settings.dateLocale = value; await this.plugin.saveSettings(); })
      );

    new Setting(containerEl)
      .setName("Zurück-Button Position")
      .setDesc("Position des floating Zurück-Buttons für Unterordner-Navigation")
      .addDropdown(drop =>
        drop
          .addOption("bottom-left", "Unten links (Rechtshänder)")
          .addOption("bottom-right", "Unten rechts (Linkshänder)")
          .setValue(this.plugin.settings.backButtonPosition)
          .onChange(async (value) => {
            this.plugin.settings.backButtonPosition = value as "bottom-left" | "bottom-right";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Titel umbrechen")
      .setDesc("Langen Titeln erlauben umzubrechen statt abzuschneiden")
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.titleWrap)
          .onChange(async (value) => { this.plugin.settings.titleWrap = value; await this.plugin.saveSettings(); })
      );
  }
}

export default class NoteGalleryPlugin extends Plugin {
  settings: NoteGallerySettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => {
      const root = this.app.vault.getRoot();
      return new NoteGalleryView(leaf, root, this);
    });

    this.addSettingTab(new NoteGallerySettingTab(this.app, this));

    // Ribbon Icon
    this.addRibbonIcon("layout-grid", "Note Gallery öffnen", async () => {
      await this.openGallery(this.app.vault.getRoot());
    });

    // Command
    this.addCommand({
      id: "open-note-gallery",
      name: "Note Gallery öffnen",
      callback: async () => {
        await this.openGallery(this.app.vault.getRoot());
      },
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item.setTitle("Als Galerie öffnen").setIcon("layout-grid")
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

    this.addStyles();
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

  addStyles() {
    const style = document.createElement("style");
    style.id = "note-gallery-styles";
    style.textContent = `
      .note-gallery-container {
        padding: 0;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .note-gallery-toolbar {
        padding: 10px 12px 6px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-bottom: 1px solid var(--background-modifier-border);
        position: sticky;
        top: 0;
        background: var(--background-primary);
        z-index: 10;
      }
      .note-gallery-breadcrumb {
        font-size: 12px;
        color: var(--text-muted);
      }
      .note-gallery-breadcrumb-link {
        color: var(--text-accent);
        cursor: pointer;
      }
      .note-gallery-breadcrumb-link:hover {
        text-decoration: underline;
      }
      .note-gallery-breadcrumb-sep {
        color: var(--text-faint);
      }
      .note-gallery-controls {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .note-gallery-search {
        flex: 1;
        padding: 5px 10px;
        border-radius: 6px;
        border: 1px solid var(--background-modifier-border);
        background: var(--background-secondary);
        color: var(--text-normal);
        font-size: 13px;
      }
      .note-gallery-new-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: none;
        background: var(--interactive-accent);
        color: white;
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        padding: 0;
      }
      .note-gallery-new-btn:hover {
        background: var(--interactive-accent-hover);
      }
      .note-gallery-counter {
        font-size: 11px;
        color: var(--text-faint);
        padding-bottom: 2px;
      }
      .note-gallery-list {
        overflow-y: auto;
        flex: 1;
        padding: 6px 0;
      }
      .note-gallery-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 12px 12px;
        border-bottom: 1px solid var(--background-modifier-border);
        cursor: pointer;
        transition: background 0.15s;
        gap: 12px;
        position: relative;
      }
      .note-gallery-card:hover {
        background: var(--background-modifier-hover);
      }
      .note-gallery-folder-card {
        background: transparent;
      }
      .note-gallery-folder-chevron {
        font-size: 18px;
        color: var(--text-muted);
        width: 16px;
        flex-shrink: 0;
        line-height: 1;
      }
      .note-gallery-folder-title {
        font-weight: 700;
      }
      .note-gallery-text {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .note-gallery-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-normal);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .note-gallery-title--wrap {
        white-space: normal;
        overflow: visible;
        text-overflow: unset;
      }
      .note-gallery-category {
        font-size: 12px;
        color: var(--text-accent);
      }
      .note-gallery-date {
        font-size: 12px;
        color: var(--text-muted);
      }
      .note-gallery-preview {
        font-size: 12px;
        color: var(--text-faint);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-height: 0;
        opacity: 0;
        transition: max-height 0.2s ease, opacity 0.2s ease;
      }
      .note-gallery-card:hover .note-gallery-preview {
        max-height: 40px;
        opacity: 1;
      }
      .note-gallery-thumb {
        flex-shrink: 0;
        border-radius: 6px;
        overflow: hidden;
        background: var(--background-modifier-border);
      }
      .note-gallery-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .note-gallery-delete-btn {
        position: absolute;
        right: 12px;
        top: 8px;
        font-size: 14px;
        opacity: 0;
        cursor: pointer;
        transition: opacity 0.15s;
        z-index: 2;
        padding: 2px 4px;
        border-radius: 4px;
      }
      .note-gallery-card:hover .note-gallery-delete-btn {
        opacity: 0.5;
      }
      .note-gallery-delete-btn:hover {
        opacity: 1 !important;
        background: var(--background-modifier-error);
      }
      .note-gallery-modal-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        margin-top: 16px;
      }
      .note-gallery-back-btn {
        position: absolute;
        bottom: 21px;
        left: 16px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--interactive-accent);
        color: white;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: background 0.15s, transform 0.1s;
        z-index: 20;
      }
      .note-gallery-back-btn--right {
        left: unset;
        right: 16px;
      }
      .note-gallery-back-btn:hover {
        background: var(--interactive-accent-hover);
        transform: scale(1.05);
      }
      .note-gallery-back-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);
  }

  onunload() {
    document.getElementById("note-gallery-styles")?.remove();
  }
}
