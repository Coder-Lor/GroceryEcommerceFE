import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { MenuModule } from 'primeng/menu';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import {
    ProductClient,
    ProductBaseResponse,
    ShopDto,
    SortDirection,
    UpdateProductCommand,
    CategoryClient,
    CategoryDto,
} from '@core/service/system-admin.service';
import { Subject, takeUntil } from 'rxjs';
import { ProxyImagePipe } from '@shared/pipes/proxy-image.pipe';

@Component({
    selector: 'app-shop-products-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        DialogModule,
        TableModule,
        TagModule,
        ButtonModule,
        ProgressSpinnerModule,
        InputTextModule,
        TooltipModule,
        ConfirmDialogModule,
        ToastModule,
        MenuModule,
        ProxyImagePipe,
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './shop-products-modal.component.html',
    styleUrl: './shop-products-modal.component.scss',
})
export class ShopProductsModalComponent implements OnChanges, OnDestroy {
    @Input() visible = false;
    @Input() shop: ShopDto | null = null;
    @Output() visibleChange = new EventEmitter<boolean>();

    private destroy$ = new Subject<void>();

    products: ProductBaseResponse[] = [];
    isLoading = false;
    searchTerm = '';

    // Phân trang
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;

    // Menu actions
    menuItems: MenuItem[] = [];
    selectedProductForMenu: ProductBaseResponse | null = null;

    // Chi tiết sản phẩm (clone từ inventory-page)
    showDetailModal = false;
    detailProduct: ProductBaseResponse | null = null;
    isDetailEditMode = false;
    editingProduct: UpdateProductCommand | null = null;
    categories: CategoryDto[] = [];

    Math = Math;

