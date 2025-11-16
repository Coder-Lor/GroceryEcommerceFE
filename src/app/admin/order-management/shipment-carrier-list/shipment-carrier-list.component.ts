import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { faMagnifyingGlass, faTrashCan, faXmark, faEye, faSort, faSortUp, faSortDown, faTag, faCalendar, faAnglesLeft, faAnglesRight, faChevronLeft, faChevronRight, faRefresh, faTruckFast } from '@fortawesome/free-solid-svg-icons';
import { ShipmentCarrierClient, SortDirection, ResultOfPagedResultOfShipmentCarrierDto, ShipmentCarrierDto } from '../../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-shipment-carrier-list',
  standalone: true,
  templateUrl: 'shipment-carrier-list.component.html',
  styleUrl: './shipment-carrier-list.component.scss',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent, FaIconComponent, ToastModule, ConfirmDialogModule, TooltipDirective],
  providers: [MessageService, ConfirmationService],
})
export class ShipmentCarrierListComponent implements OnInit {
  private shipmentCarrierClient = inject(ShipmentCarrierClient);
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
  faTruckFast = faTruckFast;

  carriers: ShipmentCarrierDto[] = [];
  filteredCarriers: ShipmentCarrierDto[] = [];
  selectedCarrier: ShipmentCarrierDto | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  searchTerm = '';
  sortColumn = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';
  Math = Math;
  SortDirection = SortDirection;

  ngOnInit(): void { this.loadCarriers(); }

  loadCarriers(): void {
    this.isLoading = true;
    const apiSortDirection = this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;
    this.shipmentCarrierClient.getShipmentCarriersPaging(this.currentPage, this.pageSize, this.searchTerm || undefined, this.sortColumn, apiSortDirection, undefined, undefined, undefined, false, !!this.searchTerm, true).subscribe({
      next: (response) => { this.isLoading = false; this.parseData(response); },
      error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách đơn vị vận chuyển!' }); },
    });
  }

  private parseData(response: ResultOfPagedResultOfShipmentCarrierDto): void {
    if (response.data && response.data.items) {
      this.carriers = response.data.items;
      this.filteredCarriers = [...this.carriers];
      this.totalRecords = response.data.totalCount || 0;
      this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
    }
  }

  changeSortColumn(column: string): void {
    if (this.sortColumn === column) { this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'; } else { this.sortColumn = column; this.sortDirection = 'asc'; }
    this.loadCarriers();
  }

  onPageChange(page: number): void { if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.loadCarriers(); } }
  onPageSizeChange(): void { this.currentPage = 1; this.loadCarriers(); }
  onSearch(): void { this.currentPage = 1; this.loadCarriers(); }

  viewDetail(carrierId: string): void {
    // Note: ShipmentCarrierClient may not have getById method, check the API
    this.isLoading = true;
    // For now, just show the carrier from the list
    const carrier = this.carriers.find(c => c.shipmentCarrierId === carrierId);
    if (carrier) {
      this.selectedCarrier = carrier;
      this.isDetailModalOpen = true;
      this.isLoading = false;
    } else {
      this.isLoading = false;
      this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không tìm thấy đơn vị vận chuyển!' });
    }
  }

  confirmDelete(carrier: ShipmentCarrierDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa đơn vị vận chuyển <strong>${carrier.name || carrier.shipmentCarrierId}</strong>?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.deleteCarrier(carrier),
    });
  }

  deleteCarrier(carrier: ShipmentCarrierDto): void {
    if (!carrier.shipmentCarrierId) return;
    this.isLoading = true;
    // Note: Check if ShipmentCarrierClient has delete method
    this.messageService.add({ severity: 'info', summary: 'Thông báo', detail: 'Chức năng xóa đang được phát triển' });
    this.isLoading = false;
    // this.shipmentCarrierClient.delete(carrier.shipmentCarrierId).subscribe({
    //   next: () => { this.isLoading = false; this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Xóa thành công!' }); this.loadCarriers(); },
    //   error: () => { this.isLoading = false; this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể xóa!' }); },
    // });
  }

  closeModal(): void { this.isDetailModalOpen = false; this.selectedCarrier = null; }
  formatDate(date?: Date | string | null): string { if (!date) return 'N/A'; return new Date(date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  getPageNumbers(): number[] { const pages: number[] = []; const maxVisible = 5; let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2)); let end = Math.min(this.totalPages, start + maxVisible - 1); if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1); for (let i = start; i <= end; i++) pages.push(i); return pages; }
  getObjectKeys(obj: any): string[] { return Object.keys(obj || {}); }
  formatKey(key: string): string { const keyMap: { [key: string]: string } = { shipmentCarrierId: 'ID Đơn vị vận chuyển', name: 'Tên', code: 'Mã', phone: 'Số điện thoại', website: 'Website', description: 'Mô tả', isActive: 'Hoạt động', createdAt: 'Ngày tạo', updatedAt: 'Ngày cập nhật' }; return keyMap[key] || key; }
  formatValue(value: any, key: string): string { if (value === null || value === undefined) return 'N/A'; if (key === 'isActive') return value ? 'Có' : 'Không'; if (key.includes('Date') || key.includes('At')) return this.formatDate(value); if (typeof value === 'object') return JSON.stringify(value); return String(value); }
}

