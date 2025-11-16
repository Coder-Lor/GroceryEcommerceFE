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
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import {
  OrderPaymentClient,
  SortDirection,
  ResultOfPagedResultOfOrderPaymentDto,
  ResultOfOrderPaymentDto,
  ResultOfBoolean,
  OrderPaymentDto,
} from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-order-payment-list',
  standalone: true,
  templateUrl: 'order-payment-list.component.html',
  styleUrl: './order-payment-list.component.scss',
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
export class OrderPaymentListComponent implements OnInit {
  private orderPaymentClient = inject(OrderPaymentClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  faMagnifyingGlass = faMagnifyingGlass;
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
  faCreditCard = faCreditCard;

  payments: OrderPaymentDto[] = [];
  filteredPayments: OrderPaymentDto[] = [];
  selectedPayment: OrderPaymentDto | null = null;
  isLoading = false;
  isDetailModalOpen = false;

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;

  searchTerm = '';
  sortColumn = 'processedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  Math = Math;
  SortDirection = SortDirection;

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.isLoading = true;
    const apiSortDirection =
      this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;

    this.orderPaymentClient
      .getOrderPaymentsPaging(
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        this.sortColumn,
        apiSortDirection,
        undefined,
        undefined,
        undefined,
        false,
        !!this.searchTerm,
        true
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.parseData(response);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách thanh toán!',
          });
        },
      });
  }

  private parseData(response: ResultOfPagedResultOfOrderPaymentDto): void {
    if (response.data && response.data.items) {
      this.payments = response.data.items;
      this.filteredPayments = [...this.payments];
      this.totalRecords = response.data.totalCount || 0;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    }
  }

  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadPayments();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPayments();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPayments();
  }

  viewDetail(orderPaymentId: string): void {
    this.isLoading = true;
    this.orderPaymentClient.getById(orderPaymentId).subscribe({
      next: (response: ResultOfOrderPaymentDto) => {
        this.isLoading = false;
        if (response.data) {
          this.selectedPayment = response.data;
          this.isDetailModalOpen = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải chi tiết!',
        });
      },
    });
  }

  confirmDelete(payment: OrderPaymentDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa thanh toán <strong>${payment.orderPaymentId}</strong>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deletePayment(payment);
      },
    });
  }

  deletePayment(payment: OrderPaymentDto): void {
    if (!payment.orderPaymentId) return;
    this.isLoading = true;
    this.orderPaymentClient.delete(payment.orderPaymentId).subscribe({
      next: (response: ResultOfBoolean) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa thanh toán thành công!',
          });
          this.loadPayments();
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
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa thanh toán!',
        });
      },
    });
  }

  closeModal(): void {
    this.isDetailModalOpen = false;
    this.selectedPayment = null;
  }

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

  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

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

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  formatKey(key: string): string {
    const keyMap: { [key: string]: string } = {
      orderPaymentId: 'ID Thanh toán',
      orderId: 'ID Đơn hàng',
      orderNumber: 'Mã đơn hàng',
      paymentMethod: 'Phương thức thanh toán',
      paymentMethodName: 'Tên phương thức',
      amount: 'Số tiền',
      status: 'Trạng thái',
      statusName: 'Tên trạng thái',
      transactionId: 'ID Giao dịch',
      paymentGateway: 'Cổng thanh toán',
      processedAt: 'Ngày xử lý',
      processedByName: 'Người xử lý',
      createdAt: 'Ngày tạo',
      updatedAt: 'Ngày cập nhật',
      notes: 'Ghi chú',
    };
    return keyMap[key] || key;
  }

  formatValue(value: any, key: string): string {
    if (value === null || value === undefined) return 'N/A';
    if (key.includes('Date') || key.includes('At')) return this.formatDate(value);
    if (key.includes('Amount') || key.includes('Price')) return this.formatCurrency(value);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}

