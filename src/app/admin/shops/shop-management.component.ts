import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import {
  ShopClient,
  ShopDto,
  SortDirection,
  UpdateShopStatusCommand,
  ResultOfPagedResultOfShopDto,
} from '@core/service/system-admin.service';
import { ShopProductsModalComponent } from './shop-products-modal/shop-products-modal.component';

@Component({
  selector: 'app-shop-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ToastModule,
    InputTextModule,
    ButtonModule,
    TagModule,
    DialogModule,
    ProgressSpinnerModule,
    ShopProductsModalComponent,
  ],
  providers: [MessageService],
  templateUrl: './shop-management.component.html',
  styleUrl: './shop-management.component.scss',
})
export class ShopManagementComponent implements OnInit {
  shops: ShopDto[] = [];
  isLoading = false;
  searchTerm = '';

  currentPage = 1;
  pageSize = 10;
  totalCount = 0;

  SortDirection = SortDirection;
  Math = Math;

  // Chi tiết shop
  selectedShop: ShopDto | null = null;
  showDetail = false;

  // Xem sản phẩm shop
  showProductsModal = false;
  selectedShopForProducts: ShopDto | null = null;

  constructor(
    private readonly shopClient: ShopClient,
    private readonly messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadShops();
  }

  loadShops(): void {
    this.isLoading = true;

    this.shopClient
      .getShopsPaging(
        this.currentPage,
        this.pageSize,
        this.searchTerm || undefined,
        'createdAt',
        SortDirection.Descending,
        undefined,
        undefined,
        undefined,
        false,
        !!this.searchTerm,
        true
      )
      .subscribe({
        next: (response: ResultOfPagedResultOfShopDto) => {
          if (response?.isSuccess && response.data?.items) {
            this.shops = response.data.items;
            this.totalCount = response.data.totalCount ?? 0;
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Không tải được danh sách shop',
              detail: response?.errorMessage || 'Vui lòng thử lại',
            });
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi tải shop', err);
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải danh sách shop',
          });
        },
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadShops();
  }

  changePage(delta: number): void {
    const next = this.currentPage + delta;
    const totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
    if (next < 1 || next > totalPages) return;
    this.currentPage = next;
    this.loadShops();
  }

  viewShopDetail(shop: ShopDto): void {
    this.selectedShop = shop;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedShop = null;
  }

  viewShopProducts(shop: ShopDto): void {
    this.selectedShopForProducts = shop;
    this.showProductsModal = true;
  }

  toggleStatus(shop: ShopDto): void {
    if (!shop.shopId) return;
    const newStatus = shop.status === 1 ? 0 : 1;
    const command = new UpdateShopStatusCommand({
      shopId: shop.shopId,
      status: newStatus,
    });

    this.shopClient.updateStatus(shop.shopId, command).subscribe({
      next: (result) => {
        if (result?.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Cập nhật thành công',
            detail: `Shop đã ${newStatus === 1 ? 'kích hoạt' : 'tắt'} trạng thái`,
          });
          shop.status = newStatus;
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Không cập nhật được',
            detail: result?.errorMessage || 'Vui lòng thử lại',
          });
        }
      },
      error: (err) => {
        console.error('Lỗi cập nhật trạng thái shop', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật trạng thái shop',
        });
      },
    });
  }
}

