import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderClient, OrderDto, OrderDetailDto, SortDirection } from '../../../../core/service/system-admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss',
})
export class UserOrdersComponent implements OnInit {
  private orderClient = inject(OrderClient);
  private router = inject(Router);
  
  orders: OrderDto[] = [];
  isLoading = false;
  errorMessage = '';
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;

  ngOnInit() {
    this.loadUserOrders();
  }

  loadUserOrders() {
    // Get current user ID from localStorage or auth service
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      this.errorMessage = 'Vui lòng đăng nhập để xem đơn hàng';
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const userId = user.id || user.userId;
      
      if (!userId) {
        this.errorMessage = 'Không tìm thấy thông tin người dùng';
        return;
      }

      this.isLoading = true;
      this.errorMessage = '';

      this.orderClient.getByUserId(
        userId,
        this.currentPage,
        this.pageSize,
        undefined, // search
        'createdAt', // sortBy
        SortDirection.Descending, // sortDirection - newest first
        [], // filters
        undefined, // entityType
        undefined, // availableFields
        false, // hasFilters
        false, // hasSearch
        true // hasSorting
      ).subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result.isSuccess && result.data) {
            this.orders = result.data.items || [];
            this.totalItems = result.data.totalCount || 0;
          } else {
            this.errorMessage = result.errorMessage || 'Không thể tải danh sách đơn hàng';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading orders:', error);
          this.errorMessage = 'Có lỗi xảy ra khi tải đơn hàng. Vui lòng thử lại sau.';
        }
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.errorMessage = 'Có lỗi xảy ra. Vui lòng đăng nhập lại.';
    }
  }

  viewOrderDetail(order: OrderDto) {
    if (order.orderId) {
      this.orderClient.getById(order.orderId).subscribe({
        next: (result) => {
          if (result.isSuccess && result.data) {
            console.log('Order detail:', result.data);
            // Navigate to order detail page or show modal
            // this.router.navigate(['/profile/orders', order.orderId]);
          }
        },
        error: (error) => {
          console.error('Error loading order detail:', error);
        }
      });
    }
  }

  reorder(order: OrderDto) {
    console.log('Reorder:', order);
    // Implement reorder logic - add items to cart
  }

  cancelOrder(order: OrderDto) {
    if (confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      console.log('Cancel order:', order);
      // Implement cancel order logic
    }
  }

  getStatusClass(status: string): string {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('pending') || statusLower.includes('chờ')) return 'pending';
    if (statusLower.includes('processing') || statusLower.includes('xử lý')) return 'processing';
    if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) return 'confirmed';
    if (statusLower.includes('shipping') || statusLower.includes('giao')) return 'shipping';
    if (statusLower.includes('delivered') || statusLower.includes('giao')) return 'delivered';
    if (statusLower.includes('cancelled') || statusLower.includes('hủy')) return 'cancelled';
    if (statusLower.includes('refunded') || statusLower.includes('hoàn')) return 'refunded';
    if (statusLower.includes('failed') || statusLower.includes('thất bại')) return 'failed';
    
    return 'pending';
  }

  formatPrice(price: number | undefined): string {
    if (!price) return '0₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  canCancelOrder(order: OrderDto): boolean {
    // Only allow canceling if order is Pending or Processing
    const status = order.statusName?.toLowerCase() || '';
    return status.includes('pending') || status.includes('processing') || 
           status.includes('chờ') || status.includes('xử lý');
  }
}
