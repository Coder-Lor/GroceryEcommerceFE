import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Router } from '@angular/router';

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

  Cart: any[] = [
    { id: 1, name: 'product 1', price: 25.5, quantity: 1, image: '/images/product-image-1.png' },
    { id: 2, name: 'product 2', price: 15.5, quantity: 1, image: '/images/product-image-1.png' },
    { id: 3, name: 'product 3', price: 45.5, quantity: 1, image: '/images/product-image-1.png' },
    { id: 4, name: 'product 4', price: 35.5, quantity: 1, image: '/images/product-image-1.png' },
    { id: 5, name: 'product 4', price: 35.5, quantity: 1, image: '/images/product-image-1.png' },
  ];

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
}
