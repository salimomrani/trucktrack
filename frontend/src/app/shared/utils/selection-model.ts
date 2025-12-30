import { Subject } from 'rxjs';

/**
 * Simple SelectionModel replacement for @angular/cdk/collections
 * Provides multi-selection functionality without CDK dependency
 */
export class SelectionModel<T> {
  private _selection = new Set<T>();
  private _changed = new Subject<{ source: SelectionModel<T>; added: T[]; removed: T[] }>();

  /** Observable that emits when selection changes */
  changed = this._changed.asObservable();

  constructor(
    private _multiple = false,
    initiallySelectedValues?: T[]
  ) {
    if (initiallySelectedValues?.length) {
      if (_multiple) {
        initiallySelectedValues.forEach(value => this._selection.add(value));
      } else {
        this._selection.add(initiallySelectedValues[0]);
      }
    }
  }

  /** Get currently selected values */
  get selected(): T[] {
    return Array.from(this._selection);
  }

  /** Check if a value is selected */
  isSelected(value: T): boolean {
    return this._selection.has(value);
  }

  /** Check if selection has any value */
  hasValue(): boolean {
    return this._selection.size > 0;
  }

  /** Check if selection is empty */
  isEmpty(): boolean {
    return this._selection.size === 0;
  }

  /** Select a value */
  select(...values: T[]): void {
    const added: T[] = [];

    values.forEach(value => {
      if (!this._selection.has(value)) {
        if (!this._multiple) {
          this._selection.clear();
        }
        this._selection.add(value);
        added.push(value);
      }
    });

    if (added.length) {
      this._emitChange(added, []);
    }
  }

  /** Deselect a value */
  deselect(...values: T[]): void {
    const removed: T[] = [];

    values.forEach(value => {
      if (this._selection.has(value)) {
        this._selection.delete(value);
        removed.push(value);
      }
    });

    if (removed.length) {
      this._emitChange([], removed);
    }
  }

  /** Toggle a value's selection state */
  toggle(value: T): void {
    if (this.isSelected(value)) {
      this.deselect(value);
    } else {
      this.select(value);
    }
  }

  /** Clear all selections */
  clear(): void {
    const removed = this.selected;
    if (removed.length) {
      this._selection.clear();
      this._emitChange([], removed);
    }
  }

  private _emitChange(added: T[], removed: T[]): void {
    this._changed.next({
      source: this,
      added,
      removed
    });
  }
}
