import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule, Menu } from 'primeng/menu';
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
  faFileInvoice,
  faEllipsisVertical,
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
  UpdateOrderStatusRequest,
} from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';
import { OrderStatusMapper, OrderStatus, PaymentStatus, PaymentMethod } from '../models';
import { InvoicePdfService } from '../services/invoice-pdf.service';

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
    MenuModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class OrderListComponent implements OnInit {
  private orderClient = inject(OrderClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private invoicePdfService = inject(InvoicePdfService);

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
  faFileInvoice = faFileInvoice;
  faEllipsisVertical = faEllipsisVertical;

  // Menu
  @ViewChild('actionMenu') actionMenu!: Menu;
  actionMenuItems: MenuItem[] = [];
  selectedOrderForAction: OrderDto | null = null;

  // Edit modal
  isEditModalOpen = false;
  editingOrder: OrderDto | null = null;
  editOrderStatus: number = 1;
  editPaymentStatus: number = 1;

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

  // Expose OrderStatusMapper to template
  OrderStatusMapper = OrderStatusMapper;

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
      userName: 'Tên khách hàng',
      orderDate: 'Ngày đặt',
      totalAmount: 'Tổng tiền',
      status: 'Trạng thái đơn hàng',
      paymentStatus: 'Trạng thái thanh toán',
      paymentMethod: 'Phương thức thanh toán',
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

    // Format status fields
    if (key === 'status') {
      return OrderStatusMapper.getOrderStatusDisplay(value);
    }

    if (key === 'paymentStatus') {
      return OrderStatusMapper.getPaymentStatusDisplay(value);
    }

    if (key === 'paymentMethod') {
      return OrderStatusMapper.getPaymentMethodDisplay(value);
    }

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

  /**
   * Lấy class CSS cho badge trạng thái
   */
  getStatusBadgeClass(status: number): string {
    return OrderStatusMapper.getOrderStatusClass(status);
  }

  /**
   * Lấy class CSS cho badge thanh toán
   */
  getPaymentBadgeClass(status: number): string {
    return OrderStatusMapper.getPaymentStatusClass(status);
  }

  /**
   * Xuất hóa đơn PDF
   */
  exportInvoice(orderId: string): void {
    this.isLoading = true;
    this.orderClient.getById(orderId).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.data) {
          this.invoicePdfService.exportInvoice(response.data);
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xuất hóa đơn thành công!',
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy thông tin đơn hàng!',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xuất hóa đơn!',
        });
      },
    });
  }

  /**
   * Hiển thị menu hành động
   */
  showActionMenu(event: Event, order: OrderDto): void {
    this.selectedOrderForAction = order;
    this.actionMenuItems = [
      {
        label: 'Xem chi tiết',
        icon: 'pi pi-eye',
        command: () => this.viewOrderDetail(order.orderId!),
      },
      {
        label: 'Cập nhật đơn hàng',
        icon: 'pi pi-pencil',
        command: () => this.openEditModal(order),
      },
      {
        label: 'Xuất hóa đơn PDF',
        icon: 'pi pi-file-pdf',
        command: () => this.exportInvoice(order.orderId!),
      },
      {
        separator: true,
      },
      {
        label: 'Xóa đơn hàng',
        icon: 'pi pi-trash',
        styleClass: 'menu-item-danger',
        command: () => this.confirmDelete(order),
      },
    ];
    this.actionMenu.toggle(event);
  }

  /**
   * Mở modal cập nhật đơn hàng
   */
  openEditModal(order: OrderDto): void {
    this.editingOrder = order;
    this.editOrderStatus = order.status || 1;
    this.editPaymentStatus = order.paymentStatus || 1;
    this.isEditModalOpen = true;
  }

  /**
   * Đóng modal cập nhật
   */
  closeEditModal(): void {
    this.isEditModalOpen = false;
    this.editingOrder = null;
  }

  /**
   * Lưu cập nhật đơn hàng
   */
  saveOrderUpdate(): void {
    if (!this.editingOrder?.orderId) return;

    this.isLoading = true;
    const request = new UpdateOrderStatusRequest({
      status: this.editOrderStatus,
    });

    this.orderClient.updateStatus(this.editingOrder.orderId, request).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật đơn hàng thành công!',
          });
          this.closeEditModal();
          this.loadOrders();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: response.errorMessage || 'Cập nhật thất bại',
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật đơn hàng!',
        });
      },
    });
  }

  /**
   * Lấy danh sách trạng thái đơn hàng
   */
  getOrderStatusOptions(): { value: number; label: string }[] {
    return [
      { value: 1, label: 'Chờ xử lý' },
      { value: 2, label: 'Đang xử lý' },
      { value: 3, label: 'Đang giao hàng' },
      { value: 4, label: 'Hoàn thành' },
      { value: 5, label: 'Đã hủy' },
    ];
  }

  /**
   * Lấy danh sách trạng thái thanh toán
   */
  getPaymentStatusOptions(): { value: number; label: string }[] {
    return [
      { value: 1, label: 'Chờ thanh toán' },
      { value: 2, label: 'Đã thanh toán' },
      { value: 3, label: 'Thanh toán thất bại' },
      { value: 4, label: 'Đã hoàn tiền' },
    ];
  }
}

