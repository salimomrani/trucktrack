import { InjectionToken } from '@angular/core';
import { Subject, Observable } from 'rxjs';

/**
 * Injection token for dialog data
 */
export const DIALOG_DATA = new InjectionToken<any>('DialogData');

/**
 * Reference to a dialog opened via the DialogService.
 * Feature 020: Angular Material to Tailwind CSS Migration
 */
export class DialogRef<R = any> {
  private readonly _afterClosed = new Subject<R | undefined>();
  private readonly _beforeClose = new Subject<R | undefined>();
  private _result?: R;

  /**
   * Gets an observable that is notified when the dialog is finished closing.
   */
  afterClosed(): Observable<R | undefined> {
    return this._afterClosed.asObservable();
  }

  /**
   * Gets an observable that is notified when the dialog is about to close.
   */
  beforeClose(): Observable<R | undefined> {
    return this._beforeClose.asObservable();
  }

  /**
   * Close the dialog, optionally with a result.
   */
  close(result?: R): void {
    this._result = result;
    this._beforeClose.next(result);
    this._beforeClose.complete();
    this._afterClosed.next(result);
    this._afterClosed.complete();
  }
}
