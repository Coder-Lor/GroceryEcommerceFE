import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InventoryService } from '../../core/service/inventory.service';
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
  faEye,
  faImages,
  faStar,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../layout/loading-overlay/loading-overlay.component';
import {
  CategoryClient,
  CategoryDto,
  ResultOfListOfCategoryDto,
  CreateProductCommand,
  ProductBaseResponse,
  ProductClient,
  UpdateProductCommand,
  ProductVariantClient,
  CreateProductVariantRequest,
} from '@services/system-admin.service';
import { Subject, take, takeUntil } from 'rxjs';
import { Product } from './models/product.model';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipDirective } from '@shared/directives/tooltip';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    LoadingOverlayComponent,
    ConfirmDialogModule,
    ToastModule,
    TooltipDirective
],
  providers: [ConfirmationService, MessageService],
  templateUrl: 'inventory-page.component.html',
  styleUrls: ['inventory-page.component.scss'],
})
export class InventoryPageComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  currentPageProducts: Product[] = [];
  categories: CategoryDto[] | undefined = [];
  private destroy$ = new Subject<void>();
  searchTerm: string = '';
  layout: 'list' | 'grid' = 'grid';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 8;
  pageSizeOptions: number[] = [8, 16, 24, 40, 100];
  totalPages: number = 0;

  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentProduct: CreateProductCommand = this.getEmptyProduct();

  showDetailModal: boolean = false;
  detailProduct: Product | null = null;
  isDetailEditMode: boolean = false;
  editingProduct: UpdateProductCommand | null = null;
  
  // Variant modal
  showVariantModal: boolean = false;
  currentVariant: CreateProductVariantRequest = new CreateProductVariantRequest();
  variantSourceProduct: Product | null = null;
  
  // Image management for editing
  newImageFiles: File[] = [];
  imageIdsToDelete: string[] = [];
  existingImages: any[] = [];

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
  faEye = faEye;
  faImages = faImages;
  faStar = faStar;
  faStarRegular = faStarRegular;
  faLayerGroup = faLayerGroup;

  constructor(
    private inventoryService: InventoryService,
    private categoryClient: CategoryClient,
    private productClient: ProductClient,
    private productVariantClient: ProductVariantClient,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Subscribe to loading state from service
    this.inventoryService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading) => {
        this.isLoading = loading;
        console.log('[Inventory] Loading state changed:', loading);
        this.cdr.detectChanges();
      });

    this.inventoryService
      .getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((products) => {
        console.log('[Inventory] Received products:', products.length, 'items');
        this.products = products;
        this.currentPageProducts = products;
        this.cdr.detectChanges();
      });

    this.inventoryService
      .getPagingInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe((pagingInfo) => {
        console.log('[Inventory] Paging info updated:', pagingInfo);
        this.currentPage = pagingInfo.currentPage;
        this.totalPages = pagingInfo.totalPages;
        // Don't update pageSize from service to keep component's initial value
        this.cdr.detectChanges();
      });
    
    // Load products with component's pageSize instead of using initialize()
    this.inventoryService.loadProducts(this.currentPage, this.pageSize);

    this.categoryClient
      .getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResultOfListOfCategoryDto) => {
          if (response.isSuccess) {
            this.categories = response.data;
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

  // Search handler - call API with search keyword
  onSearch(): void {
    this.currentPage = 1; // Reset to first page on search
    const keyword = this.searchTerm.trim() || undefined;
    this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
  }

  // Pagination methods
  onPageSizeChange(): void {
    this.currentPage = 1;
    const keyword = this.searchTerm.trim() || undefined;
    this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const keyword = this.searchTerm.trim() || undefined;
      this.inventoryService.loadProducts(page, this.pageSize, keyword);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage <= 3) {
        pages.push(2, 3, 4, 5);
        pages.push(-1);
      } else if (currentPage >= totalPages - 2) {
        pages.push(-1);
        pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
      } else {
        pages.push(-1);
        pages.push(currentPage - 1, currentPage, currentPage + 1);
        pages.push(-1);
      }

      pages.push(totalPages);
    }

    return pages;
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  get paginationInfo(): string {
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredProducts.length);
    return `Hiển thị ${start} - ${end} trong tổng số ${this.filteredProducts.length} sản phẩm`;
  }

  // Filter products
  filterProducts(): void {
    this.currentPage = 1;
    const keyword = this.searchTerm.trim() || undefined;
    this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
  }

  // Sort products - Note: For full server-side sorting, modify API call
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
    
    // Update display after sorting
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.currentPageProducts = this.filteredProducts.slice(startIndex, endIndex);
  }

  // Change sort column
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

  // Xem chi tiết sản phẩm
  viewProductDetail(product: Product): void {
    console.log('viewProductDetail called with product:', product);
    console.log('Product ID:', product.productId);
    
    if (!product.productId) {
      console.error('Product ID is missing!');
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID sản phẩm',
        life: 3000,
      });
      return;
    }

    console.log('Calling API getById with productId:', product.productId);
    this.isLoading = true;
    
    // Call API to get full product details
    this.productClient
      .getById(product.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('API Response received:', response);
          this.isLoading = false;
          
          if (response.isSuccess && response.data) {
            console.log('Response data:', response.data);
            // Map API response to Product type
            this.detailProduct = ProductBaseResponse.fromJS({
              productId: response.data.productId,
              name: response.data.name,
              slug: response.data.slug,
              sku: response.data.sku,
              description: response.data.description,
              shortDescription: response.data.shortDescription,
              price: response.data.price,
              discountPrice: response.data.discountPrice,
              cost: response.data.cost,
              stockQuantity: response.data.stockQuantity,
              minStockLevel: response.data.minStockLevel,
              weight: response.data.weight,
              dimensions: response.data.dimensions,
              categoryId: response.data.categoryId,
              categoryName: response.data.categoryName,
              brandId: response.data.brandId,
              brandName: response.data.brandName,
              status: response.data.status,
              isFeatured: response.data.isFeatured,
              isDigital: response.data.isDigital,
              metaTitle: response.data.metaTitle,
              metaDescription: response.data.metaDescription,
              createdAt: response.data.createdAt,
              updatedAt: response.data.updatedAt,
              primaryImageUrl: response.data.primaryImageUrl,
              images: response.data.images,
              variants: response.data.variants,
              tags: response.data.tags,
              averageRating: response.data.averageRating,
              reviewCount: response.data.reviewCount
            });
            
            this.showDetailModal = true;
            this.isDetailEditMode = false;
            this.cdr.detectChanges();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể tải thông tin sản phẩm',
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error loading product details:', error);
          this.isLoading = false;
          
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã có lỗi xảy ra khi tải thông tin sản phẩm',
            life: 3000,
          });
        }
      });
  }

  // Đóng modal chi tiết
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.detailProduct = null;
    this.isDetailEditMode = false;
    this.editingProduct = null;
    // Reset image management
    this.newImageFiles = [];
    this.imageIdsToDelete = [];
    this.existingImages = [];
  }

  // Bật chế độ chỉnh sửa trong modal chi tiết
  enableEditMode(): void {
    if (this.detailProduct) {
      this.isDetailEditMode = true;
      
      // Tạo UpdateProductCommand từ detailProduct
      this.editingProduct = UpdateProductCommand.fromJS({
        productId: this.detailProduct.productId,
        name: this.detailProduct.name,
        slug: this.detailProduct.slug,
        sku: this.detailProduct.sku,
        description: this.detailProduct.description,
        shortDescription: this.detailProduct.shortDescription,
        price: this.detailProduct.price,
        discountPrice: this.detailProduct.discountPrice,
        cost: this.detailProduct.cost,
        stockQuantity: this.detailProduct.stockQuantity,
        minStockLevel: this.detailProduct.minStockLevel,
        weight: this.detailProduct.weight,
        dimensions: this.detailProduct.dimensions,
        categoryId: this.detailProduct.categoryId,
        brandId: this.detailProduct.brandId,
        status: this.detailProduct.status,
        isFeatured: this.detailProduct.isFeatured,
        isDigital: this.detailProduct.isDigital,
        metaTitle: this.detailProduct.metaTitle,
        metaDescription: this.detailProduct.metaDescription,
      });

      // Copy existing images
      this.existingImages = this.detailProduct.images ? 
        JSON.parse(JSON.stringify(this.detailProduct.images)) : [];
      this.newImageFiles = [];
      this.imageIdsToDelete = [];
    }
  }

  // Handle image selection for editing
  onEditImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: `File ${file.name} vượt quá 5MB`,
            life: 3000,
          });
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: `File ${file.name} không phải là ảnh`,
            life: 3000,
          });
          return;
        }

        // Add to new images array
        this.newImageFiles.push(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const imageUrl = e.target?.result as string;
          
          // Add to existing images for preview
          const newImage = {
            productImageId: `new-${Date.now()}-${Math.random()}`,
            imageUrl: imageUrl,
            altText: file.name,
            displayOrder: this.existingImages.length + this.newImageFiles.length - 1,
            isPrimary: this.existingImages.length === 0 && this.newImageFiles.length === 1,
            isNew: true
          };

          this.existingImages.push(newImage);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    input.value = '';
  }

  // Set image as primary in edit mode
  setEditPrimaryImage(index: number): void {
    if (this.existingImages && this.existingImages.length > 0) {
      // Remove primary from all images
      this.existingImages.forEach(img => img.isPrimary = false);
      // Set selected as primary
      this.existingImages[index].isPrimary = true;
      this.cdr.detectChanges();
    }
  }

  // Remove image in edit mode
  removeEditImage(index: number): void {
    if (this.existingImages && this.existingImages.length > 0) {
      const removedImage = this.existingImages[index];
      
      // If it's an existing image (has productImageId without 'new-' prefix), mark for deletion
      if (removedImage.productImageId && !removedImage.productImageId.startsWith('new-')) {
        this.imageIdsToDelete.push(removedImage.productImageId);
      } else {
        // If it's a new image, remove from newImageFiles
        const newImageIndex = this.existingImages
          .slice(0, index)
          .filter(img => img.isNew).length;
        if (newImageIndex >= 0 && newImageIndex < this.newImageFiles.length) {
          this.newImageFiles.splice(newImageIndex, 1);
        }
      }

      this.existingImages.splice(index, 1);

      // If removed image was primary and there are remaining images, set first as primary
      if (removedImage.isPrimary && this.existingImages.length > 0) {
        this.existingImages[0].isPrimary = true;
      }

      this.cdr.detectChanges();

      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa ảnh',
        life: 2000,
      });
    }
  }

  // Lưu thay đổi từ modal chi tiết
  saveDetailChanges(): void {
    if (!this.editingProduct || !this.editingProduct.productId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy thông tin sản phẩm để cập nhật',
        life: 3000,
      });
      return;
    }

    // Validate dữ liệu
    if (!this.validateUpdateProduct(this.editingProduct)) {
      return;
    }

    console.log('Updating product with data:', this.editingProduct);
    console.log('New images:', this.newImageFiles.length);
    console.log('Images to delete:', this.imageIdsToDelete.length);
    
    this.isLoading = true;

    // Nếu có ảnh mới hoặc ảnh cần xóa, sử dụng updateWithFiles
    if (this.newImageFiles.length > 0 || this.imageIdsToDelete.length > 0) {
      // Prepare image data
      const newImageAltTexts: string[] = [];
      const newImageDisplayOrders: number[] = [];
      const newImageIsPrimary: boolean[] = [];
      
      // Get info for new images
      let displayOrder = 0;
      this.existingImages.forEach((img, index) => {
        if (img.isNew) {
          newImageAltTexts.push(img.altText || this.editingProduct!.name || '');
          newImageDisplayOrders.push(displayOrder++);
          newImageIsPrimary.push(img.isPrimary || false);
        }
      });

      // Convert File[] to FileParameter[]
      const fileParameters = this.newImageFiles.map(file => ({
        data: file,
        fileName: file.name
      }));

      // Call updateWithFiles API
      this.productClient
        .updateWithFiles(
          this.editingProduct.productId,
          this.editingProduct.name,
          this.editingProduct.slug,
          this.editingProduct.sku,
          this.editingProduct.description,
          this.editingProduct.shortDescription,
          this.editingProduct.price,
          this.editingProduct.discountPrice,
          this.editingProduct.cost,
          this.editingProduct.stockQuantity,
          this.editingProduct.minStockLevel,
          this.editingProduct.weight,
          this.editingProduct.dimensions,
          this.editingProduct.categoryId,
          this.editingProduct.brandId,
          this.editingProduct.status,
          this.editingProduct.isFeatured,
          this.editingProduct.isDigital,
          this.editingProduct.metaTitle,
          this.editingProduct.metaDescription,
          fileParameters.length > 0 ? fileParameters : null,
          newImageAltTexts.length > 0 ? newImageAltTexts : null,
          newImageDisplayOrders.length > 0 ? newImageDisplayOrders : null,
          newImageIsPrimary.length > 0 ? newImageIsPrimary : null,
          this.imageIdsToDelete.length > 0 ? this.imageIdsToDelete : null,
          null, // variants
          null, // attributes
          null  // tagIds
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Update response:', response);
            this.isLoading = false;

            if (response.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật sản phẩm thành công',
                life: 3000,
              });
              this.closeDetailModal();
              // Refresh danh sách sản phẩm
              this.inventoryService.refreshProducts();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: response.errorMessage || 'Không thể cập nhật sản phẩm',
                life: 3000,
              });
            }
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.isLoading = false;

            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Đã có lỗi xảy ra khi cập nhật sản phẩm',
              life: 3000,
            });
          },
        });
    } else {
      // Không có thay đổi về ảnh, sử dụng update thông thường
      this.inventoryService
        .updateProductToServer(this.editingProduct)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Update response:', response);
            this.isLoading = false;

            if (response.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật sản phẩm thành công',
                life: 3000,
              });
              this.closeDetailModal();
              // Service sẽ tự động refresh danh sách
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: response.errorMessage || 'Không thể cập nhật sản phẩm',
                life: 3000,
              });
            }
          },
          error: (error) => {
            console.error('Error updating product:', error);
            this.isLoading = false;

            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Đã có lỗi xảy ra khi cập nhật sản phẩm',
              life: 3000,
            });
          },
        });
    }
  }

  // Validate sản phẩm khi cập nhật
  private validateUpdateProduct(product: UpdateProductCommand): boolean {
    if (!product.sku?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mã SKU',
        life: 3000,
      });
      return false;
    }
    if (!product.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên sản phẩm',
        life: 3000,
      });
      return false;
    }
    if ((product.price || 0) <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá bán phải lớn hơn 0',
        life: 3000,
      });
      return false;
    }
    if ((product.cost || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá vốn không được âm',
        life: 3000,
      });
      return false;
    }
    if ((product.stockQuantity || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Số lượng tồn kho không được âm',
        life: 3000,
      });
      return false;
    }
    if (!product.categoryId?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng chọn danh mục',
        life: 3000,
      });
      return false;
    }
    return true;
  }

  // Handle image selection
  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach(file => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: `File ${file.name} vượt quá 5MB`,
            life: 3000,
          });
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: `File ${file.name} không phải là ảnh`,
            life: 3000,
          });
          return;
        }

        // Read and create preview
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          const imageUrl = e.target?.result as string;
          
          // Add to currentProduct images
          if (!this.currentProduct.images) {
            this.currentProduct.images = [];
          }

          // Create new image object
          const newImage = {
            productImageId: `temp-${Date.now()}-${Math.random()}`,
            imageUrl: imageUrl,
            altText: file.name,
            displayOrder: this.currentProduct.images.length,
            isPrimary: this.currentProduct.images.length === 0, // First image is primary
            createdAt: new Date()
          };

          this.currentProduct.images.push(newImage as any);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input
    input.value = '';
  }

  // Set image as primary
  setPrimaryImage(index: number): void {
    if (this.currentProduct.images && this.currentProduct.images.length > 0) {
      // Remove primary from all images
      this.currentProduct.images.forEach(img => img.isPrimary = false);
      // Set selected as primary
      this.currentProduct.images[index].isPrimary = true;
      this.cdr.detectChanges();
    }
  }

  // Remove image
  removeImage(index: number): void {
    if (this.currentProduct.images && this.currentProduct.images.length > 0) {
      const removedImage = this.currentProduct.images[index];
      this.currentProduct.images.splice(index, 1);

      // If removed image was primary and there are remaining images, set first as primary
      if (removedImage.isPrimary && this.currentProduct.images.length > 0) {
        this.currentProduct.images[0].isPrimary = true;
      }

      this.cdr.detectChanges();

      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã xóa ảnh',
        life: 2000,
      });
    }
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

  // Open variant modal
  openAddVariantModal(product: Product): void {
    this.variantSourceProduct = product;
    
    // Initialize variant with product data
    this.currentVariant = new CreateProductVariantRequest();
    this.currentVariant.productId = product.productId;
    this.currentVariant.sku = product.sku + '-VAR-' + Date.now();
    this.currentVariant.name = product.name + ' - Phân loại';
    this.currentVariant.price = product.price;
    this.currentVariant.discountPrice = product.discountPrice;
    this.currentVariant.stockQuantity = product.stockQuantity;
    this.currentVariant.minStockLevel = product.minStockLevel;
    this.currentVariant.weight = product.weight;
    this.currentVariant.dimensions = product.dimensions;
    this.currentVariant.status = product.status || 1;
    
    this.showVariantModal = true;
  }

  // Close variant modal
  closeVariantModal(): void {
    this.showVariantModal = false;
    this.currentVariant = new CreateProductVariantRequest();
    this.variantSourceProduct = null;
  }

  // Save variant
  saveVariant(): void {
    if (!this.validateVariant()) {
      return;
    }

    this.isLoading = true;

    this.productVariantClient
      .createVariant(this.currentVariant)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Thêm phân loại sản phẩm thành công',
              life: 3000,
            });
            this.closeVariantModal();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể thêm phân loại sản phẩm',
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error creating variant:', error);
          this.isLoading = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã có lỗi xảy ra khi thêm phân loại sản phẩm',
            life: 3000,
          });
        },
      });
  }

  // Validate variant
  private validateVariant(): boolean {
    if (!this.currentVariant.productId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không tìm thấy ID sản phẩm',
        life: 3000,
      });
      return false;
    }
    if (!this.currentVariant.sku?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mã SKU cho phân loại',
        life: 3000,
      });
      return false;
    }
    if (!this.currentVariant.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên phân loại',
        life: 3000,
      });
      return false;
    }
    if ((this.currentVariant.price || 0) <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá bán phải lớn hơn 0',
        life: 3000,
      });
      return false;
    }
    if ((this.currentVariant.stockQuantity || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Số lượng tồn kho không được âm',
        life: 3000,
      });
      return false;
    }
    if ((this.currentVariant.minStockLevel || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Mức tồn tối thiểu không được âm',
        life: 3000,
      });
      return false;
    }
    return true;
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
