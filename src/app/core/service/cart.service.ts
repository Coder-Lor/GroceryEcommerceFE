import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { 
  CartClient, 
  AddToCartRequest, 
  ResultOfBoolean, 
  ShoppingCartItem,
  ShoppingCartItemDto, 
  UpdateQuantityRequest,
  ProductClient
} from './system-admin.service';
import { AuthService } from './auth.service';

export interface CartItemViewModel {
  cartItemId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly CART_STORAGE_KEY = 'shopping_cart_items';
  private readonly items$ = new BehaviorSubject<CartItemViewModel[]>([]);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  private readonly productClient = inject(ProductClient);
  private readonly isBrowser: boolean;

  constructor(private readonly cartClient: CartClient) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Khôi phục giỏ hàng từ localStorage khi service khởi tạo (chỉ ở browser)
    if (this.isBrowser) {
      this.loadFromLocalStorage();
    }
  }

  get cartItems$(): Observable<CartItemViewModel[]> {
    return this.items$.asObservable();
  }

  get cartCount$(): Observable<number> {
    return this.items$.pipe(map((items) => items.reduce((s, i) => s + i.quantity, 0)));
  }

  get cartSubtotal$(): Observable<number> {
    return this.items$.pipe(map((items) => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)));
  }

  // Lưu giỏ hàng vào localStorage
  private saveToLocalStorage(): void {
    if (!this.isBrowser) return;
    
    try {
      const items = this.items$.value;
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
      console.log('✅ Cart saved to localStorage:', items.length, 'items');
    } catch (error) {
      console.error('❌ Failed to save cart to localStorage:', error);
    }
  }

  // Load giỏ hàng từ localStorage
  private loadFromLocalStorage(): void {
    if (!this.isBrowser) return;
    
    try {
      const stored = localStorage.getItem(this.CART_STORAGE_KEY);
      if (stored) {
        const items = JSON.parse(stored) as CartItemViewModel[];
        this.items$.next(items);
        console.log('✅ Cart loaded from localStorage:', items.length, 'items');
      }
    } catch (error) {
      console.error('❌ Failed to load cart from localStorage:', error);
    }
  }

  // Load current cart summary from API
  loadCartSummary(): void {
    if (!this.isBrowser) {
      console.log('⚠️ Not in browser, skipping cart API call');
      return;
    }

    console.log('🔄 Loading cart from backend...');
    
    // Lấy userId từ currentUser
    this.authService.currentUser.pipe(
      switchMap(user => {
        if (!user?.id) {
          console.log('⚠️ No user logged in, skipping cart load');
          return of(null);
        }
        
        console.log('👤 User ID:', user.id);
        return this.cartClient.getShoppingCart(user.id);
      }),
      catchError(err => {
        console.error('❌ Failed to load cart from backend:', err);
        return of(null);
      })
    ).subscribe({
      next: (res) => {
        if (res && res.isSuccess && res.data?.items) {
          console.log('✅ Cart API response:', res.data.items.length, 'items');
          this.setItemsFromBackend(res.data.items);
          // Lưu vào localStorage sau khi load từ backend
          this.saveToLocalStorage();
        } else if (res) {
          console.log('⚠️ Cart response not successful or no items');
        }
      }
    });
  }

  addItem(params: { userId?: string; productId: string; productVariantId?: string; quantity: number }): Observable<ResultOfBoolean> {
    const req = new AddToCartRequest({
      userId: params.userId,
      productId: params.productId,
      productVariantId: params.productVariantId,
      quantity: params.quantity,
    });

    return this.cartClient.addItemToCart(req).pipe(
      switchMap((res) => {
        if (!res?.isSuccess) {
          return of(res);
        }

        // Tìm sản phẩm trong danh sách hiện có
        const existing = this.items$.value.slice();
        const idx = existing.findIndex((x) => x.productId === params.productId);
        
        if (idx >= 0) {
          // Sản phẩm đã có trong giỏ, chỉ cập nhật số lượng
          existing[idx] = { ...existing[idx], quantity: existing[idx].quantity + params.quantity };
          this.items$.next(existing);
          this.saveToLocalStorage();
          console.log('✅ Updated quantity for existing product:', existing[idx].productName);
          return of(res);
        }

        // Sản phẩm mới, cần lấy thông tin từ ProductClient
        console.log('🔍 Fetching product details for ID:', params.productId);
        
        return this.productClient.getById(params.productId).pipe(
          tap((productRes) => {
            if (productRes?.isSuccess && productRes.data) {
              const product = productRes.data;
              const vm: CartItemViewModel = {
                cartItemId: crypto.randomUUID(), // Tạm thời, nên lấy từ backend response nếu có
                productId: params.productId,
                productName: product.name || 'Unknown Product',
                imageUrl: product.images?.[0]?.imageUrl || '/images/product-image-1.png',
                unitPrice: product.price ?? 0,
                quantity: params.quantity,
              };
              existing.unshift(vm);
              this.items$.next(existing);
              this.saveToLocalStorage();
              console.log('✅ Product added to cart:', vm.productName);
            } else {
              console.warn('⚠️ Could not fetch product details, using fallback');
              // Fallback nếu không lấy được thông tin
              const vm: CartItemViewModel = {
                cartItemId: crypto.randomUUID(),
                productId: params.productId,
                productName: 'Unknown Product',
                imageUrl: '/images/product-image-1.png',
                unitPrice: 0,
                quantity: params.quantity,
              };
              existing.unshift(vm);
              this.items$.next(existing);
              this.saveToLocalStorage();
            }
          }),
          map(() => res),
          catchError((err) => {
            console.error('❌ Error fetching product details:', err);
            // Vẫn thêm sản phẩm với thông tin tối thiểu
            const vm: CartItemViewModel = {
              cartItemId: crypto.randomUUID(),
              productId: params.productId,
              productName: 'Unknown Product',
              imageUrl: '/images/product-image-1.png',
              unitPrice: 0,
              quantity: params.quantity,
            };
            existing.unshift(vm);
            this.items$.next(existing);
            this.saveToLocalStorage();
            return of(res);
          })
        );
      })
    );
  }

  updateQuantity(cartItemId: string, quantity: number): Observable<ResultOfBoolean> {
    const req = new UpdateQuantityRequest({ quantity });
    return this.cartClient.updateCartItemQuantity(cartItemId, req).pipe(
      tap((res) => {
        if (res?.isSuccess) {
          const updated = this.items$.value.map((x) => (x.cartItemId === cartItemId ? { ...x, quantity } : x));
          this.items$.next(updated);
          // Lưu vào localStorage sau khi cập nhật số lượng
          this.saveToLocalStorage();
        }
      })
    );
  }

  removeItem(cartItemId: string): Observable<ResultOfBoolean> {
    return this.cartClient.removeItemFromCart(cartItemId).pipe(
      tap((res) => {
        if (res?.isSuccess) {
          const filtered = this.items$.value.filter((x) => x.cartItemId !== cartItemId);
          this.items$.next(filtered);
          // Lưu vào localStorage sau khi xóa sản phẩm
          this.saveToLocalStorage();
        }
      })
    );
  }

  // Utilities to hydrate from backend ShoppingCartItemDto when needed
  setItemsFromBackend(items: ShoppingCartItemDto[]): void {
    const vm = (items || []).map((it) => ({
      cartItemId: it.cartItemId || '',
      productId: it.productId || '',
      productName: it.productName || '',
      imageUrl: it.productImageUrl || '/images/product-image-1.png',
      unitPrice: it.unitPrice ?? 0,
      quantity: it.quantity ?? 0,
    }));
    this.items$.next(vm);
  }
}


