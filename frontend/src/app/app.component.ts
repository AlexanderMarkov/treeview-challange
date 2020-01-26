import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { TreeComponent  } from 'angular-tree-component';
import { TreeBackendApi, DbNode } from './services/tree-api.service';
import { CachedNode } from './models/cached-node';
import { CachedTreeModelService } from './services/cached-tree-model.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('dbTree', { static: true })
  private _dbTree: TreeComponent;

  @ViewChild('cachedTree', { static: true })
  private _cachedTree: TreeComponent;

  private _cachedTreeModel: CachedTreeModelService;

  dbNodes: Array<DbNode> = [];

  get cachedNodes(): Array<CachedNode> {
    return this._cachedTreeModel.nodes;
  }

  constructor(
    private _backend: TreeBackendApi,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this._init();
  }

  addNewNode() {
    this._cachedTreeModel.addNewNode();
  }

  removeNode() {
    this._cachedTreeModel.removeFocusedNode();
  }

  addDbNode() {
    const dbNode = this._dbTree.treeModel.getFocusedNode();
    this._cachedTreeModel.addDbNode(dbNode);
  }

  reset() {
    this._backend.reset().subscribe({
      next: () => {
        this._init();
      }
    });
  }

  applyChanges() {
    const changeModel = this._cachedTreeModel.getChangeModel();

    this._backend.applyChanges(changeModel).subscribe({
      next: () => this._init()
    });
  }

  private _init() {
    this._backend.getRoot().subscribe({
      next: root => {
        this.dbNodes = [root];
        this._dbTree.treeModel.update();

        this._cachedTreeModel = new CachedTreeModelService(this._cachedTree.treeModel);

        this._cdRef.detectChanges();
      }
    });
  }
}
