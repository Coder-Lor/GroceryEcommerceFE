import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import {
  UserClient,
  ProductClient,
  OrderClient,
  GiftCardClient,
  SortDirection
} from '@services/system-admin.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterModule, BaseChartDirective],
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

  // Bar Chart
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: {
        min: 0
      }
    },
    plugins: {
      legend: {
        display: true,
      }
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Doanh thu (triệu VNĐ)' }
    ]
  };

  // Pie Chart
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: [],
    datasets: [{
      data: []
    }]
  };
  public pieChartType: ChartType = 'pie';

  ngOnInit(): void {
    this.loadGeneralReport();
    this.generateChartData();
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

  generateChartData(): void {
    // Mock data for Bar Chart (Monthly Revenue)
    this.barChartData.labels = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
    this.barChartData.datasets[0].data = [65, 59, 80, 81, 56, 55];
    this.barChartData.datasets[0].backgroundColor = 'rgba(75, 192, 192, 0.6)';


    // Mock data for Pie Chart (Product Categories)
    this.pieChartData.labels = ['Điện tử', 'Thời trang', 'Gia dụng', 'Sách', 'Thực phẩm'];
    this.pieChartData.datasets[0].data = [300, 500, 100, 80, 120];
    this.pieChartData.datasets[0].backgroundColor = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)'
    ];
  }
}
