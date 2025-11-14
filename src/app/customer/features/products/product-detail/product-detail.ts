import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProductClient, GetProductBySlugResponse, CartClient, AddToCartRequest } from '@core/service/system-admin.service';
import { Subject, takeUntil, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/service/auth.service';

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

interface ProductImage {
  itemImageSrc: string;
  thumbnailImageSrc: string;
  alt: string;
  title: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    RouterModule,
    GalleriaModule,
    ImageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private productClient: ProductClient = inject(ProductClient);
  private messageService: MessageService = inject(MessageService);
  private cartClient: CartClient = inject(CartClient);
  private authService: AuthService = inject(AuthService);
  private destroy$ = new Subject<void>();

  product: GetProductBySlugResponse | null = null;
  isLoading: boolean = true;

  isFavorite: boolean = false;
  selectedValue: string = '500';
  selectedUnit: 'g' | 'kg' = 'g';
  quantity: number = 1;
  selectedVariantId: string | null = null;

  productImages: ProductImage[] = [];
  activeIndex: number = 0; // Thêm property để track active image

  responsiveOptions: any[] = [
    {
      breakpoint: '1400px',
      numVisible: 5,
    },
    {
      breakpoint: '1200px',
      numVisible: 4,
    },
    {
      breakpoint: '991px',
      numVisible: 5,
    },
    {
      breakpoint: '768px',
      numVisible: 4,
    },
    {
      breakpoint: '575px',
      numVisible: 3,
    },
  ];

  reviews: Review[] = [
    { id: 1, user: 'Alice', rating: 5, comment: 'Tuyệt vời, cà phê thơm ngon!' },
    { id: 2, user: 'Bob', rating: 4, comment: 'Khá ổn, nhưng hơi đắng.' },
    { id: 3, user: 'Charlie', rating: 5, comment: 'Đóng gói đẹp, giao hàng nhanh.' },
  ];

  ngOnInit(): void {
    // Lấy slug từ route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params['slug'];
      if (slug) {
        this.loadProductBySlug(slug);
      }
    });

  }

  loadProductBySlug(slug: string): void {
    this.isLoading = true;
    this.productClient
      .getBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.isSuccess && response?.data) {
            this.product = response.data;
            this.prepareProductImages();
          } else {
            console.error('❌ Failed to load product:', response?.errorMessage);
            // Có thể redirect về trang home hoặc hiển thị thông báo lỗi
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Error loading product:', err);
          this.isLoading = false;
          // Có thể redirect về trang home
          // this.router.navigate(['/home']);
        },
      });
  }

  prepareProductImages(): void {
    if (!this.product) return;

    this.productImages = [];

    // Thêm ảnh chính (primary image) vào đầu tiên
    const primaryImage = this.product.primaryImageUrl || '/images/product-image-1.png';
    this.productImages.push({
      itemImageSrc: primaryImage,
      thumbnailImageSrc: primaryImage,
      alt: this.product.name || 'Product',
      title: this.product.name || 'Product',
    });

    // Thêm các ảnh phụ từ images array (nếu có)
    if (this.product.images && this.product.images.length > 0) {
      this.product.images.forEach((img, index) => {
        if (img.imageUrl && img.imageUrl !== primaryImage) {
          this.productImages.push({
            itemImageSrc: img.imageUrl,
            thumbnailImageSrc: img.imageUrl,
            alt: `${this.product?.name} - Ảnh ${index + 2}`,
            title: `${this.product?.name} - Ảnh ${index + 2}`,
          });
        }
      });
    }

    // Reset active index về 0 khi load product mới
    this.activeIndex = 0;
  }

  // Phương thức để chuyển đến ảnh tiếp theo (nếu cần custom logic)
  nextImage(): void {
    if (this.productImages.length > 0) {
      this.activeIndex = (this.activeIndex + 1) % this.productImages.length;
    }
  }

  // Phương thức để chuyển đến ảnh trước (nếu cần custom logic)
  prevImage(): void {
    if (this.productImages.length > 0) {
      this.activeIndex =
        this.activeIndex > 0 ? this.activeIndex - 1 : this.productImages.length - 1;
    }
  }

  // Phương thức để chuyển đến ảnh cụ thể
  selectImage(index: number): void {
    if (index >= 0 && index < this.productImages.length) {
      this.activeIndex = index;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Chọn variant
  selectVariant(variantId: string): void {
    this.selectedVariantId = variantId;
    // Cập nhật hình ảnh khi chọn variant
    this.updateImagesForVariant();
  }

  // Cập nhật hình ảnh khi chọn variant
  updateImagesForVariant(): void {
    const selectedVariant = this.getSelectedVariant();

    // Nếu variant có ảnh riêng, hiển thị ảnh của variant
    if (selectedVariant && selectedVariant.imageUrl) {
      this.productImages = [
        {
          itemImageSrc: selectedVariant.imageUrl,
          thumbnailImageSrc: selectedVariant.imageUrl,
          alt: this.getProductName(),
          title: this.getProductName(),
        },
      ];
      this.activeIndex = 0;
    } else {
      // Nếu không có ảnh variant hoặc không chọn variant, hiển thị ảnh gốc
      this.prepareProductImages();
    }
  }

  // Lấy variant hiện tại đang được chọn
  getSelectedVariant() {
    if (!this.product || !this.selectedVariantId) return null;
    return this.product.variants?.find((v) => v.productVariantId === this.selectedVariantId);
  }

  // Lấy tên sản phẩm (bao gồm tên variant nếu có)
  getProductName(): string {
    if (!this.product) return '';
    const selectedVariant = this.getSelectedVariant();
    if (selectedVariant && selectedVariant.name) {
      return `${this.product.name} - ${selectedVariant.name}`;
    }
    return this.product.name || '';
  }

  // Lấy giá hiển thị (từ variant hoặc sản phẩm gốc)
  getDisplayPrice(): number {
    const selectedVariant = this.getSelectedVariant();

    if (selectedVariant) {
      // Nếu có variant được chọn, ưu tiên giá của variant
      if (selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price!) {
        return selectedVariant.discountPrice;
      }
      return selectedVariant.price || 0;
    }

    // Nếu không có variant, dùng giá của sản phẩm gốc
    if (this.product?.discountPrice && this.product.discountPrice < this.product.price!) {
      return this.product.discountPrice;
    }
    return this.product?.price || 0;
  }

  // Lấy giá gốc (chưa giảm)
  getOriginalPrice(): number {
    const selectedVariant = this.getSelectedVariant();
    if (selectedVariant) {
      return selectedVariant.price || 0;
    }
    return this.product?.price || 0;
  }

  // Lấy giá giảm (nếu có)
  getDiscountPrice(): number | undefined {
    const selectedVariant = this.getSelectedVariant();
    if (selectedVariant) {
      return selectedVariant.discountPrice;
    }
    return this.product?.discountPrice;
  }

  // Lấy URL hình ảnh
  getImageUrl(): string {
    const selectedVariant = this.getSelectedVariant();
    if (selectedVariant && selectedVariant.imageUrl) {
      return selectedVariant.imageUrl;
    }
    return this.product?.primaryImageUrl || '/images/product-image-1.png';
  }

  // Lấy số lượng tồn kho
  getStockQuantity(): number {
    const selectedVariant = this.getSelectedVariant();
    if (selectedVariant) {
      return selectedVariant.stockQuantity || 0;
    }
    return this.product?.stockQuantity || 0;
  }

  // Kiểm tra variant trước khi thêm vào giỏ
  addToCart(): void {
    if (!this.product) return;

    // Kiểm tra nếu có variants nhưng chưa chọn
    if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariantId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Vui lòng chọn phân loại',
        detail: 'Bạn cần chọn một phân loại sản phẩm trước khi thêm vào giỏ hàng',
        life: 3000,
      });
      return;
    }

    // Kiểm tra số lượng tồn kho
    const stockQuantity = this.getStockQuantity();
    if (stockQuantity <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Hết hàng',
        detail: 'Sản phẩm này hiện đã hết hàng',
        life: 3000,
      });
      return;
    }

    if (this.quantity > stockQuantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Vượt quá số lượng',
        detail: `Chỉ còn ${stockQuantity} sản phẩm trong kho`,
        life: 3000,
      });
      return;
    }

    // Lấy thông tin user để lấy userId
    this.authService.currentUser.pipe(take(1)).subscribe({
      next: (user) => {
        if (!user || !user.id) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Vui lòng đăng nhập',
            detail: 'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
            life: 3000,
          });
          // Redirect to login page
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: this.router.url }
          });
          return;
        }

        // Tạo request để thêm vào giỏ hàng
        const request = new AddToCartRequest({
          userId: user.id,
          productId: this.product!.productId,
          productVariantId: this.selectedVariantId || undefined,
          quantity: this.quantity
        });

        // Gọi API thêm vào giỏ hàng
        this.cartClient.addItemToCart(request)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response?.isSuccess) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Đã thêm sản phẩm vào giỏ hàng',
                  life: 3000,
                });
                // Reset quantity về 1 sau khi thêm thành công
                this.quantity = 1;
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: response?.errorMessage || 'Không thể thêm sản phẩm vào giỏ hàng',
                  life: 3000,
                });
              }
            },
            error: (error) => {
              console.error('❌ Error adding to cart:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng',
                life: 3000,
              });
            }
          });
      }
    });
  }

  // Kiểm tra variant trước khi thanh toán
  navigationToCheckout(): void {
    if (!this.product) return;

    // Kiểm tra nếu có variants nhưng chưa chọn
    if (this.product.variants && this.product.variants.length > 0 && !this.selectedVariantId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Vui lòng chọn phân loại',
        detail: 'Bạn cần chọn một phân loại sản phẩm trước khi thanh toán',
        life: 3000,
      });
      return;
    }

    // Kiểm tra số lượng tồn kho
    const stockQuantity = this.getStockQuantity();
    if (stockQuantity <= 0) {
      this.messageService.add({
        severity: 'error',
        summary: 'Hết hàng',
        detail: 'Sản phẩm này hiện đã hết hàng',
        life: 3000,
      });
      return;
    }

    if (this.quantity > stockQuantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Vượt quá số lượng',
        detail: `Chỉ còn ${stockQuantity} sản phẩm trong kho`,
        life: 3000,
      });
      return;
    }

    // Truyền thông tin sản phẩm (hoặc variant) qua navigation state
    this.router.navigate(['/checkout'], {
      state: {
        checkoutMode: 'single',
        product: {
          productId: this.product.productId,
          variantId: this.selectedVariantId,
          productName: this.getProductName(),
          imageUrl: this.getImageUrl(),
          unitPrice: this.getDisplayPrice(),
          quantity: this.quantity,
        },
      },
    });
  }
}
