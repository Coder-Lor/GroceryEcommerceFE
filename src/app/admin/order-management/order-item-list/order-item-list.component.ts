import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { faMagnifyingGlass, faTrashCan, faXmark, faEye, faSort, faSortUp, faSortDown, faTag, faCalendar, faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight, faRefresh, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { OrderItemClient, SortDirection, ResultOfPagedResultOfOrderItemDto, ResultOfOrderItemDto, ResultOfBoolean, OrderItemDto } from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-order-item-list',
  standalone: true,
  templateUrl: 'order-item-list.component.html',
  styleUrl: './order-item-list.component.scss',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, FaIconComponent, ToastModule, ConfirmDialogModule, TooltipDirective],
  providers: [MessageService, ConfirmationService],
})
export class OrderItemListComponent implements OnInit {
  private orderItemClient = inject(OrderItemClient);
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
  faShoppingCart = faShoppingCart;

  items: OrderItemDto[] = [];
  filteredItems: OrderItemDto[] = [];
  selectedItem: OrderItemDto | null = null;
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

  ngOnInit(): void { this.loadItems(); }

  loadItems(): void {
    this.isLoading = true;
    const apiSortDirection = this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;
    this.orderItemClient.getOrderItemsPaging(this.currentPage, this.pageSize, this.searchTerm || undefined, this.sortColumn, apiSortDirection, undefined, undefined, undefined, false, !!this.searchTerm, true).subscribe({
      next: (response) => { this.isLoading = false; this.parseData(response); },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách sản phẩm đơn hàng!' }); },
    });
  }

  private parseData(response: ResultOfPagedResultOfOrderItemDto): void {
    if (response.data && response.data.items) {
      this.items = response.data.items;
      this.filteredItems = [...this.items];
      this.totalRecords = response.data.totalCount || 0;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    }
  }

  changeSortColumn(column: string): void {
    if (this.sortColumn === column) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; } else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.loadItems();
  }

  onPageChange(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.loadItems(); } }
  onPageSizeChange(): void { this.currentPage = 1; this.loadItems(); }
  onSearch(): void { this.currentPage = 1; this.loadItems(); }

  viewDetail(itemId: string): void {
    this.isLoading = true;
    this.orderItemClient.getById(itemId).subscribe({
      next: (response: ResultOfOrderItemDto) => {
        this.isLoading = false;
        if (response.data) {
          this.selectedItem = response.data;
          this.isDetailModalOpen = true;
        }
      },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải chi tiết!' }); },
    });
  }

  confirmDelete(item: OrderItemDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa sản phẩm đơn hàng <strong>${item.orderItemId}</strong>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteItem(item),
    });
  }

  deleteItem(item: OrderItemDto): void {
    if (!item.orderItemId) return;
    this.isLoading = true;
    this.orderItemClient.delete(item.orderItemId).subscribe({
      next: (response: ResultOfBoolean) => {
        this.isLoading = false;
        if (response.isSuccess !== false) {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa thành công!' });
          this.loadItems();
        } else {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: response.errorMessage || 'Xóa thất bại' });
        }
      },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa!' }); },
    });
  }

  closeModal(): void { this.isDetailModalOpen = false; this.selectedItem = null; }
  formatDate(date?: Date | string | null): string { if (!date) return 'N/A'; return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  formatCurrency(amount?: number): string { if (amount === undefined || amount === null) return '0 ₫'; return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount); }
  getPageNumbers(): number[] { const pages: number[] = []; const maxVisible = 5; let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2)); let end = Math.min(this.totalPages, start + maxVisible - 1); if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1); for (let i = start; i <= end; i++) pages.push(i); return pages; }
  getObjectKeys(obj: any): string[] { return Object.keys(obj || {}); }
  formatKey(key: string): string { const keyMap: { [key: string]: string } = { orderItemId: 'ID Sản phẩm đơn hàng', orderId: 'ID Đơn hàng', productId: 'ID Sản phẩm', productName: 'Tên sản phẩm', productSku: 'SKU Sản phẩm', productImageUrl: 'Hình ảnh', productVariantId: 'ID Biến thể', variantName: 'Tên biến thể', unitPrice: 'Đơn giá', quantity: 'Số lượng', totalPrice: 'Thành tiền', createdAt: 'Ngày tạo' }; return keyMap[key] || key; }
  formatValue(value: any, key: string): string { if (value === null || value === undefined) return 'N/A'; if (key.includes('Date') || key.includes('At')) return this.formatDate(value); if (key.includes('Amount') || key.includes('Price') || key.includes('Cost')) return this.formatCurrency(value); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
}
