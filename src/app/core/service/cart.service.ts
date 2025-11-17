import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, tap, switchMap, catchError, take } from 'rxjs/operators';
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

        // Sau khi thêm thành công, reload cart từ backend để có thông tin đầy đủ và chính xác
        console.log('✅ Item added to cart, reloading cart from backend...');
        
        // Reload cart từ backend để có cartItemId đúng và thông tin đầy đủ
        return this.authService.currentUser.pipe(
          take(1),
          switchMap(user => {
            if (!user?.id) {
              console.warn('⚠️ No user logged in, cannot reload cart');
              return of(res);
            }
            
            return this.cartClient.getShoppingCart(user.id).pipe(
              tap((cartRes) => {
                if (cartRes?.isSuccess && cartRes.data?.items) {
                  console.log('✅ Cart reloaded from backend:', cartRes.data.items.length, 'items');
                  this.setItemsFromBackend(cartRes.data.items);
                  this.saveToLocalStorage();
                } else {
                  console.warn('⚠️ Failed to reload cart from backend');
                }
              }),
              map(() => res),
              catchError((err) => {
                console.error('❌ Error reloading cart:', err);
                // Vẫn return success response ngay cả khi reload fail
                return of(res);
              })
            );
          }),
          catchError(() => of(res)) // Fallback nếu không có user
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

  /**
   * Xóa toàn bộ giỏ hàng sau khi đặt hàng thành công
   */
  clearCart(): Observable<ResultOfBoolean> {
    return this.authService.currentUser.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          console.warn('⚠️ No user logged in, clearing local cart only');
          // Vẫn xóa localStorage nếu không có user
          this.items$.next([]);
          this.saveToLocalStorage();
          return of({ isSuccess: true } as ResultOfBoolean);
        }
        
        console.log('🧹 Clearing cart for user:', user.id);
        return this.cartClient.clearShoppingCart(user.id).pipe(
          tap((res) => {
            if (res?.isSuccess) {
              // Xóa giỏ hàng khỏi state và localStorage
              this.items$.next([]);
              this.saveToLocalStorage();
              console.log('✅ Cart cleared successfully');
            }
          }),
          catchError(err => {
            console.error('❌ Failed to clear cart:', err);
            // Vẫn xóa localStorage ngay cả khi API call fail
            this.items$.next([]);
            this.saveToLocalStorage();
            return of(ResultOfBoolean.fromJS({ isSuccess: false, errorMessage: 'Failed to clear cart' }));
          })
        );
      })
    );
  }
}


