import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { TreeBackendApi, ChangeModel, NodeToInsert, DbNode } from './services/tree-api.service';

// interface DbNode {
//   id: number;
//   name: string;
//   children?: Array<DbNode>;
// }

type CachedNodeState = 'new' | 'removed' | 'renamed' | 'unmodified';

class CachedNode {
  private readonly _originalName: string;
  private _name: string;
  private _state: CachedNodeState;

  public get name() {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
    if (this._state === 'unmodified' && this._name !== this._originalName) {
      this._state = 'renamed';
    }
  }

  public get state(): CachedNodeState {
    return this._state;
  }

  public children = new Array<CachedNode>();

  constructor(
    public readonly id: number,
    public readonly level: number,
    public readonly parentId: number | null,
    name: string
  ) {
    this._originalName = this._name = name;
    if (id < 0) {
      this._state = 'new';
    } else {
      this._state = 'unmodified';
    }
  }

  markAsRemoved() {
    this._state = 'removed';
  }
}


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

  private _flatCachedNodes = new Array<CachedNode>();

  dbNodes: Array<DbNode> = [];
  cachedNodes: Array<CachedNode> = [];
  options = {};

  private _nextNewNodeIndex = -1;

  constructor(
    private _backend: TreeBackendApi,
    private _cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.init();
  }

  private init() {
    this._backend.getRoot().subscribe({
      next: root => {
        this.dbNodes = [root];
        this._dbTree.treeModel.update();

        // this._nextNewNodeIndex = -1;

        this.cachedNodes = [];
        this._flatCachedNodes = [];
        this._cachedTree.treeModel.update();

        this._cdRef.detectChanges();
      }
    });
  }

  addNode() {
    const focusedNode = this._cachedTree.treeModel.getFocusedNode();
    const id = this._nextNewNodeIndex--;
    const newNode = new CachedNode(
      id,
      focusedNode.data.level + 1,
      focusedNode.id,
      `New Node (${Math.abs(id)})`
    );
    focusedNode.data.children.push(newNode);
    this._flatCachedNodes.push(newNode);
    this._cachedTree.treeModel.update();
  }

  removeNode() {
    const node = this._cachedTree.treeModel.getFocusedNode();
    if (node.data.state === 'new') {
      // TODO: remove it on client side
      if (node.realParent) {
        const children = (node.realParent.data as CachedNode).children;
        const index = children.findIndex(x => x.id === node.id);
        children.splice(index, 1);
      }
    } else {
      node.data.markAsRemoved();
    }
    this._cachedTree.treeModel.update();
  }

  reset() {
    this._backend.reset().subscribe({
      next: () => {
        this.init();
      }
    });
  }

  move() {
    const dbNode: TreeNode = this._dbTree.treeModel.focusedNode;

    const existsInCache = !!this._cachedTree.treeModel.getNodeById(dbNode.id);
    if (existsInCache) {
      return;
    }

    const parentId = dbNode.realParent && dbNode.realParent.id;

    const cachedNode = new CachedNode(
      dbNode.data.id,
      dbNode.level,
      parentId,
      dbNode.data.name
    );

    this._flatCachedNodes.push(cachedNode);

    this.cachedNodes = this._flatNodesToTree(this._flatCachedNodes);
  }

  convertToNodeToInsert(node: CachedNode): NodeToInsert {
    return {
      parentId: node.parentId > 0 ? node.parentId : null,
      name: node.name,
      children: node.children.map(n => this.convertToNodeToInsert(n))
    };
  }

  applyChanges() {
    const sortedNodes = this._flatCachedNodes.sort(
      (a, b) => a.level - b.level
    );

    const newNodes = sortedNodes.filter(x => x.state === 'new');
    const renamedNodes = sortedNodes.filter(x => x.state === 'renamed');
    const nodesToRemove = sortedNodes
      .filter(x => x.state === 'removed')
      .map(x => x.id);

    const nodesToInsert = this._flatNodesToTree(newNodes).map(node =>
      this.convertToNodeToInsert(node)
    );
    const nodesToUpdate = renamedNodes.reduce((r, n) => {
      r[n.id] = n.name;
      return r;
    }, {});

    const changeModel: ChangeModel = {
      nodesToInsert,
      nodesToRemove,
      nodesToUpdate
    };

    this._backend.applyChanges(changeModel).subscribe({
      next: () => this.init()
    });
  }

  private _flatNodesToTree(list: Array<CachedNode>): Array<CachedNode> {
    const roots = [];
    const map = {};

    list.sort((a, b) => a.level - b.level);

    list.forEach(node => {
      map[node.id] = node;
      node.children = [];
    });

    list.forEach(node => {
      if (map[node.parentId]) {
        map[node.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
