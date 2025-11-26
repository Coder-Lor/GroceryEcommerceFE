import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  makeStateKey,
  TransferState,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, isPlatformServer } from '@angular/common';
import { UtilityPanel } from './utility-panel/utility-panel';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { log } from 'console';
import { LogoutCommand } from '@core/service/system-admin.service';
import { CartService } from '../../../../core/service/cart.service';
import { Ripple } from 'primeng/ripple';
import { tap } from 'rxjs';
import { MegaMenuModule } from 'primeng/megamenu';
import { MegaMenuItem } from 'primeng/api';
import { CategoryService } from '../../../../core/service/category.service';
import { CategoryDto } from '../../../../core/service/system-admin.service';

// State key for TransferState
const HEADER_CATEGORIES_KEY = makeStateKey<CategoryDto[]>('header-categories');

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UtilityPanel, RouterModule, MegaMenuModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  host: { ngSkipHydration: 'true' },  // ← Skip SSR cho component này
})
export class Header implements OnInit, OnChanges {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private cartService: CartService = inject(CartService);
  private categoryService: CategoryService = inject(CategoryService);
  private transferState = inject(TransferState);

  @ViewChild('userMenu', { static: false }) userMenu!: ElementRef;

  showTopbar: boolean = true;
  isShowSidebar: boolean = false;
  isShowSubMenu: boolean = false;
  isShowSearchBox: boolean = false;
  isShowPanel: boolean = false;
  isOpen: boolean = false;
  isShowMiniCart: boolean = false;

  username: string = '';
  isLoggedIn$ = this.authService.isAuthenticated$;
  user$ = this.authService.currentUser;
  private refreshtoken: any;

  cartCount$ = this.cartService.cartCount$;
  miniItems$ = this.cartService.cartItems$;

  megaMenuItems: MegaMenuItem[] = [
    {
      label: 'Sản phẩm nổi bật',
      items: [
        [
          {
            label: 'Laptop',
            items: [
              { label: 'Lenovo' },
              { label: 'Acer' },
              { label: 'Asus' },
              { label: 'Dell' },
              { label: 'HP' },
              { label: 'MSI' },
              { label: 'Macbook' },
            ],
          },
        ],
        [
          {
            label: 'Làm đẹp và chăm sóc cá nhân',
            items: [
              { label: 'Chăm sóc da' },
              { label: 'Trang điểm' },
              { label: 'Chăm sóc tóc' },
              { label: 'Nước hoa' },
              { label: 'Dụng cụ làm đẹp' },
              { label: 'Phụ kiện làm đẹp' },
            ],
          },
        ],
        [
          {
            label: 'Phụ kiện và thiết bị điện tử',
            items: [
              { label: 'Tai nghe' },
              { label: 'Loa Bluetooth' },
              { label: 'Sạc dự phòng' },
              { label: 'Ốp lưng điện thoại' },
              { label: 'Thiết bị thông minh' },
              { label: 'Phụ kiện máy tính' },
            ],
          },
        ],
      ],
    },
  ];

  categoryMenuItems: MegaMenuItem[] = [
    {
      label: 'Danh mục sản phẩm',
      items: [[]]
    }
  ];

  constructor() {
    // if (isPlatformBrowser(this.platformId)) {
    //   const stored = localStorage.getItem('currentUser');
    //   if (stored) {
    //     const parsed = JSON.parse(stored);
    //     this.refreshtoken = new LogoutCommand({
    //       refreshToken: parsed.refreshToken ?? undefined,
    //     });
    //   }
    // }
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    // Nếu đang top 0 → hiển thị topbar
    if (scrollY === 0) {
      this.showTopbar = true;
    } else {
      // Cuộn xuống → ẩn topbar
      this.showTopbar = false;
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('🛒 Header ngOnInit - Loading cart...');
      this.cartService.loadCartSummary();
    } else {
      console.log('⚠️ Header ngOnInit - Server side, skipping cart load');
    }
    
    // Load categories (có TransferState xử lý cả server và browser)
    this.loadCategories();

    // this.authService.isAuthenticated$.subscribe((res) => {
    //   this.isLoggedIn = res;
    //   console.log(res);
    // });
    // this.authService.currentUser.subscribe((res) => {
    //   this.userName = res?.username ?? null;
    // });
  }
  ngOnChanges() {
    console.log(this.isLoggedIn$);
  }

