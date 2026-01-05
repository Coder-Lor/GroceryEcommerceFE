import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
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
  faCheck,
  faUpload,
  faCloudUpload,
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
  UpdateProductVariantRequest,
  ProductVariantDto,
  ProductImageClient,
  ShopClient,
  ShopDto,
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
  // Nếu có shopId => chạy chế độ inventory theo shop, ngược lại là inventory tổng
  @Input() shopId?: string;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  currentPageProducts: Product[] = [];
  categories: CategoryDto[] | undefined = [];
  shops: ShopDto[] = [];
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

  // Variant management modal
  showVariantModal: boolean = false;
  variantSourceProduct: Product | null = null;
  productVariants: ProductVariantDto[] = [];
  isLoadingVariants: boolean = false;

  // Variant form (add/edit)
  showVariantForm: boolean = false;
  variantFormMode: 'add' | 'edit' = 'add';
  createVariantRequest: CreateProductVariantRequest = new CreateProductVariantRequest();
  updateVariantRequest: UpdateProductVariantRequest = new UpdateProductVariantRequest();
  editingVariantId: string | null = null;
  productImageUrls: string[] = [];
  selectedImageUrl: string | null = null;
  variantImageFile: File | null = null;
  variantImagePreview: string | null = null;

  // Getters and setters for two-way binding
  get variantSku(): string | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.sku : this.updateVariantRequest.sku;
  }
  set variantSku(value: string | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.sku = value;
    } else {
      this.updateVariantRequest.sku = value;
    }
  }

  get variantName(): string | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.name : this.updateVariantRequest.name;
  }
  set variantName(value: string | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.name = value;
    } else {
      this.updateVariantRequest.name = value;
    }
  }

  get variantPrice(): number | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.price : this.updateVariantRequest.price;
  }
  set variantPrice(value: number | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.price = value;
    } else {
      this.updateVariantRequest.price = value;
    }
  }

  get variantDiscountPrice(): number | null | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.discountPrice : this.updateVariantRequest.discountPrice;
  }
  set variantDiscountPrice(value: number | null | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.discountPrice = value;
    } else {
      this.updateVariantRequest.discountPrice = value;
    }
  }

  get variantStockQuantity(): number | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.stockQuantity : this.updateVariantRequest.stockQuantity;
  }
  set variantStockQuantity(value: number | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.stockQuantity = value;
    } else {
      this.updateVariantRequest.stockQuantity = value;
    }
  }

  get variantMinStockLevel(): number | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.minStockLevel : this.updateVariantRequest.minStockLevel;
  }
  set variantMinStockLevel(value: number | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.minStockLevel = value;
    } else {
      this.updateVariantRequest.minStockLevel = value;
    }
  }

  get variantWeight(): number | null | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.weight : this.updateVariantRequest.weight;
  }
  set variantWeight(value: number | null | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.weight = value;
    } else {
      this.updateVariantRequest.weight = value;
    }
  }

  get variantDimensions(): string | null | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.dimensions : this.updateVariantRequest.dimensions;
  }
  set variantDimensions(value: string | null | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.dimensions = value;
    } else {
      this.updateVariantRequest.dimensions = value;
    }
  }

  get variantStatus(): number | undefined {
    return this.variantFormMode === 'add' ? this.createVariantRequest.status : this.updateVariantRequest.status;
  }
  set variantStatus(value: number | undefined) {
    if (this.variantFormMode === 'add') {
      this.createVariantRequest.status = value;
    } else {
      this.updateVariantRequest.status = value;
    }
  }

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
  faCheck = faCheck;
  faUpload = faUpload;
  faCloudUpload = faCloudUpload;

  constructor(
    private inventoryService: InventoryService,
    private categoryClient: CategoryClient,
    private productClient: ProductClient,
    private productVariantClient: ProductVariantClient,
    private productImageClient: ProductImageClient,
    private shopClient: ShopClient,
    private router: Router,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

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
    if (this.shopId) {
      this.inventoryService.loadProductsByShop(this.shopId, this.currentPage, this.pageSize);
    } else {
      this.inventoryService.loadProducts(this.currentPage, this.pageSize);
    }

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

    // Load shops
    this.shopClient
      .getShopsPaging(1, 100, undefined, undefined, undefined, undefined, undefined, undefined, false, false, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.isSuccess && response?.data?.items) {
            this.shops = response.data.items;
          }
        },
        error: (err) => {
          console.error('Lỗi tải danh sách shop:', err);
        }
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
    if (this.shopId) {
      this.inventoryService.loadProductsByShop(this.shopId, this.currentPage, this.pageSize, keyword);
    } else {
      this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
    }
  }

  // Pagination methods
  onPageSizeChange(): void {
    this.currentPage = 1;
    const keyword = this.searchTerm.trim() || undefined;
    if (this.shopId) {
      this.inventoryService.loadProductsByShop(this.shopId, this.currentPage, this.pageSize, keyword);
    } else {
      this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      const keyword = this.searchTerm.trim() || undefined;
      if (this.shopId) {
        this.inventoryService.loadProductsByShop(this.shopId, page, this.pageSize, keyword);
      } else {
        this.inventoryService.loadProducts(page, this.pageSize, keyword);
      }
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
    if (this.shopId) {
      this.inventoryService.loadProductsByShop(this.shopId, this.currentPage, this.pageSize, keyword);
    } else {
      this.inventoryService.loadProducts(this.currentPage, this.pageSize, keyword);
    }
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
    if (this.shopId) {
      // Đang dùng trong My Shop (seller) => điều hướng tới route dành cho seller
      this.router.navigate(['/my-shop/add-product']);
    } else {
      // Ngữ cảnh admin
      this.router.navigate(['/admin/inventory/add-new-product']);
    }
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
              shopId: response.data.shopId,
              shopName: response.data.shopName,
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
        shopId: this.detailProduct.shopId,
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
          this.editingProduct.shopId,
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
      'Giá giảm',
      'Tồn kho',
      'Mức tồn tối thiểu',
      'Trạng thái',
      'Danh mục',
    ];
    // Sử dụng products array thay vì filteredProducts
    const dataToExport = this.products.length > 0 ? this.products : this.currentPageProducts;
    const rows = dataToExport.map((p) => [
      this.escapeCSV(p.sku || ''),
      this.escapeCSV(p.name || ''),
      (p.cost || 0).toString(),
      (p.price || 0).toString(),
      (p.discountPrice || 0).toString(),
      (p.stockQuantity || 0).toString(),
      (p.minStockLevel || 0).toString(),
      this.getStockStatus(p),
      this.escapeCSV(this.getCategoryName(p.categoryId) || ''),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  // Escape CSV special characters
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // Get category name by ID
  private getCategoryName(categoryId: string | undefined): string {
    if (!categoryId || !this.categories) return '';
    const category = this.categories.find(c => c.categoryId === categoryId);
    return category?.name || '';
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
    product.shopId = undefined;
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

  // Open variant management modal
  openAddVariantModal(product: Product): void {
    this.variantSourceProduct = product;
    this.showVariantForm = false;
    this.variantFormMode = 'add';

    // Load product images for variant creation
    if (product.productId) {
      this.loadProductImages(product.productId);
      this.loadProductVariants(product.productId);
    }

    this.showVariantModal = true;
  }

  // Load product variants
  loadProductVariants(productId: string): void {
    this.isLoadingVariants = true;
    this.productVariantClient
      .getByProduct(productId, 1, 100, undefined, undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingVariants = false;
          if (response.isSuccess && response.data) {
            this.productVariants = response.data.items || [];
          } else {
            this.productVariants = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading variants:', error);
          this.isLoadingVariants = false;
          this.productVariants = [];
          this.cdr.detectChanges();
        },
      });
  }

  // Load product images
  loadProductImages(productId: string): void {
    this.productImageClient
      .getUrlsByProduct(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.isSuccess && response.data) {
            this.productImageUrls = response.data;
          } else {
            this.productImageUrls = [];
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading product images:', error);
          this.productImageUrls = [];
          this.cdr.detectChanges();
        },
      });
  }

  // Close variant modal
  closeVariantModal(): void {
    this.showVariantModal = false;
    this.showVariantForm = false;
    this.createVariantRequest = new CreateProductVariantRequest();
    this.updateVariantRequest = new UpdateProductVariantRequest();
    this.editingVariantId = null;
    this.variantSourceProduct = null;
    this.productVariants = [];
    this.productImageUrls = [];
    this.selectedImageUrl = null;
    this.variantImageFile = null;
    this.variantImagePreview = null;
  }

  // Show form to add new variant
  openAddVariantForm(): void {
    if (!this.variantSourceProduct) return;

    this.variantFormMode = 'add';
    this.createVariantRequest = new CreateProductVariantRequest();
    this.createVariantRequest.productId = this.variantSourceProduct.productId;
    this.createVariantRequest.sku = this.variantSourceProduct.sku + '-VAR-' + Date.now();
    this.createVariantRequest.name = this.variantSourceProduct.name + ' - Phân loại';
    this.createVariantRequest.price = this.variantSourceProduct.price;
    this.createVariantRequest.discountPrice = this.variantSourceProduct.discountPrice;
    this.createVariantRequest.stockQuantity = this.variantSourceProduct.stockQuantity;
    this.createVariantRequest.minStockLevel = this.variantSourceProduct.minStockLevel;
    this.createVariantRequest.weight = this.variantSourceProduct.weight;
    this.createVariantRequest.dimensions = this.variantSourceProduct.dimensions;
    this.createVariantRequest.status = this.variantSourceProduct.status || 1;

    this.editingVariantId = null;
    this.selectedImageUrl = null;
    this.variantImageFile = null;
    this.variantImagePreview = null;
    this.showVariantForm = true;
  }

  // Show form to edit existing variant
  openEditVariantForm(variant: ProductVariantDto): void {
    this.variantFormMode = 'edit';
    this.editingVariantId = variant.productVariantId || null;

    // Create UpdateProductVariantRequest from existing variant
    this.updateVariantRequest = new UpdateProductVariantRequest();
    this.updateVariantRequest.sku = variant.sku;
    this.updateVariantRequest.name = variant.name;
    this.updateVariantRequest.price = variant.price;
    this.updateVariantRequest.discountPrice = variant.discountPrice;
    this.updateVariantRequest.stockQuantity = variant.stockQuantity;
    this.updateVariantRequest.minStockLevel = variant.minStockLevel;
    this.updateVariantRequest.weight = variant.weight;
    this.updateVariantRequest.dimensions = variant.dimensions;
    this.updateVariantRequest.status = variant.status;

    this.selectedImageUrl = variant.imageUrl || null;
    this.variantImageFile = null;
    this.variantImagePreview = null;
    this.showVariantForm = true;
  }

  // Cancel variant form
  cancelVariantForm(): void {
    this.showVariantForm = false;
    this.createVariantRequest = new CreateProductVariantRequest();
    this.updateVariantRequest = new UpdateProductVariantRequest();
    this.editingVariantId = null;
    this.selectedImageUrl = null;
    this.variantImageFile = null;
    this.variantImagePreview = null;
  }

  // Select existing product image for variant
  selectProductImage(imageUrl: string): void {
    if (this.selectedImageUrl === imageUrl) {
      // Deselect if clicking the same image
      this.selectedImageUrl = null;
    } else {
      this.selectedImageUrl = imageUrl;
      // Clear new image file if selecting existing image
      this.variantImageFile = null;
      this.variantImagePreview = null;
    }
  }

  // Handle new image file selection for variant
  onVariantImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `File ${file.name} vượt quá 5MB`,
          life: 3000,
        });
        input.value = '';
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
        input.value = '';
        return;
      }

      this.variantImageFile = file;
      // Clear selected existing image if uploading new file
      this.selectedImageUrl = null;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.variantImagePreview = e.target?.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    input.value = '';
  }

  // Remove selected variant image
  removeVariantImage(): void {
    this.variantImageFile = null;
    this.variantImagePreview = null;
    this.selectedImageUrl = null;
  }

  // Save variant (create or update)
  saveVariant(): void {
    if (!this.validateVariant()) {
      return;
    }

    this.isLoading = true;

    const currentRequest = this.variantFormMode === 'add' ? this.createVariantRequest : this.updateVariantRequest;

    // Prepare the request based on image selection
    // Case 1: No image - imageUrl and imageFile remain undefined
    // Case 2: Selected existing image - set imageUrl
    if (this.selectedImageUrl) {
      currentRequest.imageUrl = this.selectedImageUrl;
      currentRequest.imageFile = undefined;
    }
    // Case 3: New image file - set imageFile
    else if (this.variantImageFile) {
      // Convert File to FileUploadDto
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const base64Content = (e.target?.result as string).split(',')[1]; // Remove data:image/...;base64, prefix

        currentRequest.imageFile = {
          content: base64Content,
          fileName: this.variantImageFile!.name,
          contentType: this.variantImageFile!.type
        } as any;
        currentRequest.imageUrl = undefined;

        // Call API after file is converted
        if (this.variantFormMode === 'add') {
          this.executeCreateVariant();
        } else {
          this.executeUpdateVariant();
        }
      };
      reader.readAsDataURL(this.variantImageFile);
      return; // Exit here, will continue in reader.onload
    } else {
      // Case 1: No image
      currentRequest.imageUrl = undefined;
      currentRequest.imageFile = undefined;
    }

    // Call API for cases 1 and 2
    if (this.variantFormMode === 'add') {
      this.executeCreateVariant();
    } else {
      this.executeUpdateVariant();
    }
  }

  // Create variant API request
  private executeCreateVariant(): void {
    this.productVariantClient
      .createVariant(this.createVariantRequest)
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
            this.cancelVariantForm();
            // Reload variants list
            if (this.variantSourceProduct?.productId) {
              this.loadProductVariants(this.variantSourceProduct.productId);
            }
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

  // Update variant API request
  private executeUpdateVariant(): void {
    if (!this.editingVariantId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID phân loại cần cập nhật',
        life: 3000,
      });
      this.isLoading = false;
      return;
    }

    this.productVariantClient
      .updateVariant(this.editingVariantId, this.updateVariantRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Cập nhật phân loại sản phẩm thành công',
              life: 3000,
            });
            this.cancelVariantForm();
            // Reload variants list
            if (this.variantSourceProduct?.productId) {
              this.loadProductVariants(this.variantSourceProduct.productId);
            }
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể cập nhật phân loại sản phẩm',
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error updating variant:', error);
          this.isLoading = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã có lỗi xảy ra khi cập nhật phân loại sản phẩm',
            life: 3000,
          });
        },
      });
  }

  // Confirm delete variant
  confirmDeleteVariant(variant: ProductVariantDto): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc muốn xóa phân loại "${variant.name}"?<br/>Hành động này không thể hoàn tác.`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      defaultFocus: 'reject',
      accept: () => {
        this.deleteVariant(variant.productVariantId!);
      },
    });
  }

  // Delete variant
  private deleteVariant(variantId: string): void {
    this.isLoading = true;

    this.productVariantClient
      .deleteVariant(variantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Xóa phân loại sản phẩm thành công',
              life: 3000,
            });
            // Reload variants list
            if (this.variantSourceProduct?.productId) {
              this.loadProductVariants(this.variantSourceProduct.productId);
            }
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể xóa phân loại sản phẩm',
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error deleting variant:', error);
          this.isLoading = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã có lỗi xảy ra khi xóa phân loại sản phẩm',
            life: 3000,
          });
        },
      });
  }

  // Validate variant
  private validateVariant(): boolean {
    const currentRequest = this.variantFormMode === 'add' ? this.createVariantRequest : this.updateVariantRequest;

    // Check productId only for create mode
    if (this.variantFormMode === 'add') {
      if (!this.createVariantRequest.productId) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không tìm thấy ID sản phẩm',
          life: 3000,
        });
        return false;
      }
    }
    if (!currentRequest.sku?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập mã SKU cho phân loại',
        life: 3000,
      });
      return false;
    }
    if (!currentRequest.name?.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên phân loại',
        life: 3000,
      });
      return false;
    }
    if ((currentRequest.price || 0) <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Giá bán phải lớn hơn 0',
        life: 3000,
      });
      return false;
    }
    if ((currentRequest.stockQuantity || 0) < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Số lượng tồn kho không được âm',
        life: 3000,
      });
      return false;
    }
    if ((currentRequest.minStockLevel || 0) < 0) {
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
