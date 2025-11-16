import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faEye,
  faSort,
  faSortUp,
  faSortDown,
  faBox,
  faBoxOpen,
  faTruck,
  faCheckCircle,
  faTimesCircle,
  faCalendar,
  faTag,
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
  faFilter,
  faEdit,
} from '@fortawesome/free-solid-svg-icons';
import {
  PurchaseOrderClient,
  SortDirection,
  FilterCriteria,
  UpdatePurchaseOrderStatusCommand,
  FileResponse,
} from '../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

interface PurchaseOrderData {
  purchaseOrderId?: string;
  orderNumber?: string;
  orderDate?: Date | string;
  expectedDeliveryDate?: Date | string | null;
  actualDeliveryDate?: Date | string | null;
  subTotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  totalAmount?: number;
  status?: number;
  statusName?: string;
  notes?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
  createdBy?: string;
  createdByName?: string;
  items?: PurchaseOrderItemData[];
}

interface PurchaseOrderItemData {
  purchaseOrderItemId?: string;
  purchaseOrderId?: string;
  productId?: string;
  productName?: string;
  productSku?: string;
  unitCost?: number;
  quantity?: number;
  receivedQuantity?: number;
  totalCost?: number;
  createdAt?: Date | string;
}

@Component({
  selector: 'app-orders-page',
  standalone: true,
  templateUrl: 'orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    LoadingOverlayComponent,
    FaIconComponent,
    ToastModule,
    ConfirmDialogModule,
    TooltipDirective
  ],
  providers: [MessageService, ConfirmationService],
})
export class OrdersPageComponent implements OnInit {
  private purchaseOrderClient = inject(PurchaseOrderClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Font Awesome icons
  faPlus = faPlus;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faEye = faEye;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faBox = faBox;
  faBoxOpen = faBoxOpen;
  faTruck = faTruck;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;
  faCalendar = faCalendar;
  faTag = faTag;
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faFilter = faFilter;
  faEdit = faEdit;

  orders: PurchaseOrderData[] = [];
  filteredOrders: PurchaseOrderData[] = [];
  selectedOrder: PurchaseOrderData | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  isStatusModalOpen = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;

  // Search & Filter
  searchTerm = '';
  sortColumn = 'orderDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  selectedStatus: number | null = null;

  // Status update form
  statusUpdateForm: UpdatePurchaseOrderStatusCommand = {} as UpdatePurchaseOrderStatusCommand;

  // Status options
  statusOptions = [
    { value: 1, label: 'Đã tạo', color: 'status-created' },
    { value: 2, label: 'Đã đặt', color: 'status-ordered' },
    { value: 3, label: 'Đã nhận', color: 'status-received' },
    { value: 4, label: 'Đã hủy', color: 'status-cancelled' },
  ];

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

    // Nếu có lọc theo trạng thái, sử dụng API getPurchaseOrdersByStatus
    if (this.selectedStatus !== null) {
      this.purchaseOrderClient
        .getPurchaseOrdersByStatus(
          this.selectedStatus,
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
    } else {
      // Sử dụng API getPurchaseOrdersPaging
      this.purchaseOrderClient
        .getPurchaseOrdersPaging(
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
  }

  /**
   * Parse blob data to order list
   */
  private parseOrderData(response: FileResponse): void {
    if (response.data) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = JSON.parse(reader.result as string);
          if (result.data && result.data.items) {
            this.orders = result.data.items;
            this.filteredOrders = [...this.orders];
            this.totalRecords = result.data.totalCount || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.sortOrders();
          }
        } catch (error) {
          console.error('Error parsing order data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu đơn hàng',
          });
        }
      };
      reader.readAsText(response.data);
    }
  }

  /**
   * Lọc đơn hàng
   */
  filterOrders(): void {
    if (!this.searchTerm.trim() && this.selectedStatus === null) {
      this.filteredOrders = [...this.orders];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredOrders = this.orders.filter((order) => {
        const matchesSearch =
          !term ||
          order.orderNumber?.toLowerCase().includes(term) ||
          order.createdByName?.toLowerCase().includes(term) ||
          order.statusName?.toLowerCase().includes(term);

        const matchesStatus =
          this.selectedStatus === null || order.status === this.selectedStatus;

        return matchesSearch && matchesStatus;
      });
    }
    this.sortOrders();
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
   * Lọc theo trạng thái
   */
  onStatusFilterChange(): void {
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
    this.purchaseOrderClient.getPurchaseOrderById(orderId).subscribe({
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
  private parseOrderDetailData(response: FileResponse): void {
    if (response.data) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = JSON.parse(reader.result as string);
          if (result.data) {
            this.selectedOrder = result.data;
            this.isDetailModalOpen = true;
          }
        } catch (error) {
          console.error('Error parsing order detail:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải chi tiết đơn hàng',
          });
        }
      };
      reader.readAsText(response.data);
    }
  }

  /**
   * Mở modal cập nhật trạng thái
   */
  openStatusModal(order: PurchaseOrderData): void {
    this.selectedOrder = order;
    this.statusUpdateForm = new UpdatePurchaseOrderStatusCommand({
      purchaseOrderId: order.purchaseOrderId,
      status: order.status,
    });
    this.isStatusModalOpen = true;
  }

  /**
   * Cập nhật trạng thái đơn hàng
   */
  updateOrderStatus(): void {
    if (!this.statusUpdateForm.purchaseOrderId || !this.statusUpdateForm.status) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn trạng thái!',
      });
      return;
    }

    this.isLoading = true;
    this.purchaseOrderClient
      .updatePurchaseOrderStatus(this.statusUpdateForm.purchaseOrderId, this.statusUpdateForm)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = JSON.parse(reader.result as string);
              if (result.isSuccess) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Cập nhật trạng thái đơn hàng thành công!',
                });
                this.isStatusModalOpen = false;
                this.loadOrders();
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: result.errorMessage || 'Cập nhật thất bại',
                });
              }
            } catch (error) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật trạng thái đơn hàng thành công!',
              });
              this.isStatusModalOpen = false;
              this.loadOrders();
            }
          };
          if (response.data) {
            reader.readAsText(response.data);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể cập nhật trạng thái đơn hàng!',
          });
        },
      });
  }

  /**
   * Xác nhận xóa đơn hàng
   */
  confirmDelete(order: PurchaseOrderData): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa đơn hàng <strong>${order.orderNumber}</strong>? Hành động này không thể hoàn tác!`,
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
  deleteOrder(order: PurchaseOrderData): void {
    if (!order.purchaseOrderId) {
      return;
    }

    this.isLoading = true;
    this.purchaseOrderClient.deletePurchaseOrder(order.purchaseOrderId).subscribe({
      next: (response) => {
        this.isLoading = false;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const result = JSON.parse(reader.result as string);
            if (result.isSuccess !== false) {
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
                detail: result.errorMessage || 'Xóa thất bại',
              });
            }
          } catch (error) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Xóa đơn hàng thành công!',
            });
            this.loadOrders();
          }
        };
        if (response.data) {
          reader.readAsText(response.data);
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
    this.isStatusModalOpen = false;
    this.selectedOrder = null;
  }

  /**
   * Lấy tên trạng thái
   */
  getStatusLabel(status?: number): string {
    const found = this.statusOptions.find((opt) => opt.value === status);
    return found ? found.label : 'Không xác định';
  }

  /**
   * Lấy class CSS cho trạng thái
   */
  getStatusClass(status?: number): string {
    const found = this.statusOptions.find((opt) => opt.value === status);
    return found ? found.color : 'status-unknown';
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
}