  redirectToProfile(): void {
    this.isOpen = !this.isOpen;
    this.router.navigate(['/profile']);
  }

  onLogout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Lỗi khi logout:', err);
        // Dù lỗi cũng clear localStorage để chắc chắn đăng xuất
        localStorage.clear();
        this.router.navigate(['/login']);
      },
    });
    // this.authService.isLoggedIn$.subscribe((res) => {
    //   this.isLoggedIn = res;
    // });
  }

  toggleSidebar() {
    this.isShowSidebar = !this.isShowSidebar;
  }

  togggleSubmenu() {
    this.isShowSubMenu = !this.isShowSubMenu;
  }
  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    // Check if userMenu exists and click target is valid
    if (this.userMenu?.nativeElement && event.target instanceof Node) {
      const clickedInside = this.userMenu.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.isOpen = false;
      }
    }
  }

  toggleSearchBox() {
    this.isShowSearchBox = !this.isShowSearchBox;
  }

  toggleUtilPanel() {
    this.isShowPanel = !this.isShowPanel;
  }

  // Hover mini cart
  onCartMouseEnter() {
    this.isShowMiniCart = true;
  }
  onCartMouseLeave() {
    this.isShowMiniCart = false;
  }

  goToCart(event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/cart']);
  }

  backToHomePage() {
    this.router.navigate(['']);
  }

  onSearch(rawQuery: string) {
    const query = (rawQuery ?? '').trim();
    if (!query) {
      this.router.navigate(['/category'], { queryParams: {} });
      return;
    }
    this.router.navigate(['/category'], { queryParams: { search: query } });
  }

  private loadCategories(): void {
    // Kiểm tra xem có dữ liệu trong TransferState không
    const cachedCategories = this.transferState.get(HEADER_CATEGORIES_KEY, null);
    
    if (cachedCategories) {
      console.log('📦 Header - Using cached categories from TransferState');
      // Sử dụng dữ liệu từ cache
      this.buildCategoryMenu(cachedCategories);
      
      // Xóa dữ liệu khỏi TransferState sau khi sử dụng (chỉ trên browser)
      if (isPlatformBrowser(this.platformId)) {
        this.transferState.remove(HEADER_CATEGORIES_KEY);
      }
      return;
    }

    // CHỈ gọi API trên browser để tránh lỗi SSR
    if (!isPlatformBrowser(this.platformId)) {
      console.log('⚠️ Header - Server side, skipping API call');
      return;
    }

    // Gọi API để lấy danh sách danh mục (CHỈ TRÊN BROWSER)
    console.log('🌐 Header - Fetching categories from API (browser)');
    this.categoryService.getCategoryTree().subscribe({
      next: (categories) => {
        console.log('✅ Header - Categories loaded successfully:', categories.length);
        if (categories.length > 0) {
          this.buildCategoryMenu(categories);
        }
      },
      error: (err) => {
        console.error('❌ Lỗi khi load danh mục trong header:', err);
      },
    });
  }

  private buildCategoryMenu(categories: CategoryDto[]): void {
    // Chỉ lấy danh sách tên danh mục cha
    const parentCategories = categories.filter(cat => !cat.parentCategoryId);
    
    this.categoryMenuItems = [
      {
        label: 'Danh mục sản phẩm',
        items: [
          parentCategories.map(cat => ({
            label: cat.name,
            command: () => {
              this.router.navigate(['/category'], { 
                queryParams: { categoryId: cat.categoryId } 
              });
            }
          }))
        ]
      }
    ];
  }
}
