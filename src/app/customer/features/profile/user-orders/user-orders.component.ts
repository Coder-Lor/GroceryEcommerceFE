import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderClient, OrderDto, OrderDetailDto, SortDirection } from '../../../../core/service/system-admin.service';
import { Router } from '@angular/router';
import { InvoicePdfService } from '../../../../admin/order-management/services/invoice-pdf.service';
import { OrderStatusMapper } from '../../../../admin/order-management/models';

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
  private invoicePdfService = inject(InvoicePdfService);

  orders: OrderDto[] = [];
  isExporting = false;
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

  /**
   * Lấy tên trạng thái tiếng Việt từ status number
   */
  getStatusDisplay(order: OrderDto): string {
    if (order.status) {
      return OrderStatusMapper.getOrderStatusDisplay(order.status);
    }
    return order.statusName || 'Không xác định';
  }

  /**
   * Lấy CSS class cho trạng thái đơn hàng
   */
  getStatusClass(order: OrderDto): string {
    if (order.status) {
      const statusClassMap: Record<number, string> = {
        1: 'pending',     // Chờ xử lý
        2: 'processing',  // Đang xử lý
        3: 'shipping',    // Đang vận chuyển
        4: 'delivered',   // Đã nhận hàng
        5: 'cancelled'    // Đã huỷ
      };
      return statusClassMap[order.status] || 'pending';
    }

    // Fallback nếu không có status number
    const statusLower = order.statusName?.toLowerCase() || '';
    if (statusLower.includes('pending') || statusLower.includes('chờ')) return 'pending';
    if (statusLower.includes('processing') || statusLower.includes('xử lý')) return 'processing';
    if (statusLower.includes('confirmed') || statusLower.includes('xác nhận')) return 'confirmed';
    if (statusLower.includes('shipping') || statusLower.includes('giao')) return 'shipping';
    if (statusLower.includes('delivered') || statusLower.includes('nhận')) return 'delivered';
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
    // Only allow canceling if order is Pending (1) or Processing (2)
    if (order.status) {
      return order.status === 1 || order.status === 2;
    }
    const status = order.statusName?.toLowerCase() || '';
    return status.includes('pending') || status.includes('processing') ||
      status.includes('chờ') || status.includes('xử lý');
  }

  /**
   * Xuất hóa đơn PDF cho đơn hàng
   */
  exportInvoice(order: OrderDto): void {
    if (!order.orderId) {
      console.error('Không tìm thấy ID đơn hàng');
      return;
    }

    this.isExporting = true;

    // Lấy chi tiết đơn hàng đầy đủ trước khi xuất hóa đơn
    this.orderClient.getById(order.orderId).subscribe({
      next: (result) => {
        this.isExporting = false;
        if (result.isSuccess && result.data) {
          this.invoicePdfService.exportInvoice(result.data);
        } else {
          console.error('Không thể tải thông tin đơn hàng:', result.errorMessage);
          alert('Không thể xuất hóa đơn. Vui lòng thử lại sau.');
        }
      },
      error: (error) => {
        this.isExporting = false;
        console.error('Lỗi khi tải thông tin đơn hàng:', error);
        alert('Có lỗi xảy ra khi xuất hóa đơn. Vui lòng thử lại sau.');
      }
    });
  }

  /**
   * Kiểm tra đơn hàng có thể xuất hóa đơn (đã hoàn thành/đã giao - status = 4)
   */
  canExportInvoice(order: OrderDto): boolean {
    if (order.status) {
      return order.status === 4; // Delivered
    }
    const status = order.statusName?.toLowerCase() || '';
    return status.includes('delivered') || status.includes('đã giao') ||
      status.includes('đã nhận') || status.includes('hoàn thành') ||
      status.includes('completed');
  }
}
