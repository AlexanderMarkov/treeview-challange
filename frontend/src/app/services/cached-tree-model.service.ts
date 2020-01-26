import { TreeModel, TreeNode } from 'angular-tree-component';
import { CachedNode } from '../models/cached-node';
import { ChangeModel, NodeToInsert } from './tree-api.service';

export class CachedTreeModelService {
  private _flatCachedNodes = new Array<CachedNode>();

  private _nextNewNodeIndexIterator = (function*() {
    let index = -1;
    while (true) {
      yield index--;
    }
  })();

  public nodes = new Array<CachedNode>();

  constructor(private readonly _treeModel: TreeModel) {}

  addNewNode() {
    const focusedNode = this._treeModel.getFocusedNode();
    const id = this._nextNewNodeIndexIterator.next().value;
    const newNode = new CachedNode(
      id,
      focusedNode.data.level + 1,
      focusedNode.id,
      `New Node (${Math.abs(id)})`
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
      dbNode.level,
      parentId,
      dbNode.data.name
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
    const sortedNodes = this._flatCachedNodes.sort((a, b) => a.level - b.level);

    const newNodes = sortedNodes.filter(x => x.state === 'new');
    const renamedNodes = sortedNodes.filter(x => x.state === 'renamed');
    const nodesToRemove = sortedNodes
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
      parentId: node.parentId > 0 ? node.parentId : null,
      name: node.name,
      children: node.children.map(n => this._convertToNodeToInsert(n))
    };
  }

  private _flatNodesToTree(list: Array<CachedNode>): Array<CachedNode> {
    const roots = [];
    const map: { [key: number]: CachedNode } = {};

    list.sort((a, b) => a.level - b.level);

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
