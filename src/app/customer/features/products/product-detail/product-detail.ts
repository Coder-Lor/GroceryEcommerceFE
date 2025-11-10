import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { GalleriaModule } from 'primeng/galleria';
import { ImageModule } from 'primeng/image';
import { ProductClient, GetProductBySlugResponse } from '@core/service/system-admin.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

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
  imports: [CommonModule, FormsModule, TabsModule, RouterModule, GalleriaModule, ImageModule],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  private router: Router = inject(Router);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private productClient: ProductClient = inject(ProductClient);
  private destroy$ = new Subject<void>();

  product: GetProductBySlugResponse | null = null;
  isLoading: boolean = true;
  
  isFavorite: boolean = false;
  selectedValue: string = '500';
  selectedUnit: 'g' | 'kg' = 'g';
  quantity: number = 1;

  productImages: ProductImage[] = [];
  responsiveOptions: any[] = [
    {
      breakpoint: '1400px',
      numVisible: 5
    },
    {
      breakpoint: '1200px',
      numVisible: 4
    },
    {
      breakpoint: '991px',
      numVisible: 5
    },
    {
      breakpoint: '768px',
      numVisible: 4
    },
    {
      breakpoint: '575px',
      numVisible: 3
    }
  ];

  reviews: Review[] = [
    { id: 1, user: 'Alice', rating: 5, comment: 'Tuyệt vời, cà phê thơm ngon!' },
    { id: 2, user: 'Bob', rating: 4, comment: 'Khá ổn, nhưng hơi đắng.' },
    { id: 3, user: 'Charlie', rating: 5, comment: 'Đóng gói đẹp, giao hàng nhanh.' },
  ];

  ngOnInit(): void {
    // Lấy slug từ route params
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadProductBySlug(slug);
      }
    });
  }

  loadProductBySlug(slug: string): void {
    this.isLoading = true;
    this.productClient.getBySlug(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response?.isSuccess && response?.data) {
            this.product = response.data;
            this.prepareProductImages();
            console.log('✅ Product loaded:', this.product);
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
        }
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
      title: this.product.name || 'Product'
    });

    // Thêm các ảnh phụ từ images array (nếu có)
    if (this.product.images && this.product.images.length > 0) {
      this.product.images.forEach((img, index) => {
        if (img.imageUrl && img.imageUrl !== primaryImage) {
          this.productImages.push({
            itemImageSrc: img.imageUrl,
            thumbnailImageSrc: img.imageUrl,
            alt: `${this.product?.name} - Ảnh ${index + 2}`,
            title: `${this.product?.name} - Ảnh ${index + 2}`
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // toggleFavorate() {
  //   this.isFavorite = !this.isFavorite;
  // }
  navigationToCheckout() {
    if (!this.product) return;
    
    // Truyền thông tin sản phẩm qua navigation state
    this.router.navigate(['/checkout'], {
      state: {
        checkoutMode: 'single',
        product: {
          productId: this.product.productId,
          productName: this.product.name,
          imageUrl: this.product.primaryImageUrl || '/images/product-image-1.png',
          unitPrice: this.product.discountPrice && this.product.discountPrice < this.product.price 
            ? this.product.discountPrice 
            : this.product.price,
          quantity: this.quantity // Sử dụng quantity từ component
        }
      }
    });
  }
}
