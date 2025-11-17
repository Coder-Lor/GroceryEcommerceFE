import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faEye,
  faSort,
  faSortUp,
  faSortDown,
  faTag,
  faCalendar,
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import {
  OrderClient,
  SortDirection,
  FilterCriteria,
  ResultOfPagedResultOfOrderDto,
  ResultOfOrderDetailDto,
  ResultOfBoolean,
  OrderDto,
  OrderDetailDto,
} from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-order-list',
  standalone: true,
  templateUrl: 'order-list.component.html',
  styleUrl: './order-list.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    LoadingOverlayComponent,
    FaIconComponent,
    ToastModule,
    ConfirmDialogModule,
    TooltipDirective,
  ],
  providers: [MessageService, ConfirmationService],
})
export class OrderListComponent implements OnInit {
  private orderClient = inject(OrderClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Icons
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faEye = faEye;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faTag = faTag;
  faCalendar = faCalendar;
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faRefresh = faRefresh;

  orders: OrderDto[] = [];
  filteredOrders: OrderDto[] = [];
  selectedOrder: OrderDetailDto | null = null;
  isLoading = false;
  isDetailModalOpen = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;

  // Search & Filter
  searchTerm = '';
  sortColumn = 'orderDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Expose Math and SortDirection to template
  Math = Math;
  SortDirection = SortDirection;

  ngOnInit(): void {
    this.loadOrders();
  }

  /**
   * Tải danh sách đơn hàng
   */
  loadOrders(): void {
    this.isLoading = true;

    const apiSortDirection =
      this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;

    this.orderClient
      .getOrdersPaging(
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        this.sortColumn,
        apiSortDirection,
        undefined, // filters
        undefined, // entityType
        undefined, // availableFields
        false, // hasFilters
        !!this.searchTerm, // hasSearch
        true // hasSorting
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.parseOrderData(response);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi khi tải danh sách đơn hàng:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách đơn hàng!',
          });
        },
      });
  }

  /**
   * Parse response data to order list
   */
  private parseOrderData(response: ResultOfPagedResultOfOrderDto): void {
    if (response.data && response.data.items) {
      this.orders = response.data.items;
      this.filteredOrders = [...this.orders];
      this.totalRecords = response.data.totalCount || 0;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
      this.sortOrders();
    }
  }

  /**
   * Sắp xếp đơn hàng
   */
  sortOrders(): void {
    this.filteredOrders.sort((a, b) => {
      let valueA: any = (a as any)[this.sortColumn];
      let valueB: any = (b as any)[this.sortColumn];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let comparison = 0;
      if (valueA > valueB) comparison = 1;
      else if (valueA < valueB) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Thay đổi cột sắp xếp
   */
  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadOrders();
  }

  /**
   * Thay đổi trang
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadOrders();
    }
  }

  /**
   * Thay đổi số lượng hiển thị
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  /**
   * Tìm kiếm
   */
  onSearch(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  /**
   * Xem chi tiết đơn hàng
   */
  viewOrderDetail(orderId: string): void {
    this.isLoading = true;
    this.orderClient.getById(orderId).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.parseOrderDetailData(response);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin đơn hàng!',
        });
      },
    });
  }

  /**
   * Parse order detail data
   */
  private parseOrderDetailData(response: ResultOfOrderDetailDto): void {
    if (response.data) {
      this.selectedOrder = response.data;
      this.isDetailModalOpen = true;
    }
  }

  /**
   * Xác nhận xóa đơn hàng
   */
  confirmDelete(order: OrderDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa đơn hàng <strong>${order.orderNumber || order.orderId}</strong>? Hành động này không thể hoàn tác!`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteOrder(order);
      },
    });
  }

  /**
   * Xóa đơn hàng
   */
  deleteOrder(order: OrderDto): void {
    if (!order.orderId) {
      return;
    }

    this.isLoading = true;
    this.orderClient.delete(order.orderId).subscribe({
      next: (response: ResultOfBoolean) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa đơn hàng thành công!',
          });
          this.loadOrders();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: response.errorMessage || 'Xóa thất bại',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa đơn hàng!',
        });
      },
    });
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.isDetailModalOpen = false;
    this.selectedOrder = null;
  }

  /**
   * Format ngày tháng
   */
  formatDate(date?: Date | string | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format số tiền
   */
  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  /**
   * Tạo mảng số trang
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * Lấy keys của object
   */
  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  /**
   * Format key name
   */
  formatKey(key: string): string {
    const keyMap: { [key: string]: string } = {
      orderId: 'ID Đơn hàng',
      orderNumber: 'Mã đơn hàng',
      customerId: 'ID Khách hàng',
      customerName: 'Tên khách hàng',
      orderDate: 'Ngày đặt',
      totalAmount: 'Tổng tiền',
      status: 'Trạng thái',
      createdAt: 'Ngày tạo',
      updatedAt: 'Ngày cập nhật',
    };
    return keyMap[key] || key;
  }

  /**
   * Format value
   */
  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return 'N/A';
    
    if (key.includes('Date') || key.includes('At')) {
      return this.formatDate(value);
    }
    
    if (key.includes('Amount') || key.includes('Price') || key.includes('Cost')) {
      return this.formatCurrency(value);
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
}

