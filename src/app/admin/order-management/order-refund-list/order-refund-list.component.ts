import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  faMagnifyingGlass, faTrashCan, faXmark, faEye, faSort, faSortUp, faSortDown,
  faTag, faCalendar, faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight, faRefresh, faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { OrderRefundClient, SortDirection, ResultOfPagedResultOfOrderRefundDto, ResultOfOrderRefundDto, ResultOfBoolean, OrderRefundDto } from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-order-refund-list',
  standalone: true,
  templateUrl: 'order-refund-list.component.html',
  styleUrl: './order-refund-list.component.scss',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, FaIconComponent, ToastModule, ConfirmDialogModule, TooltipDirective],
  providers: [MessageService, ConfirmationService],
})
export class OrderRefundListComponent implements OnInit {
  private orderRefundClient = inject(OrderRefundClient);
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
  faUndo = faUndo;

  refunds: OrderRefundDto[] = [];
  filteredRefunds: OrderRefundDto[] = [];
  selectedRefund: OrderRefundDto | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  searchTerm = '';
  sortColumn = 'requestedAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  Math = Math;
  SortDirection = SortDirection;

  ngOnInit(): void {
    this.loadRefunds();
  }

  loadRefunds(): void {
    this.isLoading = true;
    const apiSortDirection = this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;
    this.orderRefundClient.getOrderRefundsPaging(
      this.currentPage, this.pageSize, this.searchTerm || undefined,
      this.sortColumn, apiSortDirection, undefined, undefined, undefined, false, !!this.searchTerm, true
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.parseData(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách hoàn tiền!' });
      },
    });
  }

  private parseData(response: ResultOfPagedResultOfOrderRefundDto): void {
    if (response.data && response.data.items) {
      this.refunds = response.data.items;
      this.filteredRefunds = [...this.refunds];
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
    this.loadRefunds();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadRefunds();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadRefunds();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRefunds();
  }

  viewDetail(orderRefundId: string): void {
    this.isLoading = true;
    this.orderRefundClient.getById(orderRefundId).subscribe({
      next: (response: ResultOfOrderRefundDto) => {
        this.isLoading = false;
        if (response.data) {
          this.selectedRefund = response.data;
          this.isDetailModalOpen = true;
        }
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết!' });
      },
    });
  }

  confirmDelete(refund: OrderRefundDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa hoàn tiền <strong>${refund.orderRefundId}</strong>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteRefund(refund),
    });
  }

  deleteRefund(refund: OrderRefundDto): void {
    if (!refund.orderRefundId) return;
    this.isLoading = true;
    this.orderRefundClient.delete(refund.orderRefundId).subscribe({
      next: (response: ResultOfBoolean) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa hoàn tiền thành công!' });
          this.loadRefunds();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: response.errorMessage || 'Xóa thất bại' });
        }
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa hoàn tiền!' });
      },
    });
  }

  closeModal(): void {
    this.isDetailModalOpen = false;
    this.selectedRefund = null;
  }

  formatDate(date?: Date | string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  formatCurrency(amount?: number): string {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  formatKey(key: string): string {
    const keyMap: { [key: string]: string } = {
      orderRefundId: 'ID Hoàn tiền', orderId: 'ID Đơn hàng', orderNumber: 'Mã đơn hàng', amount: 'Số tiền', reason: 'Lý do', status: 'Trạng thái', statusName: 'Tên trạng thái', requestedAt: 'Ngày yêu cầu', requestedBy: 'Người yêu cầu', requestedByName: 'Tên người yêu cầu', transactionId: 'ID Giao dịch', processedAt: 'Ngày xử lý', processedBy: 'Người xử lý', processedByName: 'Tên người xử lý', notes: 'Ghi chú', createdAt: 'Ngày tạo', updatedAt: 'Ngày cập nhật',
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

