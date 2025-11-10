import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AddToCartRequest, ProductBaseResponse } from '@core/service/system-admin.service';
import { TruncatePipe } from '@shared/pipes/truncate-pipe.pipe';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Ripple } from 'primeng/ripple';
import { Tag } from 'primeng/tag';
import { CartService } from '@services/cart.service';
import { CartClient } from '@core/service/system-admin.service';
import { tap } from 'rxjs';

type Product = ProductBaseResponse;

@Component({
  selector: 'product-card',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, Ripple, Tag, TruncatePipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  router: Router = inject(Router);
  private cartService: CartService = inject(CartService);
  private cartClient: CartClient = inject(CartClient);

  @Input() product: Product;
  @Input() first: any;
  @Input() layout: string = '';
  @Input() getSeverity: any; 

  constructor(private messageService: MessageService) {}

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

  addToCart() {
    if (!this.product?.productId) return;
    console.log(this.product.productId);
    const request = new AddToCartRequest();
    request.productId = this.product.productId;
    request.quantity = 1;
    this.cartClient.addItemToCart(request).pipe(
      tap(x => console.log("Add to card success"))
    ).subscribe({
      next: (res) => {
        if (res.isSuccess){
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Thêm vào giỏ hàng thành công',
            life: 2000,
            closable: true
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Thành công',
          detail: 'Thêm vào giỏ hàng thất bại',
          life: 2000,
          closable: true
        })
      },
    })
  }
}