    constructor(
        private readonly productClient: ProductClient,
        private readonly categoryClient: CategoryClient,
        private readonly messageService: MessageService,
        private readonly confirmationService: ConfirmationService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible'] && this.visible && this.shop?.shopId) {
            this.resetAndLoad();
            this.loadCategories();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    resetAndLoad(): void {
        this.currentPage = 1;
        this.searchTerm = '';
        this.loadProducts();
    }

    loadCategories(): void {
        this.categoryClient.getCategoryTree()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    if (response.isSuccess && response.data) {
                        this.categories = response.data;
                    }
                },
                error: (err) => console.error('Lỗi tải danh mục', err)
            });
    }

    loadProducts(): void {
        if (!this.shop?.shopId) return;

        this.isLoading = true;
        this.productClient
            .getProductsByShop(
                this.shop.shopId,
                this.currentPage,
                this.pageSize,
                this.searchTerm || undefined,
                'createdAt',
                SortDirection.Descending,
                undefined,
                undefined,
                undefined,
                false,
                !!this.searchTerm,
                true
            )
            .subscribe({
                next: (res) => {
                    if (res?.isSuccess && res.data?.items) {
                        this.products = res.data.items;
                        this.totalCount = res.data.totalCount ?? 0;
                    } else {
                        this.products = [];
                        this.totalCount = 0;
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Lỗi tải sản phẩm shop', err);
                    this.products = [];
                    this.totalCount = 0;
                    this.isLoading = false;
                },
            });
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadProducts();
    }

    changePage(delta: number): void {
        const next = this.currentPage + delta;
        const totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        if (next < 1 || next > totalPages) return;
        this.currentPage = next;
        this.loadProducts();
    }

    onHide(): void {
        this.visibleChange.emit(false);
    }

    getStatusSeverity(status?: number): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
        switch (status) {
            case 1:
                return 'success';
            case 0:
                return 'warn';
            default:
                return 'secondary';
        }
    }

    getStatusLabel(status?: number): string {
        switch (status) {
            case 1:
                return 'Hoạt động';
            case 0:
                return 'Ngưng';
            default:
                return 'N/A';
        }
    }

    formatPrice(price?: number): string {
        if (price === undefined || price === null) return '-';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    }

    getDiscountPercent(product: ProductBaseResponse): number | null {
        if (!product.discountPrice || !product.price || product.discountPrice >= product.price) {
            return null;
        }
        return Math.round(((product.price - product.discountPrice) / product.price) * 100);
    }

    // Mở menu actions cho sản phẩm
    openMenu(event: Event, menu: any, product: ProductBaseResponse): void {
        this.selectedProductForMenu = product;
        this.menuItems = [
            {
                label: 'Xem chi tiết',
                icon: 'pi pi-eye',
                command: () => this.viewProductDetail(product),
            },
            {
                label: 'Sửa sản phẩm',
                icon: 'pi pi-pencil',
                command: () => this.viewProductDetail(product, true),
            },
            {
                separator: true,
            },
            {
                label: 'Xoá sản phẩm',
                icon: 'pi pi-trash',
                styleClass: 'text-danger',
                command: () => this.confirmDelete(product),
            },
        ];
        menu.toggle(event);
    }

    // ==================== XEM CHI TIẾT SẢN PHẨM (clone từ inventory-page) ====================
    viewProductDetail(product: ProductBaseResponse, editMode = false): void {
        if (!product.productId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không tìm thấy ID sản phẩm',
                life: 3000,
            });
            return;
        }

        this.isLoading = true;

        this.productClient.getById(product.productId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.isLoading = false;

                    if (response.isSuccess && response.data) {
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
                        this.isDetailEditMode = editMode;

                        if (editMode) {
                            this.enableEditMode();
                        }

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

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.detailProduct = null;
        this.isDetailEditMode = false;
        this.editingProduct = null;
    }

    enableEditMode(): void {
        if (this.detailProduct) {
            this.isDetailEditMode = true;
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
        }
    }

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

        if (!this.validateUpdateProduct(this.editingProduct)) {
            return;
        }

        this.isLoading = true;

        this.productClient.update(this.editingProduct)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.isLoading = false;

                    if (response.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Thành công',
                            detail: 'Cập nhật sản phẩm thành công',
                            life: 3000,
                        });
                        this.closeDetailModal();
                        this.loadProducts();
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

    private validateUpdateProduct(product: UpdateProductCommand): boolean {
        if (!product.sku?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập mã SKU', life: 3000 });
            return false;
        }
        if (!product.name?.trim()) {
            this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Vui lòng nhập tên sản phẩm', life: 3000 });
            return false;
        }
        if ((product.price || 0) <= 0) {
            this.messageService.add({ severity: 'warn', summary: 'Cảnh báo', detail: 'Giá bán phải lớn hơn 0', life: 3000 });
            return false;
        }
        return true;
    }

    // ==================== XOÁ SẢN PHẨM (clone từ inventory-page) ====================
    confirmDelete(product: ProductBaseResponse): void {
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
                this.deleteProduct(product);
            },
        });
    }

    private deleteProduct(product: ProductBaseResponse): void {
        if (!product.productId) {
            this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Không tìm thấy ID sản phẩm',
                life: 3000,
            });
            return;
        }

        this.isLoading = true;

        this.productClient.delete(product.productId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.isLoading = false;

                    if (response.isSuccess) {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Thành công',
                            detail: `Đã xóa sản phẩm "${product.name}"`,
                            life: 3000,
                        });
                        this.loadProducts();
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

    // ==================== HELPER METHODS ====================
    getStockStatus(product: ProductBaseResponse): string {
        if ((product.stockQuantity || 0) === 0) return 'Hết hàng';
        if ((product.stockQuantity || 0) <= (product.minStockLevel || 0)) return 'Sắp hết';
        return 'Còn hàng';
    }

    getStockStatusClass(product: ProductBaseResponse): string {
        if ((product.stockQuantity || 0) === 0) return 'status-out';
        if ((product.stockQuantity || 0) <= (product.minStockLevel || 0)) return 'status-low';
        return 'status-ok';
    }
}
