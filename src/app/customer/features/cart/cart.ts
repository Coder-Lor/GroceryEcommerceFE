import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CartService } from '../../../core/service/cart.service';
import { inject } from '@angular/core';


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
