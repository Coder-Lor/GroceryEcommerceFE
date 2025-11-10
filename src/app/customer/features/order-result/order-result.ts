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
    // Lấy thông tin từ navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;

    if (state) {
      this.isSuccess = state.success || false;
      this.errorMessage = state.errorMessage || '';
      this.orderInfo = state.orderInfo || null;
    } else {
      // Nếu không có state (refresh page), redirect về home
      this.router.navigate(['/home']);
    }
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToOrders() {
    this.router.navigate(['/profile/orders']);
  }
}
