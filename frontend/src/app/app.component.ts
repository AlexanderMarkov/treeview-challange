import { Component, ViewChild, OnInit } from '@angular/core';
import { TreeComponent, TreeNode } from 'angular-tree-component';
import { TreeBackendApi, ChangeModel, NodeToInsert, DbNode } from './services/tree-api.service';

// interface DbNode {
//   id: number;
//   name: string;
//   children?: Array<DbNode>;
// }

type CachedNodeState = 'new' | 'removed' | 'renamed' | 'unmodified';

interface CachedNode {
  id: number;
  name: string;
  parentId: number | null;
  level: number;
  children: Array<CachedNode>;
  state: CachedNodeState;
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

  private _listOfCachedNodes = new Array<CachedNode>();

  dbNodes: Array<DbNode> = [];
  cachedNodes: Array<CachedNode> = [];
  options = {};

  private _nextNewNodeIndex = -1;

  constructor(private _backend: TreeBackendApi) {}

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
        this._listOfCachedNodes = [];
        this._cachedTree.treeModel.update();
      }
    });
  }

  addNode() {
    const focusedNode = this._cachedTree.treeModel.getFocusedNode();
    const id = this._nextNewNodeIndex--;
    const newNode: CachedNode = {
      id,
      name: `New Node (${Math.abs(id)})`,
      children: [],
      state: 'new',
      level: focusedNode.data.level + 1,
      parentId: focusedNode.id
    };
    focusedNode.data.children.push(newNode);
    this._listOfCachedNodes.push(newNode);
    this._cachedTree.treeModel.update();
  }

  removeNode() {
    const node: CachedNode = this._cachedTree.treeModel.getFocusedNode().data;
    if (node.state === 'new') {
      // TODO: remove it on client side
    } else {
      node.state = 'removed';
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
    const dbNodeModel: TreeNode = this._dbTree.treeModel.focusedNode;
    const dbNodeId = dbNodeModel.id;

    const existsInCache = !!this._cachedTree.treeModel.getNodeById(dbNodeId);
    if (existsInCache) {
      return;
    }

    const parentId = dbNodeModel.realParent ? dbNodeModel.realParent.id : null;

    const cachedNode: CachedNode = {
      id: dbNodeModel.data.id,
      name: dbNodeModel.data.name,
      level: dbNodeModel.level,
      children: [],
      state: 'unmodified',
      parentId
    };

    this._listOfCachedNodes.push(cachedNode);
    this._listOfCachedNodes = this._listOfCachedNodes.sort(
      (a, b) => a.level - b.level
    );

    this.cachedNodes = [...this._listToTree(this._listOfCachedNodes)];
  }

  convertToNodeToInsert(node: CachedNode): NodeToInsert {
    return {
      parentId: node.parentId > 0 ? node.parentId : null,
      name: node.name,
      children: node.children.map(n => this.convertToNodeToInsert(n))
    };
  }

  applyChanges() {
    const sortedNodes = this._listOfCachedNodes.sort(
      (a, b) => a.level - b.level
    );

    const newNodes = sortedNodes.filter(x => x.state === 'new');
    const renamedNodes = sortedNodes.filter(x => x.state === 'renamed');
    const nodesToRemove = sortedNodes.filter(x => x.state === 'removed').map(x => x.id);

    const nodesToInsert = this._listToTree(newNodes).map(node => this.convertToNodeToInsert(node));

    const changeModel: ChangeModel = {
      nodesToInsert,
      nodesToRemove
    };

    this._backend.applyChanges(changeModel).subscribe({
      next: () => this.init()
    });
  }

  private _listToTree(list: Array<CachedNode>): Array<CachedNode> {
    const roots = [];
    const map = {};

    list = [...list];

    for (let i = 0; i < list.length; ++i) {
      map[list[i].id] = i;
      list[i].children = [];
    }
    for (let i = 0; i < list.length; ++i) {
      const node = list[i];
      if (node.parentId) {
        if (map[node.parentId] != null) {
          list[map[node.parentId]].children.push(node);
        } else {
          roots.push(node); // TODO: Check level?
        }
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
