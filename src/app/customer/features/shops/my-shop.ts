import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {
  ShopClient,
  SortDirection,
} from '@core/service/system-admin.service';
import { AuthService } from '@core/service/auth.service';
import { ProxyImagePipe } from '@shared/pipes/proxy-image.pipe';

@Component({
  selector: 'app-my-shop',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, ToastModule, ProxyImagePipe],
  providers: [MessageService],
  templateUrl: './my-shop.html',
  styleUrl: './my-shop.scss',
})
export class MyShopPage implements OnInit {
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  shopLogoUrl?: string;
  shopDescription?: string;
  isLoadingShop = false;

  constructor(
    private readonly authService: AuthService,
    private readonly shopClient: ShopClient,
    private readonly router: Router,
    private readonly messageService: MessageService
  ) { }

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
              this.shopLogoUrl = shop.logoUrl;
              this.shopDescription = shop.description;
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
  goRegister(): void {
    this.router.navigate(['/shop/register']);
  }
}

