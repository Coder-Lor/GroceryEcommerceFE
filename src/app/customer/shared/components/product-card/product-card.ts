import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ProductBaseResponse } from '@core/service/system-admin.service';
import { TruncatePipe } from '@shared/pipes/truncate-pipe.pipe';
import { Tag } from 'primeng/tag';

type Product = ProductBaseResponse;

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, Tag, TruncatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  router: Router = inject(Router);

  @Input() product: Product;
  @Input() first: any;
  @Input() layout: string = '';
  @Input() getSeverity: any;

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

