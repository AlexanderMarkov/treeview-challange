import { mock, when, instance } from 'ts-mockito';
import { TreeModel, TreeNode } from 'angular-tree-component';
import { DbNode, ChangeModel, NodeToInsert } from './tree-api.service';
import { CachedTreeService } from './cached-tree.service';

describe('CachedTreeService', () => {
  let mockedTreeModel: TreeModel;
  let service: CachedTreeService;

  beforeEach(() => {
      mockedTreeModel = mock(TreeModel);
      service = new CachedTreeService(instance(mockedTreeModel));
  });

  describe('addDbNode', () => {
    it('should inherit parents isRemove flag', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 3, parentId: 2 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes.find(x => x.id === 1)
      } as TreeNode);

      service.removeFocusedNode();
      service.addDbNode({ id: 2, parentId: 1 } as DbNode);

      expect(service.nodes[0].isRemoved).toBeTruthy();
      expect(service.nodes[0].children[0].isRemoved).toBeTruthy();
      expect(service.nodes[0].children[0].children[0].isRemoved).toBeTruthy();
    });
  });

  describe('removeFocusedNode', () => {

    it('should delete the focused node if it has a "new" state', () => {
      service.addDbNode({ id: 1 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes[0]
      } as TreeNode);

      const newNode = service.addNewNode();

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: newNode
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.nodes[0].children.length).toBe(0);
    });

    it('should change the unsavedState to "removed" only for the focused node', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 2, parentId: 1 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes[0]
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.nodes[0].unsavedState).toBe('removed');
      expect(service.nodes[0].children[0].unsavedState).toBe('unmodified');
    });

    it('should delete all new nested nodes', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 21, parentId: 2 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes[1]
      } as TreeNode);

      service.addNewNode();

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes[0]
      } as TreeNode);

      service.removeFocusedNode();

      service.addDbNode({ id: 2, parentId: 1 } as DbNode);

      expect(service.nodes[0].children[0].children[0].children.length).toBe(0);
    });

    it('should mark as removed all nested nodes', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 21, parentId: 1 } as DbNode);
      service.addDbNode({ id: 211, parentId: 21 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: service.nodes[0]
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.nodes[0].isRemoved).toBeTruthy();
      expect(service.nodes[0].children[0].isRemoved).toBeTruthy();
      expect(service.nodes[0].children[0].children[0].isRemoved).toBeTruthy();
    });

  });

  describe('getNodeIdsWhichNeedToRefreshRemovedState', () => {
    it('should return empty array if no nodes marked as removed', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 21, parentId: 2 } as DbNode);

      expect(service.getNodeIdsWhichNeedToRefreshRemovedState()).toEqual([]);
    });

    it('should not include already removed nodes', () => {
      const node1 = service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 21, parentId: 2 } as DbNode);
      service.addDbNode({ id: 211, parentId: 21 } as DbNode);

      const node211 = service.addDbNode({ id: 221, parentId: 21 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node211
      } as TreeNode);

      service.removeFocusedNode();

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node1
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.getNodeIdsWhichNeedToRefreshRemovedState()).toEqual([21, 211]);
    });

    it('should not include root and all its children', () => {
      service.addDbNode({ id: 1 } as DbNode);
      service.addDbNode({ id: 21, parentId: 1 } as DbNode);
      const node22 = service.addDbNode({ id: 22, parentId: 1 } as DbNode);

      service.addDbNode({ id: 2111, parentId: 211 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node22
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.getNodeIdsWhichNeedToRefreshRemovedState()).toEqual([2111]);
    });
  });

  describe('getChangeModel', () => {
    it('should be empty in case of no changes', () => {
      expect(service.getChangeModel()).toEqual({
        nodesToRemove: [],
        nodesToUpdate: {},
        nodesToInsert: []
      } as ChangeModel);
    });

    it('should remove and rename same node', () => {
      const node = service.addDbNode({ id: 1 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node
      } as TreeNode);

      node.name = 'new name';
      service.removeFocusedNode();

      expect(service.getChangeModel()).toEqual({
        nodesToRemove: [1],
        nodesToUpdate: {
          1: 'new name'
        },
        nodesToInsert: []
      } as ChangeModel);
    });

    it('should remove, rename and insert different nodes', () => {
      const node1 = service.addDbNode({ id: 1 } as DbNode);
      const node21 = service.addDbNode({ id: 21, parentId: 1 } as DbNode);

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node1
      } as TreeNode);

      const node22 = service.addNewNode();

      node1.name = 'new node1';

      when(mockedTreeModel.getFocusedNode()).thenReturn({
        data: node21
      } as TreeNode);

      service.removeFocusedNode();

      expect(service.getChangeModel()).toEqual({
        nodesToRemove: [21],
        nodesToUpdate: {
          1: 'new node1'
        },
        nodesToInsert: [
          {
            id: node22.id,
            parentId: 1,
            name: `New Node (${node22.id})`,
            children: []
          } as NodeToInsert
        ]
      } as ChangeModel);
    });
  });

});
