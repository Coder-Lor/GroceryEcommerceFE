import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { CartClient, AddToCartRequest, ResultOfBoolean, ShoppingCartItem, UpdateQuantityRequest } from './system-admin.service';

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
  private readonly items$ = new BehaviorSubject<CartItemViewModel[]>([]);

  constructor(private readonly cartClient: CartClient) {}

  get cartItems$(): Observable<CartItemViewModel[]> {
    return this.items$.asObservable();
  }

  get cartCount$(): Observable<number> {
    return this.items$.pipe(map((items) => items.reduce((s, i) => s + i.quantity, 0)));
  }

  get cartSubtotal$(): Observable<number> {
    return this.items$.pipe(map((items) => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)));
  }

  // Load current cart summary from API if available
  loadCartSummary(): void {
    // If backend has a summary endpoint, wire it here. For now keep items as-is until integrated.
  }

  addItem(params: { userId?: string; productId: string; productVariantId?: string; quantity: number }): Observable<ResultOfBoolean> {
    const req = new AddToCartRequest({
      userId: params.userId,
      productId: params.productId,
      productVariantId: params.productVariantId,
      quantity: params.quantity,
    });

    return this.cartClient.addItemToCart(req).pipe(
      tap((res) => {
        if (res?.isSuccess) {
          const existing = this.items$.value.slice();
          const idx = existing.findIndex((x) => x.productId === params.productId && x.productName);
          if (idx >= 0) {
            existing[idx] = { ...existing[idx], quantity: existing[idx].quantity + params.quantity };
          } else {
            // Minimal VM, real data should be refreshed after API returns a full summary endpoint
            const vm: CartItemViewModel = {
              cartItemId: crypto.randomUUID(),
              productId: params.productId,
              productName: '',
              imageUrl: '/images/product-image-1.png',
              unitPrice: 0,
              quantity: params.quantity,
            };
            existing.unshift(vm);
          }
          this.items$.next(existing);
        }
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
        }
      })
    );
  }

  // Utilities to hydrate from backend ShoppingCartItem when needed
  setItemsFromBackend(items: ShoppingCartItem[]): void {
    const vm = (items || []).map((it) => ({
      cartItemId: it.cartItemId || '',
      productId: it.productId || '',
      productName: it.product?.name || '',
      imageUrl: it.product?.productImages?.[0]?.imageUrl || '/images/product-image-1.png',
      unitPrice: it.unitPrice ?? 0,
      quantity: it.quantity ?? 0,
    }));
    this.items$.next(vm);
  }
}


