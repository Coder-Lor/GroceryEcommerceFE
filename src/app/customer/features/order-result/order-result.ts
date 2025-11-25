import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-order-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-result.html',
  styleUrl: './order-result.scss',
})
export class OrderResult implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isSuccess: boolean = false;
  errorMessage: string = '';
  orderInfo: any = null;

  ngOnInit(): void {
    // Lấy thông tin từ navigation state hoặc history.state (trường hợp reload)
    const navigationState = this.router.getCurrentNavigation()?.extras.state as any;
    const state = navigationState ?? (history.state as any);

    if (state && (state.success !== undefined || state.orderInfo)) {
      this.isSuccess = state.success ?? false;
      this.errorMessage = state.errorMessage ?? '';
      this.orderInfo = state.orderInfo ?? null;
    } else {
      // Không chuyển hướng để giữ nguyên route hiển thị component
      this.isSuccess = false;
      this.errorMessage = 'Không tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại.';
    }
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToOrders() {
    this.router.navigate(['/profile/orders']);
  }
}
