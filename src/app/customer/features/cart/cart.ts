import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/service/cart.service';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';


@Component({
  selector: 'app-cart',
  standalone: true,
  imports:
    [
      CommonModule,
      InputNumberModule,
      FormsModule,
      InputTextModule,
      RouterModule
    ],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart implements OnInit {
  private cartService: CartService = inject(CartService);

  Cart$ = this.cartService.cartItems$;
  totalPrice$ = this.cartService.cartSubtotal$;
  itemCount$ = this.cartService.cartCount$;
  
  // Phí vận chuyển: Miễn phí nếu >= 200,000đ, ngược lại là 30,000đ
  shippingFee$: Observable<number> = this.totalPrice$.pipe(
    map(subtotal => subtotal >= 200000 ? 0 : 30000)
  );
  
  // Tổng cuối cùng = Subtotal + Shipping
  finalTotal$: Observable<number> = this.totalPrice$.pipe(
    map(subtotal => {
      const shipping = subtotal >= 200000 ? 0 : 30000;
      return subtotal + shipping;
    })
  );

  // Số tiền còn thiếu để được miễn phí vận chuyển
  amountToFreeShipping$: Observable<number> = this.totalPrice$.pipe(
    map(subtotal => {
      const threshold = 200000;
      return subtotal < threshold ? threshold - subtotal : 0;
    })
  );

  ngOnInit(): void {
    this.cartService.loadCartSummary();
  }

  onUpdateQuantity(id: string, qty: number) {
    this.cartService.updateQuantity(id, qty).subscribe();
  }

  onRemove(id: string) {
    this.cartService.removeItem(id).subscribe();
  }
}
