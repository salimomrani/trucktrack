import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GPSPositionEvent } from '../../models/gps-position.model';

/**
 * WebSocket service for real-time GPS position updates
 * T078: Create WebSocketService (STOMP client, RxJS observables for GPS updates)
 */
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private positionUpdatesSubject = new BehaviorSubject<GPSPositionEvent | null>(null);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  private subscriptions: Map<string, StompSubscription> = new Map();

  // Observable for all position updates
  public positionUpdates$: Observable<GPSPositionEvent | null> = this.positionUpdatesSubject.asObservable();

  // Observable for connection status
  public connectionStatus$: Observable<boolean> = this.connectionStatusSubject.asObservable();

  constructor() {}

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.client?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (environment.logging.enableConsoleLogging) {
          console.log('STOMP: ' + str);
        }
      }
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.connectionStatusSubject.next(true);
      this.subscribeToAllPositions();
    };

    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.connectionStatusSubject.next(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error', frame);
      this.connectionStatusSubject.next(false);
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
      this.connectionStatusSubject.next(false);
      console.log('WebSocket disconnected');
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
      this.positionUpdatesSubject.next(position);
    });

    this.subscriptions.set('all-positions', subscription);
    console.log('Subscribed to /topic/positions');
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
      console.log(`Subscribed to ${destination}`);

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        this.subscriptions.delete(`truck-${truckId}`);
        console.log(`Unsubscribed from ${destination}`);
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
      console.log(`Subscribed to ${destination}`);

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        this.subscriptions.delete(`truck-status-${truckId}`);
        console.log(`Unsubscribed from ${destination}`);
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
