import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  PaymentNotification,
  PaymentNotificationService,
} from '@core/service/payment-notification.service';
import { ProxyImagePipe } from '@shared/pipes/proxy-image.pipe';

@Component({
  selector: 'app-payment-pending',
  standalone: true,
  imports: [CommonModule, RouterModule, ProxyImagePipe],
  templateUrl: './payment-pending.html',
  styleUrl: './payment-pending.scss',
})
export class PaymentPending implements OnInit, OnDestroy {
  private router = inject(Router);
  private paymentNotificationService = inject(PaymentNotificationService);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  orderInfo: any = null;
  statusMessage = 'Đang chờ xác nhận thanh toán...';
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
          errorMessage: 'Không tìm thấy thông tin thanh toán.',
          orderInfo: state?.orderInfo ?? null,
        },
      });
      return;
    }

    this.startListening();
  }

  private startListening(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.connectionError = 'SignalR chỉ hoạt động trên trình duyệt.';
      return;
    }

    this.isConnecting = true;
    this.connectionError = '';

    this.paymentNotificationService
      .connect()
      .then(() => {
        this.isConnecting = false;
        this.statusMessage = 'Đang chờ xác nhận từ ngân hàng...';
        this.subscribeToNotifications();
      })
      .catch((err) => {
        console.error('SignalR connection failed:', err);
        this.isConnecting = false;
        this.connectionError =
          'Không thể kết nối đến NotificationHub. Vui lòng thử lại hoặc kiểm tra đơn hàng trong trang cá nhân.';
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
            paymentStatusName: 'Thanh toán thành công',
          };
          this.navigateToResult(true, notification);
        }
      });

    this.paymentNotificationService.paymentFailed$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification) => {
        if (this.matchesOrder(notification)) {
          this.navigateToResult(false, notification.message || 'Thanh toán thất bại.');
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
    this.navigateToResult(false, 'Bạn đã hủy thanh toán. Đơn hàng sẽ được xử lý ở trạng thái pending.');
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
        errorMessage: success ? '' : errorMessage || 'Thanh toán không thành công.',
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.paymentNotificationService.disconnect();
  }
}
