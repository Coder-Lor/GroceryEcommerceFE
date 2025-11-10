import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ViewEncapsulation, PLATFORM_ID } from '@angular/core';
import { Route, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataViewModule } from 'primeng/dataview';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CarouselModule } from 'primeng/carousel';
import { ProductCard } from '../../shared/components/product-card/product-card';
import { ProductBaseResponse, CategoryClient, CategoryDto } from '@core/service/system-admin.service';
import { InventoryService } from '@core/service/inventory.service';
import { ProductService } from '@core/service/product.service';
import { Subject, takeUntil } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CountdownEvent, CountdownModule } from 'ngx-countdown';
import { TransferState, makeStateKey } from '@angular/core';
import { CategoryService } from '@core/service/category.service';

type Product = ProductBaseResponse;
type UrlObject = {
  url: string;
}
// State key for TransferState
const CATEGORIES_KEY = makeStateKey<CategoryDto[]>('categories');

type ResponsiveOp = { breakpoint: string; numVisible: number; numScroll: number };

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ProductCard,
    DataViewModule,
    SelectButtonModule,
    CountdownModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  encapsulation: ViewEncapsulation.None,
  host: { ngSkipHydration: 'true' },
})

export class Home implements OnInit, OnDestroy {
  private route: Router = inject(Router);
  private inventoryService: InventoryService = inject(InventoryService);
  private productService: ProductService = inject(ProductService);
  private categoryService = inject(CategoryClient);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);
  private destroy$ = new Subject<void>();

  products: Product[] = [];
  flashSaleProducts: Product[] = [];

  layout: 'list' | 'grid' = 'grid';
  options = ['list', 'grid'];

  //biến phân trang
  page: number = 1;
  pageSize: number = 4;
  totalCount = 0;
  isLoading: boolean = false;

  // setup countdown flash sale
  countdownConfig = {
    leftTime: 3600,
    format: 'HH:mm:ss',
    demand: false,
  };

  categories: CategoryDto[] = [];

  brands = [
    { name: 'Nestlé', logo: '/images/brands/nestle.png' },
    { name: 'Starbucks', logo: '/images/brands/starbucks.png' },
    { name: 'Highlands Coffee', logo: '/images/brands/highlands.png' },
    { name: 'Vinacafé', logo: '/images/brands/vinacafe.png' },
    { name: 'Trung Nguyên', logo: '/images/brands/trungnguyen.png' },
    { name: 'G7', logo: '/images/brands/g7.png' },
    { name: 'Tchibo', logo: '/images/brands/tchibo.png' },
  ];

  hours = '01';
  minutes = '13';
  seconds = '38';

  heroSlides: any[] = [
    { title: 'banner 1', image1: '/images/banner-1.jpg', image2: '/images/banner-2.jpg'},
    { title: 'banner 2', image1: '/images/banner-3.jpg', image2: '/images/banner-4.jpg'},
    { title: 'banner 3', image1: '/images/banner-5.jpg', image2: '/images/banner-6.jpg'},
  ];

  policies = [
    {
      icon: 'pi pi-truck',
      title: 'Miễn phí vận chuyển',
      desc: 'Áp dụng cho đơn hàng từ 200.000đ',
    },
    {
      icon: 'pi pi-refresh',
      title: 'Đổi trả dễ dàng',
      desc: 'Trong vòng 7 ngày nếu có lỗi từ NSX',
    },
    {
      icon: 'pi pi-shield',
      title: 'Hàng chính hãng 100%',
      desc: 'Cam kết chất lượng và nguồn gốc rõ ràng',
    },
    {
      icon: 'pi pi-headphones',
      title: 'Hỗ trợ 24/7',
      desc: 'Đội ngũ CSKH sẵn sàng phục vụ bạn',
    },
    {
      icon: 'pi pi-credit-card',
      title: 'Thanh toán an toàn',
      desc: 'Mọi giao dịch được mã hóa và bảo mật tuyệt đối',
    },
  ];

  private carouselImages: UrlObject[];
  ngOnInit(): void {
    this.loadCategories();
    // Initialize carousel images
    this.carouselImages = [
      { url: '/images/banner-s25-ultra.png' },
      { url: '/images/banner-gaming.png' },
      { url: '/images/banner-watch-series-11.png' },
      { url: '/images/banner-nhacua-doisong.png' },
      { url: '/images/banner-chamsoc.png' },
      { url: '/images/banner-smartphone.png' },
      { url: '/images/banner-maylocnuoc.png' },
      { url: '/images/banner-honor-x6c.png' },
    ];

    var responsiveOptions: ResponsiveOp[] = [
      {
        breakpoint: '1400px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '1199px',
        numVisible: 2,
        numScroll: 2,
      },
      {
        breakpoint: '767px',
        numVisible: 1,
        numScroll: 1,
      },
      {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1,
      },
    ];

    this.loadCategories();

    this.loadProducts();

    this.loadFlashSaleProducts();
  }

  loadCategories(): void {
    // Kiểm tra xem có dữ liệu trong TransferState không
    const cachedCategories = this.transferState.get(CATEGORIES_KEY, null);

    if (cachedCategories) {
      // Sử dụng dữ liệu từ cache
      this.categories = cachedCategories;
      // Xóa dữ liệu khỏi TransferState sau khi sử dụng (chỉ trên browser)
      if (isPlatformBrowser(this.platformId)) {
        this.transferState.remove(CATEGORIES_KEY);
      }
    } else {
      // Gọi API để lấy danh sách danh mục
      this.categoryService
        .getCategoryTree()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response?.isSuccess && response?.data) {
              this.categories = response.data;
              
              // Lưu vào TransferState (chỉ trên server)
              if (isPlatformServer(this.platformId)) {
                this.transferState.set(CATEGORIES_KEY, this.categories);
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi tải danh mục', err);
            this.categories = [];
          },
        });
    }
  }

  getCategoryImage(category: CategoryDto): string {
    return category.imageUrl || '/images/no-image.png';
  }

  loadProducts(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.productService
      .getProductByPaging(this.page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const newItems = data?.items || [];
          this.totalCount = data?.totalCount || 0;

          // ✅ Ghép thêm sản phẩm mới vào danh sách cũ
          this.products = [...this.products, ...newItems];
        },
        error: (err) => console.error('Lỗi khi tải sản phẩm', err),
        complete: () => (this.isLoading = false),
      });
  }

  loadMore(): void {
    if (this.products.length >= this.totalCount) {
      console.log('Đã tải hết sản phẩm!');
      return;
    }
    this.page++;
    this.loadProducts();
  }

  loadFlashSaleProducts(): void {
    // Lấy tất cả sản phẩm có giảm giá > 50%
    this.productService
      .getProductByPaging(1, 100) // Lấy nhiều sản phẩm để filter
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const allProducts = data?.items || [];
          
          // Lọc các sản phẩm có giảm giá > 50%
          this.flashSaleProducts = allProducts.filter((product) => {
            if (product.price && product.discountPrice) {
              const discountPercent = ((product.price - product.discountPrice) / product.price) * 100;
              return discountPercent > 50;
            }
            return false;
          });
        },
        error: (err) => console.error('Lỗi khi tải flash sale products', err),
      });
  }

  getDiscountPercent(product: Product): number {
    if (product.price && product.discountPrice) {
      return Math.round(((product.price - product.discountPrice) / product.price) * 100);
    }
    return 0;
  }

  getProductProgress(product: Product): number {
    // Tính % đã bán dựa trên stockQuantity (giả sử stock ban đầu là 100)
    if (product.stockQuantity !== undefined) {
      const initialStock = 100;
      const sold = initialStock - product.stockQuantity;
      return Math.min(Math.max((sold / initialStock) * 100, 0), 100);
    }
    return 0;
  }

  navigationToDetailPage() {
    this.route.navigate(['/product-detail']);
  }

  navigationToCategory() {
    this.route.navigate(['/category']);
  }

  navigationToDiscoverPage() {
    this.route.navigate(['/discover-page'], {
      queryParams: {
        page: 1,
        pageSize: 12,
      },
    });
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

  navigationToProductList() {
    this.route.navigate(['/product-list']);
  }

  onCountdownEvent(event: CountdownEvent) {
    if (event.action === 'done') {
      console.log('Flash sale kết thúc!');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
