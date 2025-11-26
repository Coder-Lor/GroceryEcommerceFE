import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { API_BASE_URL } from './system-admin.service';
import { AuthService } from './auth.service';

export interface PaymentNotification {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  message: string;
  paidAt: string;
  type: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentNotificationService {
  private hubConnection?: HubConnection;
  private connectionPromise?: Promise<void>;
  private readonly isBrowser: boolean;

  private connectionState$ = new BehaviorSubject<boolean>(false);
  private paymentSuccessSubject = new Subject<PaymentNotification>();
  private paymentFailedSubject = new Subject<PaymentNotification>();

  readonly paymentSuccess$ = this.paymentSuccessSubject.asObservable();
  readonly paymentFailed$ = this.paymentFailedSubject.asObservable();
  readonly isConnected$ = this.connectionState$.asObservable();

  constructor(
    @Inject(API_BASE_URL) private readonly baseUrl: string,
    private readonly authService: AuthService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Ensure a single SignalR connection to NotificationHub and start listening for payment events.
   */
  connect(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.resolve();
    }

    if (this.hubConnection && this.hubConnection.state === HubConnectionState.Connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const token = this.authService.currentAccessToken;
    if (!token) {
      return Promise.reject('Missing access token for SignalR connection.');
    }

    const hubUrl = `${this.baseUrl}/notificationHub`;
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.authService.currentAccessToken || '',
        withCredentials: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.onreconnected(() => this.connectionState$.next(true));
    this.hubConnection.onreconnecting(() => this.connectionState$.next(false));
    this.hubConnection.onclose(() => this.connectionState$.next(false));

    this.hubConnection.on('PaymentSuccess', (payload: PaymentNotification) =>
      this.paymentSuccessSubject.next(payload)
    );
    this.hubConnection.on('PaymentFailed', (payload: PaymentNotification) =>
      this.paymentFailedSubject.next(payload)
    );

    this.connectionPromise = this.hubConnection
      .start()
      .then(() => {
        this.connectionState$.next(true);
      })
      .catch((error) => {
        this.connectionState$.next(false);
        this.connectionPromise = undefined;
        throw error;
      });

    return this.connectionPromise;
  }

  /**
   * Stop current connection (if any).
   */
  disconnect(): Promise<void> {
    if (!this.hubConnection || !this.isBrowser) {
      return Promise.resolve();
    }

    const stopPromise = this.hubConnection.stop();
    this.hubConnection = undefined;
    this.connectionPromise = undefined;
    this.connectionState$.next(false);
    return stopPromise;
  }
}
