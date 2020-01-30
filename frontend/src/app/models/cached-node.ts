export enum CachedNodeUnsavedState {
  Unmodified,
  New = 1 << 1,
  Removed = 1 << 2,
  Renamed = 1 << 3
}

export class CachedNode {
  private readonly _originalName: string;
  private _name: string;
  private _isRemoved = false;

  public get isRemoved() {
    return this._isRemoved;
  }

  public get name() {
    return this._name;
  }

  public set name(value: string) {
    this._name = value;
    if (this.unsavedState === CachedNodeUnsavedState.Unmodified && this._name !== this._originalName) {
      this.unsavedState = CachedNodeUnsavedState.Renamed;
    }
  }

  public readonly children = new Array<CachedNode>();

  constructor(
    public readonly id: number,
    public readonly parentId: number | null,
    name: string,
    public unsavedState: CachedNodeUnsavedState
  ) {
    this._originalName = this._name = name;
  }

  markAsRemoved() {
    this._isRemoved = true;
    this.children.forEach(x => x.markAsRemoved());
  }

  cascadeMarkAsRemoved() {
    this.markAsRemoved();
    this.children.forEach(x => x.markAsRemoved());
  }

  resetUnsavedState() {
    this.unsavedState = CachedNodeUnsavedState.Unmodified;
  }

  addChild(child: CachedNode) {
    this.children.push(child);
  }

  cascadeInheritRemovedFlag(isParentRemoved?: boolean) {
    if (isParentRemoved) {
      this.markAsRemoved();
    }
    this.children.forEach(c => c.cascadeInheritRemovedFlag(this.isRemoved));
  }

  clearChildren() {
    this.children.length = 0;
  }

  getAllChildrenIds(): Array<number> {
    let result = this.children
      .filter(x => x.isRemoved === false)
      .map(x => x.id);
    this.children.forEach(x => {
      result = result.concat(x.getAllChildrenIds());
    });
    return result;
  }
}
