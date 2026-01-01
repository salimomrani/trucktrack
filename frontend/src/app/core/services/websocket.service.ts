import { Injectable, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GPSPositionEvent } from '../../models/gps-position.model';

/**
 * WebSocket service for real-time GPS position updates
 * T078: Create WebSocketService (STOMP client, RxJS observables for GPS updates)
 * Refactored with Angular 17+ best practices: signals
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();

  // Position updates using signals
  private positionUpdatesSignal = signal<GPSPositionEvent | null>(null);
  public positionUpdates = this.positionUpdatesSignal.asReadonly();

  // Connection status using signals
  private connectionStatusSignal = signal<boolean>(false);
  public connectionStatus = this.connectionStatusSignal.asReadonly();

  // T092: Error handling
  private readonly errorSource$ = new Subject<string>();
  public readonly error$ = this.errorSource$.asObservable();

  // Backward compatibility: Observable streams from signals
  public positionUpdates$: Observable<GPSPositionEvent | null> = toObservable(this.positionUpdates);
  public connectionStatus$: Observable<boolean> = toObservable(this.connectionStatus);

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.client?.connected) {
      return;
    }

    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (environment.logging.enableConsoleLogging) {
        }
      }
    });

    this.client.onConnect = () => {
      this.connectionStatusSignal.set(true);
      this.subscribeToAllPositions();
    };

    this.client.onDisconnect = () => {
      this.connectionStatusSignal.set(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error', frame);
      const errorMsg = frame.headers?.['message'] || 'WebSocket connection error';
      this.errorSource$.next(errorMsg);
      this.connectionStatusSignal.set(false);
    };

    this.client.activate();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.connectionStatusSignal.set(false);
    }
  }

  /**
   * Subscribe to all position updates
   * Channel: /topic/positions
   */
  private subscribeToAllPositions(): void {
    if (!this.client?.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const subscription = this.client.subscribe('/topic/positions', (message: IMessage) => {
      const position: GPSPositionEvent = JSON.parse(message.body);
      this.positionUpdatesSignal.set(position);
    });

    this.subscriptions.set('all-positions', subscription);
  }

  /**
   * Subscribe to specific truck updates
   * Channel: /topic/truck/{truckId}
   * Returns an Observable for this specific truck
   */
  subscribeTruck(truckId: string): Observable<GPSPositionEvent> {
    return new Observable(observer => {
      if (!this.client?.connected) {
        console.warn('Cannot subscribe: WebSocket not connected');
        observer.error('WebSocket not connected');
        return;
      }

      const destination = `/topic/truck/${truckId}`;
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        const position: GPSPositionEvent = JSON.parse(message.body);
        observer.next(position);
      });

      this.subscriptions.set(`truck-${truckId}`, subscription);

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        this.subscriptions.delete(`truck-${truckId}`);
      };
    });
  }

  /**
   * Subscribe to truck status changes
   * Channel: /topic/truck/{truckId}/status
   */
  subscribeTruckStatus(truckId: string): Observable<any> {
    return new Observable(observer => {
      if (!this.client?.connected) {
        console.warn('Cannot subscribe: WebSocket not connected');
        observer.error('WebSocket not connected');
        return;
      }

      const destination = `/topic/truck/${truckId}/status`;
      const subscription = this.client.subscribe(destination, (message: IMessage) => {
        const statusChange = JSON.parse(message.body);
        observer.next(statusChange);
      });

      this.subscriptions.set(`truck-status-${truckId}`, subscription);

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        this.subscriptions.delete(`truck-status-${truckId}`);
      };
    });
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}
