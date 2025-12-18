import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import {
  ShopClient,
  ProductClient,
  ShopDto,
  ProductBaseResponse,
  SortDirection,
} from '@core/service/system-admin.service';
import { ProductCard } from '../../shared/components/product-card/product-card';

@Component({
  selector: 'app-shop-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ToastModule, ProductCard],
  providers: [MessageService],
  templateUrl: './shop-detail.html',
  styleUrl: './shop-detail.scss',
})
export class ShopDetailPage implements OnInit {
  shop: ShopDto | null = null;
  products: ProductBaseResponse[] = [];

  isLoadingShop = false;
  isLoadingProducts = false;

  page = 1;
  pageSize = 8;
  totalCount = 0;

  Math = Math;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly shopClient: ShopClient,
    private readonly productClient: ProductClient,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    const shopId = this.route.snapshot.paramMap.get('shopId');
    if (shopId) {
      this.loadShop(shopId);
      this.loadProducts(shopId);
    }
  }

  loadShop(shopId: string): void {
    this.isLoadingShop = true;
    this.shopClient.getById(shopId).subscribe({
      next: (response) => {
        if (response?.isSuccess && response.data) {
          this.shop = response.data;
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Không tải được thông tin shop',
            detail: response?.errorMessage || 'Vui lòng thử lại',
          });
        }
        this.isLoadingShop = false;
      },
      error: (err) => {
        console.error('Lỗi tải shop', err);
        this.isLoadingShop = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin shop',
        });
      },
    });
  }

  loadProducts(shopId: string): void {
    this.isLoadingProducts = true;
    this.productClient
      .getProductsByShop(
        shopId,
        this.page,
        this.pageSize,
        undefined,
        undefined,
        SortDirection.Ascending,
        undefined,
        undefined,
        undefined,
        false,
        false,
        true
      )
      .subscribe({
        next: (response) => {
          if (response?.isSuccess && response.data) {
            this.products = response.data.items || [];
            this.totalCount = response.data.totalCount ?? 0;
          }
          this.isLoadingProducts = false;
        },
        error: (err) => {
          console.error('Lỗi tải sản phẩm shop', err);
          this.isLoadingProducts = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải sản phẩm của shop',
          });
        },
      });
  }

  changePage(delta: number): void {
    const next = this.page + delta;
    const totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    if (next < 1 || next > totalPages) return;
    this.page = next;
    if (this.shop?.shopId) {
      this.loadProducts(this.shop.shopId);
    }
  }
}

