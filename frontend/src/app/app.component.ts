import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { TreeComponent  } from 'angular-tree-component';
import { TreeBackendApi, DbNode } from './services/tree-api.service';
import { CachedNode } from './models/cached-node';
import { CachedTreeModelService } from './services/cached-tree-model.service';
import { tap } from 'rxjs/operators';

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
    this._cachedTreeModel = new CachedTreeModelService(
      this._cachedTree.treeModel
    );
    this._refreshRoot();
  }

  addNewNode() {
    this._cachedTreeModel.addNewNode();
  }

  removeNode() {
    this._cachedTreeModel.removeFocusedNode();
  }

  addDbNode() {
    const id = this._dbTree.treeModel.getFocusedNode().id;
    this._backend
      .getNodeById(id)
      .pipe(tap(dbNode => this._cachedTreeModel.addDbNode(dbNode)))
      .subscribe();
  }

  reset() {
    this._backend
      .reset()
      .pipe(tap(() => {
        this._refreshRoot();
        this._cachedTreeModel = new CachedTreeModelService(
          this._cachedTree.treeModel
        );
      }))
      .subscribe();
  }

  applyChanges() {
    const changeModel = this._cachedTreeModel.getChangeModel();

    this._backend
      .applyChanges(changeModel)
      .pipe(
        tap(() => {
          this._refreshRoot();
          this._cachedTreeModel.markAllNodesAsUnmodified();
        })
      )
      .subscribe();
  }

  private _refreshRoot() {
    this._backend
      .getRoot()
      .pipe(
        tap(root => {
          this.dbNodes = [root];
          this._dbTree.treeModel.update();
          this._cdRef.detectChanges();
        })
      )
      .subscribe();
  }
}
