import { CommonModule } from '@angular/common';
import { Component, inject, Input, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  AddToCartRequest,
  CartClient,
  ProductBaseResponse,
} from '@core/service/system-admin.service';
import { TruncatePipe } from '@shared/pipes/truncate-pipe.pipe';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { Tag } from 'primeng/tag';
import { Rating } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { CartService } from '@core/service/cart.service';

type Product = ProductBaseResponse;

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Tag, TruncatePipe, Rating],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ProductCard {
  router: Router = inject(Router);

  @Input() product: Product;
  @Input() first: any;
  @Input() layout: string = '';
  @Input() getSeverity: any;

  ratingValue: number = 5;

  navigationToDetailPage() {
    // Navigate sử dụng slug của product
    if (this.product?.slug) {
      this.router.navigate(['/product-detail', this.product.slug]);
    } else {
      console.warn('⚠️ Product không có slug, không thể navigate');
    }
  }

  getDiscountPercent(price: number, discountPrice: number): number {
    return (price - discountPrice) / price;
  }
}
