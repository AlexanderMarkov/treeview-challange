import { TreeModel, TreeNode } from 'angular-tree-component';
import { CachedNode } from '../models/cached-node';
import { ChangeModel, NodeToInsert } from './tree-api.service';

export class CachedTreeModelService {
  private _flatCachedNodes = new Array<CachedNode>();

  private _nextNewNodeIndexIterator = (function*() {
    while (true) {
      yield + new Date();
    }
  })();

  public nodes = new Array<CachedNode>();

  constructor(private readonly _treeModel: TreeModel) {}

  addNewNode() {
    const focusedNode = this._treeModel.getFocusedNode();
    const id = this._nextNewNodeIndexIterator.next().value;
    const newNode = new CachedNode(
      id,
      focusedNode.id,
      `New Node (${Math.abs(id)})`,
      'new'
    );
    focusedNode.data.children.push(newNode);
    this._flatCachedNodes.push(newNode);
    this._treeModel.update();
  }

  addDbNode(dbNode: TreeNode) {
    const existsInCache = !!this._treeModel.getNodeById(dbNode.id);
    if (existsInCache) {
      return;
    }

    const parentId = dbNode.realParent && dbNode.realParent.id;

    const cachedNode = new CachedNode(
      dbNode.data.id,
      parentId,
      dbNode.data.name,
      'unmodified'
    );

    this._flatCachedNodes.push(cachedNode);

    this.nodes = this._flatNodesToTree(this._flatCachedNodes);
  }

  removeFocusedNode() {
    const node = this._treeModel.getFocusedNode();
    this._cascadeMarkAsRemovedOrDelete(node.data);
    this.nodes = this._flatNodesToTree(this._flatCachedNodes);
    this._treeModel.update();
  }

  getChangeModel(): ChangeModel {
    const newNodes = this._flatCachedNodes.filter(x => x.state === 'new');
    const renamedNodes = this._flatCachedNodes.filter(
      x => x.state === 'renamed'
    );
    const nodesToRemove = this._flatCachedNodes
      .filter(x => x.state === 'removed')
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

  markAllNodesAsUnmodified() {
    this._flatCachedNodes.forEach(x => x.markAsUnmodified());
  }

  private _cascadeMarkAsRemovedOrDelete(node: CachedNode) {
    if (node.state === 'new') {
      const index = this._flatCachedNodes.findIndex(x => x.id === node.id);
      this._flatCachedNodes.splice(index, 1);
    } else {
      node.markAsRemoved();
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
