export type CachedNodeState = 'new' | 'removed' | 'renamed' | 'unmodified';

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
    if (this.state === 'unmodified' && this._name !== this._originalName) {
      this.state = 'renamed';
    }
  }

  public readonly children = new Array<CachedNode>();

  constructor(
    public readonly id: number,
    public readonly parentId: number | null,
    name: string,
    public state: CachedNodeState
  ) {
    this._originalName = this._name = name;
  }

  markAsRemoved() {
    this._isRemoved = true;
  }

  markAsUnmodified() {
    this.state = 'unmodified';
  }

  addChild(child: CachedNode) {
    if (this.state === 'removed') {
      child.markAsRemoved();
    }
    this.children.push(child);
  }

  clearChildren() {
    this.children.length = 0;
  }
}
