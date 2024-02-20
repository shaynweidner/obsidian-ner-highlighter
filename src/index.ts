import { Plugin } from 'obsidian';
import type { Extension } from '@codemirror/state';

import { PluginHelper } from './plugin-helper';
import { Indexer } from './indexing/indexer';
import { suggestionsExtension } from './cmExtension/suggestionsExtension';

export default class TagsAutosuggestPlugin extends Plugin {
  private editorExtension: Extension[] = [];

  public async onload(): Promise<void> {
    console.log('Autosuggest plugin: loading plugin', new Date().toLocaleString());

    const pluginHelper = new PluginHelper(this);
    const indexer = new Indexer(pluginHelper);

    this.registerEditorExtension(this.editorExtension);

    // Update index for any file that was modified in the vault
    pluginHelper.onFileRename((file) => indexer.replaceFileIndices(file));
    pluginHelper.onFileMetadataChanged((file) => indexer.replaceFileIndices(file));

    // Re/load highlighting extension after any changes to index
    indexer.on('indexRebuilt', () => {
      this.updateEditorExtension(suggestionsExtension());
    });

    indexer.on('indexUpdated', () => {
      this.updateEditorExtension(suggestionsExtension());
    });

    // Build search index on startup (very expensive process)
    pluginHelper.onLayoutReady(() => indexer.buildIndex());
  }

  private updateEditorExtension(extension: Extension) {
    this.editorExtension.length = 0;
    this.editorExtension.push(extension);
    this.app.workspace.updateOptions();
  }

  public async onunload(): Promise<void> {
    console.log('Autosuggest plugin: unloading plugin', new Date().toLocaleString());
  }
}
