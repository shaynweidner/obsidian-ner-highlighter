import _ from 'lodash';
import lokijs from 'lokijs';
import { TypedEmitter } from 'tiny-typed-emitter';
import type { TFile } from 'obsidian';

import type { PluginHelper } from '../plugin-helper';

type Document = {
  fileCreationTime: number;
  type: 'tag' | 'alias' | 'page' | 'page-token';
  keyword: string;
  originalText: string;
  replaceText: string;
};

interface IndexerEvents {
  indexRebuilt: () => void;
  indexUpdated: () => void;
}

export class Indexer extends TypedEmitter<IndexerEvents> {
  private documents: Collection<Document>;

  constructor(private pluginHelper: PluginHelper) {
    super();

    const db = new lokijs('sidekick');

    this.documents = db.addCollection<Document>('documents', {
      indices: ['fileCreationTime', 'keyword'],
    });
  }

  public getKeywords(): string[] {
    const keywords = this.documents
      .find({
        fileCreationTime: { $ne: this.pluginHelper.activeFile.stat.ctime }, // Always exclude indices related to active file
      })
      .map((doc) => doc.keyword);

    return _.uniq(keywords);
  }

  public getDocumentsByKeyword(keyword: string): Document[] {
    return this.documents.find({
      keyword,
      fileCreationTime: { $ne: this.pluginHelper.activeFile.stat.ctime }, // Always exclude indices related to active file
    });
  }

  public buildIndex(): void {
    this.emit('indexRebuilt');
  }

  public replaceFileIndices(file: TFile): void {
    // Remove all indices related to modified file
    this.documents.findAndRemove({ fileCreationTime: file.stat.ctime });

    this.emit('indexUpdated');
  }
}
