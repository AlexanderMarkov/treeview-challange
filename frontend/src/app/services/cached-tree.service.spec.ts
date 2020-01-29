import { mock, when, instance } from 'ts-mockito';
import { TreeModel, TreeNode } from 'angular-tree-component';
import { DbNode } from './tree-api.service';
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

  });

});
