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
    public readonly parentId: number | null,
    name: string,
    state: CachedNodeState
  ) {
    this._originalName = this._name = name;
    this._state = state;
  }

  markAsRemoved() {
    this._state = 'removed';
  }

  markAsUnmodified() {
    if (this._state !== 'removed') {
      this._state = 'unmodified';
    }
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
