import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService, PagingInfo } from '../../core/service/inventory.service';
import {
  faPlus,
  faChartSimple,
  faFile,
  faFileArrowDown,
  faDownload,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faBox,
  faMoneyBill,
  faTriangleExclamation,
  faCircleXmark,
  faFileExport,
  faHurricane,
  faCoins,
  faSort,
  faSortUp,
  faSortDown,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faAnglesLeft,
  faAnglesRight,
} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  CategoryClient,
  CategoryDto,
  ResultOfListOfCategoryDto,
  CreateProductCommand,
  ProductBaseResponse,
  ProductClient,
} from '@services/system-admin.service';
import { Subject, take, takeUntil } from 'rxjs';
import { Product } from './models/product.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProductCard } from 'app/customer/shared/components/product-card/product-card';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    ConfirmDialogModule,
    ToastModule,
    ProductCard,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: 'inventory-page.component.html',
  styleUrls: ['inventory-page.component.scss'],
})
export class InventoryPageComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: CategoryDto[] | undefined = [];
  private destroy$ = new Subject<void>();
  searchTerm: string = '';

  // Paging properties
  pagingInfo: PagingInfo = {
    totalCount: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
    hasPreviousPage: false,
    hasNextPage: false,
  };
  pageSizeOptions: number[] = [5, 10, 20, 50, 100];

  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentProduct: CreateProductCommand = this.getEmptyProduct();

  showReport: boolean = false;
  report: any = null;
  // report: InventoryReport | null = null;
  isLoading: boolean = false;

  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  showStatusFilterModal: boolean = false;
  statusFilters: { [key: string]: boolean } = {
    'Còn hàng': true,
    'Sắp hết': true,
    'Hết hàng': true,
  };
  statusOptions: string[] = Object.keys(this.statusFilters);

  faPlus = faPlus;
  faChartSimple = faChartSimple;
  faFileArrowDown = faFileArrowDown;
  faDownload = faDownload;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faBox = faBox;
  faMoneyBill = faMoneyBill;
  faTriangleExclamation = faTriangleExclamation;
  faCircleXmark = faCircleXmark;
  faFileExport = faFileExport;
  faCoins = faCoins;
  faHurricane = faHurricane;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faFilter = faFilter;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;

  constructor(
    private inventoryService: InventoryService,
    private categoryClient: CategoryClient,
    private productClient: ProductClient,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[Inventory] ngOnInit - START');
    this.isLoading = true;
    console.log('[Inventory] Setting isLoading = true');
    this.cdr.detectChanges(); // Force change detection

    // Subscribe to products FIRST - before loading data
    this.inventoryService
      .getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((products) => {
        console.log('[Inventory] Received products:', products.length, 'items');
        this.products = products;
        this.filteredProducts = [...products];

        // Only turn off loading if we have data or it's not initial load
        if (products.length > 0 || this.products.length > 0) {
          this.isLoading = false;
          console.log('[Inventory] Setting isLoading = false');
          this.cdr.detectChanges(); // Force change detection
        }
      });

    // Subscribe to paging info
    this.inventoryService
      .getPagingInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((pagingInfo) => {
        console.log('[Inventory] Paging info updated:', pagingInfo);
        this.pagingInfo = pagingInfo;

        // Turn off loading when paging info is updated with data
        if (pagingInfo.totalCount > 0 && this.isLoading) {
          this.isLoading = false;
          console.log('[Inventory] Setting isLoading = false (from paging)');
          this.cdr.detectChanges();
        }
      });

    // NOW initialize/load data AFTER subscriptions are set up
    console.log('[Inventory] Calling initialize()');
    this.inventoryService.initialize();

    this.categoryClient
      .getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResultOfListOfCategoryDto) => {
          if (response.isSuccess) {
            this.categories = response.data;
            console.log(this.categories);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể tải danh mục',
              life: 3000,
            });
          }
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Paging methods
  onPageSizeChange(): void {
    console.log('[Inventory] onPageSizeChange - Setting isLoading = true');
    this.isLoading = true;
    this.cdr.detectChanges(); // Force change detection
    this.inventoryService.changePageSize(this.pagingInfo.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagingInfo.totalPages) {
      console.log('[Inventory] goToPage', page, '- Setting isLoading = true');
      this.isLoading = true;
      this.cdr.detectChanges(); // Force change detection
      this.inventoryService.changePage(page);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.pagingInfo.totalPages);
  }

  goToPreviousPage(): void {
    if (this.pagingInfo.hasPreviousPage) {
      this.goToPage(this.pagingInfo.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.pagingInfo.hasNextPage) {
      this.goToPage(this.pagingInfo.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagingInfo.totalPages;
    const currentPage = this.pagingInfo.currentPage;

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, 5);
        pages.push(-1); // Ellipsis
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(-1); // Ellipsis
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        // In the middle
        pages.push(-1); // Ellipsis
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push(-1); // Ellipsis
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  }

  // Lọc sản phẩm theo từ khóa - Note: Filtering is now done on server side via API
  // This method is kept for client-side filtering of status only
  filterProducts(): void {
    let productsToFilter = [...this.products];

    // Lọc theo trạng thái (client-side)
    const activeStatusFilters = this.statusOptions.filter((status) => this.statusFilters[status]);
    // Only filter if not all options are selected
    if (activeStatusFilters.length > 0 && activeStatusFilters.length < this.statusOptions.length) {
      productsToFilter = productsToFilter.filter((p) =>
        activeStatusFilters.includes(this.getStockStatus(p))
      );
    }

    this.filteredProducts = productsToFilter;
  }

  // Sắp xếp sản phẩm - Note: Sorting is now done on server side via API
  // This method is kept for client-side sorting only if needed
  sortProducts(): void {
    this.filteredProducts.sort((a, b) => {
      let aValue: any = (a as any)[this.sortColumn];
      let bValue: any = (b as any)[this.sortColumn];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Thay đổi cột sắp xếp - Note: In future, this should trigger server-side sorting
  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortProducts();
  }

  openStatusFilterModal(event: Event): void {
    event.stopPropagation();
    this.showStatusFilterModal = true;
  }

  closeStatusFilterModal(): void {
    this.showStatusFilterModal = false;
  }

  // Mở modal thêm sản phẩm - Giờ chuyển sang navigate
  openAddModal(): void {
    this.router.navigate(['/admin/inventory/add-new-product']);
  }

  // Mở modal sửa sản phẩm
  openEditModal(product: CreateProductCommand): void {
    this.modalMode = 'edit';
    this.currentProduct = CreateProductCommand.fromJS(product.toJSON());
    this.showModal = true;
  }

  // Đóng modal
  closeModal(): void {
    this.showModal = false;
    this.currentProduct = this.getEmptyProduct();
  }

  // Lưu sản phẩm
  saveProduct(): void {
    if (this.validateProduct()) {
      if (this.modalMode === 'add') {
        // this.inventoryService.addProduct(this.currentProduct);
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Chức năng này đã được chuyển sang trang thêm sản phẩm mới',
          life: 3000,
        });
      } else {
        // Note: UpdateProduct requires proper product ID mapping
        // this.inventoryService.updateProduct(this.currentProduct.productId!, this.currentProduct);
        this.messageService.add({
          severity: 'info',
          summary: 'Thông báo',
          detail: 'Chức năng cập nhật sẽ được hoàn thiện sau',
          life: 3000,
        });
      }
      this.closeModal();
    }
  }

  // Xác nhận xóa sản phẩm
  confirmDelete(product: Product): void {
    console.log('confirmDelete called with product:', product);

    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa sản phẩm "${product.name}"?<br/>Hành động này không thể hoàn tác.`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      defaultFocus: 'reject',
      accept: () => {
        console.log('User accepted delete');
        this.deleteProduct(product);
      },
      reject: () => {
        console.log('User rejected delete');
      },
    });
  }

  // Xóa sản phẩm
  private deleteProduct(product: Product): void {
    console.log('deleteProduct called with product:', product);

    if (!product.productId) {
      console.error('Product ID is missing:', product);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID sản phẩm',
        life: 3000,
      });
      return;
    }

    console.log('Calling API to delete product with ID:', product.productId);
    this.isLoading = true;

    this.productClient
      .delete(product.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Delete API response:', response);
          this.isLoading = false;

          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: `Đã xóa sản phẩm "${product.name}"`,
              life: 3000,
            });
            // Refresh danh sách sản phẩm
            this.isLoading = true; // Set loading before refresh
            this.inventoryService.refreshProducts();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể xóa sản phẩm',
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.isLoading = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã có lỗi xảy ra khi xóa sản phẩm',
            life: 3000,
          });
        },
      });
  }

  // Hiển thị báo cáo
  showInventoryReport(): void {
    this.report = this.inventoryService.generateReport();
    this.showReport = true;
  }

  // Đóng báo cáo
  closeReport(): void {
    this.showReport = false;
    this.report = null;
  }

  // Xuất báo cáo (CSV)
  exportReport(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Tạo nội dung CSV
  private generateCSV(): string {
    const headers = [
      'SKU',
      'Tên sản phẩm',
      'Giá vốn',
      'Giá bán',
      'Tồn kho',
      'Mức tồn tối thiểu',
      'Trạng thái',
    ];
    const rows = this.filteredProducts.map((p) => [
      p.sku,
      p.name,
      (p.cost || 0).toString(),
      (p.price || 0).toString(),
      (p.stockQuantity || 0).toString(),
      (p.minStockLevel || 0).toString(),
      this.getStockStatus(p),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  // Lấy trạng thái tồn kho
  getStockStatus(product: CreateProductCommand): string {
    if ((product.stockQuantity || 0) === 0) return 'Hết hàng';
    if ((product.stockQuantity || 0) <= (product.minStockLevel || 0)) return 'Sắp hết';
    return 'Còn hàng';
  }

  // Lấy class CSS cho trạng thái
  getStockStatusClass(product: CreateProductCommand): string {
    if ((product.stockQuantity || 0) === 0) return 'status-out';
    if ((product.stockQuantity || 0) <= (product.minStockLevel || 0)) return 'status-low';
    return 'status-ok';
  }

  // Validate sản phẩm
  private validateProduct(): boolean {
    if (!this.currentProduct.sku?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mã SKU',
        life: 3000,
      });
      return false;
    }
    if (!this.currentProduct.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên sản phẩm',
        life: 3000,
      });
      return false;
    }
    if ((this.currentProduct.price || 0) <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá bán phải lớn hơn 0',
        life: 3000,
      });
      return false;
    }
    if ((this.currentProduct.cost || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá vốn không được âm',
        life: 3000,
      });
      return false;
    }
    if ((this.currentProduct.stockQuantity || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Số lượng tồn kho không được âm',
        life: 3000,
      });
      return false;
    }
    return true;
  }

  // Tạo sản phẩm rỗng
  private getEmptyProduct(): CreateProductCommand {
    const product = new CreateProductCommand();
    product.sku = '';
    product.name = '';
    product.slug = '';
    product.shortDescription = '';
    product.description = '';
    product.cost = 0;
    product.price = 0;
    product.discountPrice = 0;
    product.stockQuantity = 0;
    product.minStockLevel = 10;
    product.weight = 0;
    product.dimensions = '';
    product.status = 1;
    product.isFeatured = false;
    product.isDigital = false;
    return product;
  }

  // Tính giá trị tồn kho
  calculateStockValue(product: CreateProductCommand): number {
    return (product.stockQuantity || 0) * (product.cost || 0);
  }

  // Format tiền tệ
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  // Object keys helper cho báo cáo
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  getSeverity(product: any) {
    switch (product.inventoryStatus) {
      case 'INSTOCK':
        return 'success';

      case 'LOWSTOCK':
        return 'warn';

      case 'OUTOFSTOCK':
        return 'danger';

      default:
        return null;
    }
  }
}
