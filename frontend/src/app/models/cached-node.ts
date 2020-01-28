export type CachedNodeUnsavedState = 'new' | 'removed' | 'renamed' | 'unmodified';

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
    if (this.unsavedState === 'unmodified' && this._name !== this._originalName) {
      this.unsavedState = 'renamed';
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
  }

  markAsUnmodified() {
    this.unsavedState = 'unmodified';
  }

  addChild(child: CachedNode) {
    this.children.push(child);
  }

  cascadeInheritRemovedState(isParentRemoved?: boolean) {
    if (isParentRemoved) {
      this.markAsRemoved();
    }
    this.children.forEach(c => c.cascadeInheritRemovedState(this.isRemoved));
  }

  clearChildren() {
    this.children.length = 0;
  }
}
