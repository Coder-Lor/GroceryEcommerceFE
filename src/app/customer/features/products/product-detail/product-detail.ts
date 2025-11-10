import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { ProductClient, GetProductBySlugResponse } from '@core/service/system-admin.service';
import { Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule, FormsModule, TabsModule, RouterModule],
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

  cars: any[] = [];

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // toggleFavorite() {
  //   this.isFavorite = !this.isFavorite;
  // }
  navigationToCheckout() {
    this.router.navigate(['/checkout']);
  }
}
