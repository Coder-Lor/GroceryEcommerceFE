import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  UserClient,
  ProductClient,
  OrderClient,
  GiftCardClient,
  SortDirection
} from '@services/system-admin.service';
import { UserStatisticsComponent } from './statistics/user-statistics/user-statistics.component';
import { WarehouseStatisticsComponent } from './statistics/warehouse-statistics/warehouse-statistics.component';
import { OrderStatisticsComponent } from './statistics/order-statistics/order-statistics.component';
import { VoucherStatisticsComponent } from './statistics/voucher-statistics/voucher-statistics.component';

export type StatisticsType = 'user' | 'warehouse' | 'order' | 'voucher';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    UserStatisticsComponent,
    WarehouseStatisticsComponent,
    OrderStatisticsComponent,
    VoucherStatisticsComponent
  ],
  templateUrl: 'home-page.component.html',
  styleUrls: ['home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  // Inject services
  private userClient = inject(UserClient);
  private productClient = inject(ProductClient);
  private orderClient = inject(OrderClient);
  private giftCardClient = inject(GiftCardClient);

  // General report data
  totalUsers: number = 0;
  totalStock: number = 0;
  totalOrders: number = 0;
  totalVouchers: number = 0;

  // Current active statistics view
  activeStatistics: StatisticsType = 'user';

  ngOnInit(): void {
    this.loadGeneralReport();
  }

  selectStatistics(type: StatisticsType): void {
    this.activeStatistics = type;
  }

  loadGeneralReport(): void {
    // Load users count
    this.userClient.getUsersPaging(
      1, 1, null, null, SortDirection.Ascending, [], null, null, false, false, false
    ).subscribe({
      next: (response) => {
        // Parse response from blob to get totalCount
        if (response && response.data) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const result = JSON.parse(reader.result as string);
              if (result.isSuccess && result.data) {
                this.totalUsers = result.data.totalCount || 0;
              }
            } catch (e) {
              console.error('Error parsing users response', e);
            }
          };
          reader.readAsText(response.data);
        }
      },
      error: (err) => console.error('Error loading users', err)
    });

    // Load products count (for stock)
    this.productClient.getProductsPaging(
      1, 1, null, null, SortDirection.Ascending, [], null, null, false, false, false
    ).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.totalStock = response.data.totalCount || 0;
        }
      },
      error: (err) => console.error('Error loading products', err)
    });

    // Load orders count
    this.orderClient.getOrdersPaging(
      1, 1, null, null, SortDirection.Ascending, [], null, null, false, false, false
    ).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.totalOrders = response.data.totalCount || 0;
        }
      },
      error: (err) => console.error('Error loading orders', err)
    });

    // Load vouchers count (GiftCard)
    this.giftCardClient.getPaging(
      1, 1, null, null, SortDirection.Ascending, [], null, null, false, false, false
    ).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.totalVouchers = response.data.totalCount || 0;
        }
      },
      error: (err) => console.error('Error loading vouchers', err)
    });
  }

}
