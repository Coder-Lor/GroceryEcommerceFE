import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Router } from '@angular/router';
import { CartService } from '@services/cart.service';

@Component({
  selector: 'app-utility-panel',
  standalone: true,
  imports: [CommonModule, InputTextModule, FormsModule, InputNumberModule],
  templateUrl: './utility-panel.html',
  styleUrl: './utility-panel.scss',
})
export class UtilityPanel {
  @Input() showCart: boolean = false;
  @Input() showSearch: boolean = false;

  @Output() closeCartPanel = new EventEmitter<void>();
  @Output() closeSearchPanel = new EventEmitter<void>();

  router: Router = inject(Router);
  private cartService: CartService = inject(CartService);

  Cart$ = this.cartService.cartItems$;

  onClose_1() {
    this.closeCartPanel.emit();
  }

  onClose_2() {
    this.closeSearchPanel.emit();
  }

  navigationToCart() {
    this.router.navigate(['/cart']);
    this.closeCartPanel.emit();
  }

  onUpdateQuantity(id: string, qty: number) {
    this.cartService.updateQuantity(id, qty).subscribe();
  }

  onRemove(id: string) {
    this.cartService.removeItem(id).subscribe();
  }
}
