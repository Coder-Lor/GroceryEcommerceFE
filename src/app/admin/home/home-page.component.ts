import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterModule, BaseChartDirective],
  template: `
    <div class="page-container">  
      <div class="charts-grid">
        <div class="chart-container">
          <h2>Doanh thu theo tháng</h2>
          <canvas baseChart
            [data]="barChartData"
            [options]="barChartOptions"
            [type]="barChartType">
          </canvas>
        </div>
        <div class="chart-container">
          <h2>Tỷ lệ danh mục sản phẩm</h2>
          <canvas baseChart
            [data]="pieChartData"
            [options]="pieChartOptions"
            [type]="pieChartType">
          </canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 20px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .chart-container {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  `]
})
export class HomePageComponent implements OnInit {
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
    this.generateChartData();
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
