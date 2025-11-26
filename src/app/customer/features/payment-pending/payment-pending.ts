import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  PaymentNotification,
  PaymentNotificationService,
} from '@core/service/payment-notification.service';

@Component({
  selector: 'app-payment-pending',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-pending.html',
  styleUrl: './payment-pending.scss',
})
export class PaymentPending implements OnInit, OnDestroy {
  private router = inject(Router);
  private paymentNotificationService = inject(PaymentNotificationService);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  orderInfo: any = null;
  statusMessage = 'Dang cho xac nhan thanh toan...';
  connectionError = '';
  isConnecting = false;

  ngOnInit(): void {
    const navigationState = this.router.getCurrentNavigation()?.extras.state as any;
    const state = navigationState ?? (typeof history !== 'undefined' ? (history.state as any) : null);

    this.orderInfo = state?.orderInfo;

    if (!this.orderInfo || this.orderInfo.paymentMethod !== 'banking') {
      this.router.navigate(['/order-result'], {
        state: {
          success: false,
          errorMessage: 'Khong tim thay thong tin thanh toan.',
          orderInfo: state?.orderInfo ?? null,
        },
      });
      return;
    }

    this.startListening();
  }

  private startListening(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.connectionError = 'SignalR chi hoat dong tren trinh duyet.';
      return;
    }

    this.isConnecting = true;
    this.connectionError = '';

    this.paymentNotificationService
      .connect()
      .then(() => {
        this.isConnecting = false;
        this.statusMessage = 'Dang cho xac nhan tu ngan hang...';
        this.subscribeToNotifications();
      })
      .catch((err) => {
        console.error('SignalR connection failed:', err);
        this.isConnecting = false;
        this.connectionError =
          'Khong the ket noi den NotificationHub. Vui long thu lai hoac kiem tra don hang trong trang ca nhan.';
      });
  }

  private subscribeToNotifications(): void {
    this.paymentNotificationService.paymentSuccess$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (this.matchesOrder(notification)) {
          this.orderInfo = {
            ...this.orderInfo,
            paymentTransactionId: notification.transactionId ?? this.orderInfo?.paymentTransactionId,
            paymentStatus: 'Paid',
            paymentStatusName: 'Thanh toan thanh cong',
          };
          this.navigateToResult(true, notification);
        }
      });

    this.paymentNotificationService.paymentFailed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (this.matchesOrder(notification)) {
          this.navigateToResult(false, notification.message || 'Thanh toan that bai.');
        }
      });
  }

  private matchesOrder(notification: PaymentNotification): boolean {
    if (!notification || !this.orderInfo) return false;

    const targetOrderId = (this.orderInfo.orderId || '').toString().toLowerCase();
    const targetOrderNumber = (this.orderInfo.orderNumber || '').toString().toLowerCase();
    const notifOrderId = (notification.orderId || '').toString().toLowerCase();
    const notifOrderNumber = (notification.orderNumber || '').toString().toLowerCase();

    return (
      (!!targetOrderId && targetOrderId === notifOrderId) ||
      (!!targetOrderNumber && targetOrderNumber === notifOrderNumber)
    );
  }

  openPaymentUrl(): void {
    if (this.orderInfo?.paymentUrl && isPlatformBrowser(this.platformId)) {
      window.open(this.orderInfo.paymentUrl, '_blank');
    }
  }

  cancelPayment(): void {
    this.navigateToResult(false, 'Ban da huy thanh toan. Don hang se duoc xu ly o trang thai pending.');
  }

  private navigateToResult(success: boolean, notificationOrMessage?: PaymentNotification | string): void {
    const errorMessage =
      typeof notificationOrMessage === 'string'
        ? notificationOrMessage
        : notificationOrMessage?.message;

    this.router.navigate(['/order-result'], {
      state: {
        success,
        orderInfo: this.orderInfo,
        errorMessage: success ? '' : errorMessage || 'Thanh toan khong thanh cong.',
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.paymentNotificationService.disconnect();
  }
}
