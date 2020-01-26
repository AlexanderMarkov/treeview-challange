export type CachedNodeState = 'new' | 'removed' | 'renamed' | 'unmodified';

export class CachedNode {
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

  public readonly children = new Array<CachedNode>();

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

  addChild(child: CachedNode) {
    if (this._state === 'removed') {
      child.markAsRemoved();
    }
    this.children.push(child);
  }

  clearChildren() {
    this.children.length = 0;
  }
}
