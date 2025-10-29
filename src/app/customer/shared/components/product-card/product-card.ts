import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProductBaseResponse } from '@core/service/system-admin.service';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { Tag } from 'primeng/tag';

type Product = ProductBaseResponse;

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, Ripple, Tag],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  router: Router = inject(Router);

  @Input() product: Product;
  @Input() first: any;
  @Input() layout: string = '';
  @Input() getSeverity: any;

  constructor(private messageService: MessageService) {}

  navigationToDetailPage() {
    this.router.navigate(['/product-detail']);
  }

  getDiscountPercent(price: number, discountPrice: number): number {
    return (price - discountPrice) / price;
  }

  ShowSuccess() {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Added product to cart!',
      life: 1000,
    });
  }
}
