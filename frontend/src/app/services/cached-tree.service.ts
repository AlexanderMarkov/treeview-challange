import { TreeModel } from 'angular-tree-component';
import { CachedNode } from '../models/cached-node';
import { ChangeModel, NodeToInsert, DbNode } from './tree-api.service';

export class CachedTreeService {
  private _flatCachedNodes = new Array<CachedNode>();

  private _nextNewNodeIndexIterator = (function*() {
    while (true) {
      yield + new Date();
    }
  })();

  public nodes = new Array<CachedNode>();

  constructor(private readonly _treeModel: TreeModel) {}

  addNewNode(): CachedNode {
    const focusedNode = this._treeModel.getFocusedNode().data as CachedNode;
    const newId = this._nextNewNodeIndexIterator.next().value;

    const newNode = new CachedNode(
      newId,
      focusedNode.id,
      `New Node (${newId})`,
      'new'
    );

    focusedNode.children.push(newNode);
    this._flatCachedNodes.push(newNode);
    this._treeModel.update();

    return newNode;
  }

  addDbNode(dbNode: DbNode): CachedNode {
    const existsInCache = !!this._treeModel.getNodeById(dbNode.id);
    if (existsInCache) {
      return;
    }

    const cachedNode = new CachedNode(
      dbNode.id,
      dbNode.parentId,
      dbNode.name,
      'unmodified'
    );

    this._flatCachedNodes.push(cachedNode);

    this._flatNodesToTree(this._flatCachedNodes).forEach(root => {
      root.cascadeInheritRemovedFlag();
    });
    this._deleteAllNewUnsavedMarkedAsRemovedNodes();

    return cachedNode;
  }

  removeFocusedNode() {
    const node = this._treeModel.getFocusedNode().data as CachedNode;
    if (node.unsavedState === 'unmodified') {
      node.unsavedState = 'removed';
    }
    node.cascadeMarkAsRemoved();
    this._deleteAllNewUnsavedMarkedAsRemovedNodes();
  }

  getChangeModel(): ChangeModel {
    const newNodes = this._flatCachedNodes.filter(x => x.unsavedState === 'new');
    const renamedNodes = this._flatCachedNodes.filter(
      x => x.unsavedState === 'renamed'
    );
    const nodesToRemove = this._flatCachedNodes
      .filter(x => x.unsavedState === 'removed' || (x.unsavedState === 'renamed' && x.isRemoved))
      .map(x => x.id);

    const nodesToInsert = this._flatNodesToTree(newNodes).map(node =>
      this._convertToNodeToInsert(node)
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

    return changeModel;
  }

  resetUnsavedStateForAllNodes() {
    this._flatCachedNodes.forEach(x => x.resetUnsavedState());
  }

  markNodesAsRemoved(ids: number[]) {
    ids.forEach(id => this._flatCachedNodes.find(x => x.id === id).cascadeMarkAsRemoved());
  }

  getNodeIdsWhichNeedToRefreshRemovedState(): Array<number> {
    if (this._flatCachedNodes.some(x => x.unsavedState === 'removed')) {
      const nodes = this.nodes.filter(x => x.parentId && x.isRemoved === false);
      return nodes.reduce((result, x) => [...result, x.id, ...x.getAllChildrenIds()], []);
    }
    return [];
  }

  private _deleteAllNewUnsavedMarkedAsRemovedNodes() {
    this._flatCachedNodes = this._flatCachedNodes.filter(x => !(x.unsavedState === 'new' && x.isRemoved));
    this.nodes = this._flatNodesToTree(this._flatCachedNodes);
    this._treeModel.update();
  }

  private _cascadeMarkAsRemovedOrDelete(node: CachedNode) {
    if (node.unsavedState === 'new') {
      const index = this._flatCachedNodes.findIndex(x => x.id === node.id);
      this._flatCachedNodes.splice(index, 1);
    } else {
      node.cascadeMarkAsRemoved();
    }
    node.children.forEach(n => this._cascadeMarkAsRemovedOrDelete(n));
  }


  private _convertToNodeToInsert(node: CachedNode): NodeToInsert {
    return {
      id: node.id,
      parentId: node.parentId,
      name: node.name,
      children: node.children.map(n => this._convertToNodeToInsert(n))
    };
  }

  private _flatNodesToTree(list: Array<CachedNode>): Array<CachedNode> {
    const roots = [];
    const map: { [key: number]: CachedNode } = {};

    for (const node of list) {
      map[node.id] = node;
      node.clearChildren();
    }

    for (const node of list) {
      if (map[node.parentId]) {
        map[node.parentId].addChild(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
