import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { faMagnifyingGlass, faTrashCan, faXmark, faEye, faSort, faSortUp, faSortDown, faTag, faCalendar, faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight, faRefresh, faHistory } from '@fortawesome/free-solid-svg-icons';
import { OrderStatusHistoryClient, SortDirection, ResultOfPagedResultOfOrderStatusHistoryDto, ResultOfOrderStatusHistoryDto, ResultOfBoolean, OrderStatusHistoryDto } from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-order-status-history-list',
  standalone: true,
  templateUrl: 'order-status-history-list.component.html',
  styleUrl: './order-status-history-list.component.scss',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, FaIconComponent, ToastModule, ConfirmDialogModule, TooltipDirective],
  providers: [MessageService, ConfirmationService],
})
export class OrderStatusHistoryListComponent implements OnInit {
  private orderStatusHistoryClient = inject(OrderStatusHistoryClient);
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
  faHistory = faHistory;

  histories: OrderStatusHistoryDto[] = [];
  filteredHistories: OrderStatusHistoryDto[] = [];
  selectedHistory: OrderStatusHistoryDto | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  searchTerm = '';
  sortColumn = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  Math = Math;
  SortDirection = SortDirection;

  ngOnInit(): void { this.loadHistories(); }

  loadHistories(): void {
    this.isLoading = true;
    const apiSortDirection = this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;
    this.orderStatusHistoryClient.getOrderStatusHistoriesPaging(this.currentPage, this.pageSize, this.searchTerm || undefined, this.sortColumn, apiSortDirection, undefined, undefined, undefined, false, !!this.searchTerm, true).subscribe({
      next: (response) => { this.isLoading = false; this.parseData(response); },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách lịch sử trạng thái!' }); },
    });
  }

  private parseData(response: ResultOfPagedResultOfOrderStatusHistoryDto): void {
    if (response.data && response.data.items) {
      this.histories = response.data.items;
      this.filteredHistories = [...this.histories];
      this.totalRecords = response.data.totalCount || 0;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    }
  }

  changeSortColumn(column: string): void {
    if (this.sortColumn === column) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; } else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.loadHistories();
  }

  onPageChange(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.loadHistories(); } }
  onPageSizeChange(): void { this.currentPage = 1; this.loadHistories(); }
  onSearch(): void { this.currentPage = 1; this.loadHistories(); }

  viewDetail(historyId: string): void {
    this.isLoading = true;
    this.orderStatusHistoryClient.getById(historyId).subscribe({
      next: (response: ResultOfOrderStatusHistoryDto) => {
        this.isLoading = false;
        if (response.data) {
          this.selectedHistory = response.data;
          this.isDetailModalOpen = true;
        }
      },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết!' }); },
    });
  }

  confirmDelete(history: OrderStatusHistoryDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa lịch sử trạng thái <strong>${history.orderStatusHistoryId}</strong>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteHistory(history),
    });
  }

  deleteHistory(history: OrderStatusHistoryDto): void {
    if (!history.orderStatusHistoryId) return;
    this.isLoading = true;
    this.orderStatusHistoryClient.delete(history.orderStatusHistoryId).subscribe({
      next: (response: ResultOfBoolean) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa thành công!' });
          this.loadHistories();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: response.errorMessage || 'Xóa thất bại' });
        }
      },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa!' }); },
    });
  }

  closeModal(): void { this.isDetailModalOpen = false; this.selectedHistory = null; }
  formatDate(date?: Date | string | null): string { if (!date) return 'N/A'; return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  getPageNumbers(): number[] { const pages: number[] = []; const maxVisible = 5; let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2)); let end = Math.min(this.totalPages, start + maxVisible - 1); if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1); for (let i = start; i <= end; i++) pages.push(i); return pages; }
  getObjectKeys(obj: any): string[] { return Object.keys(obj || {}); }
  formatKey(key: string): string { const keyMap: { [key: string]: string } = { orderStatusHistoryId: 'ID Lịch sử', orderId: 'ID Đơn hàng', status: 'Trạng thái', statusName: 'Tên trạng thái', createdBy: 'Người tạo', createdByName: 'Tên người tạo', notes: 'Ghi chú', createdAt: 'Ngày tạo' }; return keyMap[key] || key; }
  formatValue(value: any, key: string): string { if (value === null || value === undefined) return 'N/A'; if (key.includes('Date') || key.includes('At')) return this.formatDate(value); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
}

