import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  ProductBaseResponse,
  ProductClient,
  ShopClient,
  SortDirection,
} from '@core/service/system-admin.service';
import { AuthService } from '@core/service/auth.service';
import { FormsModule } from '@angular/forms';
import { InventoryPageComponent } from '../../../admin/inventory/inventory-page.component';

@Component({
  selector: 'app-my-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule, FormsModule, InventoryPageComponent],
  providers: [MessageService],
  templateUrl: './my-shop.html',
  styleUrl: './my-shop.scss',
})
export class MyShopPage implements OnInit {
  shopId?: string;
  shopName?: string;
  shopSlug?: string;

  products: ProductBaseResponse[] = [];
  isLoadingShop = false;
  isLoadingProducts = false;

  page = 1;
  pageSize = 10;
  totalCount = 0;

  Math = Math;

  constructor(
    private readonly authService: AuthService,
    private readonly shopClient: ShopClient,
    private readonly productClient: ProductClient,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.fetchMyShop();
  }

  private fetchMyShop(): void {
    this.isLoadingShop = true;
    this.authService.currentUser.subscribe((user) => {
      if (!user?.id) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Bạn chưa đăng nhập',
          detail: 'Vui lòng đăng nhập để xem shop của bạn',
        });
        this.isLoadingShop = false;
        return;
      }

      this.shopClient
        .getByOwner(
          user.id,
          1,
          1,
          undefined,
          'createdAt',
          SortDirection.Descending,
          undefined,
          undefined,
          undefined,
          false,
          false,
          true
        )
        .subscribe({
          next: (res) => {
            const shop = res?.data?.items?.[0];
            if (!shop?.shopId) {
              this.messageService.add({
                severity: 'info',
                summary: 'Chưa có shop',
                detail: 'Hãy đăng ký shop để bắt đầu bán hàng',
              });
            } else {
              this.shopId = shop.shopId;
              this.shopName = shop.name;
              this.shopSlug = shop.slug;
              this.loadProducts();
            }
            this.isLoadingShop = false;
          },
          error: (err) => {
            console.error('Lỗi lấy shop của tôi', err);
            this.isLoadingShop = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tải thông tin shop',
            });
          },
        });
    });
  }

  loadProducts(): void {
    if (!this.shopId) return;
    this.isLoadingProducts = true;
    this.productClient
      .getProductsByShop(
        this.shopId,
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
        next: (res) => {
          this.products = res?.data?.items ?? [];
          this.totalCount = res?.data?.totalCount ?? 0;
          this.isLoadingProducts = false;
        },
        error: (err) => {
          console.error('Lỗi tải sản phẩm shop', err);
          this.isLoadingProducts = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải sản phẩm',
          });
        },
      });
  }

  changePage(delta: number): void {
    const totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    const next = this.page + delta;
    if (next < 1 || next > totalPages) return;
    this.page = next;
    this.loadProducts();
  }

  goToAddProduct(): void {
    this.router.navigate(['/my-shop/add-product']);
  }

  viewProduct(product: ProductBaseResponse): void {
    if (product.slug) {
      this.router.navigate(['/product-detail', product.slug]);
    }
  }

  deleteProduct(product: ProductBaseResponse): void {
    if (!product.productId) return;
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    this.productClient.delete(product.productId).subscribe({
      next: (res) => {
        if (res?.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Đã xóa',
            detail: 'Sản phẩm đã được xóa',
          });
          this.loadProducts();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Không xóa được',
            detail: res?.errorMessage || 'Vui lòng thử lại',
          });
        }
      },
      error: (err) => {
        console.error('Lỗi xóa sản phẩm', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa sản phẩm',
        });
      },
    });
  }

  goRegister(): void {
    this.router.navigate(['/shop/register']);
  }
}

