import { FuzzySuggestModal, TFile, TFolder } from "obsidian";
import { get_tfiles_from_folder } from "utils/Utils";
import TemplaterPlugin from "main";
import { errorWrapperSync } from "utils/Error";
import { log_error } from "utils/Log";

export enum OpenMode {
    InsertTemplate,
    CreateNoteTemplate,
}

export class FuzzySuggester extends FuzzySuggestModal<TFile> {
    private plugin: TemplaterPlugin;
    private open_mode: OpenMode;
    private creation_folder: TFolder | undefined;

    constructor(plugin: TemplaterPlugin) {
        super(app);
        this.plugin = plugin;
        this.setPlaceholder("Type name of a template...");
    }

    getItems(): TFile[] {
        if (!this.plugin.settings.templates_folder) {
            return app.vault.getMarkdownFiles();
        }
        const files = errorWrapperSync(
            () => get_tfiles_from_folder(this.plugin.settings.templates_folder),
            `Couldn't retrieve template files from templates folder ${this.plugin.settings.templates_folder}`
        );
        if (!files) {
            return [];
        }
        return files;
    }

    getItemText(item: TFile): string {
         if (this.plugin.settings.display_full_paths) {
            let relativePath = item.path
            if(this.plugin.settings.templates_folder && item.path.startsWith(this.plugin.settings.templates_folder)) {
                relativePath = item.path.slice(this.plugin.settings.templates_folder.length+1)
            }
            return relativePath.split(".").slice(0, -1).join(".");
        } else {
            return item.basename;
        }
    }

    onChooseItem(item: TFile): void {
        switch (this.open_mode) {
            case OpenMode.InsertTemplate:
                this.plugin.templater.append_template_to_active_file(item);
                break;
            case OpenMode.CreateNoteTemplate:
                this.plugin.templater.create_new_note_from_template(
                    item,
                    this.creation_folder
                );
                break;
        }
    }

    start(): void {
        try {
            this.open();
        } catch (e) {
            log_error(e);
        }
    }

    insert_template(): void {
        this.open_mode = OpenMode.InsertTemplate;
        this.start();
    }

    create_new_note_from_template(folder?: TFolder): void {
        this.creation_folder = folder;
        this.open_mode = OpenMode.CreateNoteTemplate;
        this.start();
    }
}
