import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { ProductClient, SortDirection } from '@services/system-admin.service';

interface ProductData {
    productId: string;
    name: string;
    stock: number;
    categoryName: string;
    price: number;
    createdAt: Date;
    isActive: boolean;
}

@Component({
    selector: 'app-warehouse-statistics',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './warehouse-statistics.component.html',
    styleUrls: ['./warehouse-statistics.component.scss']
})
export class WarehouseStatisticsComponent implements OnInit {
    private productClient = inject(ProductClient);

    isLoading = true;
    products: ProductData[] = [];
    totalStock = 0;
    lowStockCount = 0;
    outOfStockCount = 0;

    // Bar Chart - Top sản phẩm theo tồn kho
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                min: 0,
            },
            y: {}
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Top 10 sản phẩm có tồn kho nhiều nhất'
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Số lượng', backgroundColor: '#f06e17' }
        ]
    };

    // Pie Chart - Phân loại theo danh mục
    public pieChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
            },
            title: {
                display: true,
                text: 'Tồn kho theo danh mục'
            }
        }
    };
    public pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626', '#00bcd4', '#9c27b0', '#ffc107', '#795548']
        }]
    };
    public pieChartType: ChartType = 'pie';

    // Doughnut Chart - Trạng thái tồn kho
    public doughnutChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
            },
            title: {
                display: true,
                text: 'Trạng thái tồn kho'
            }
        }
    };
    public doughnutChartData: ChartData<'doughnut', number[], string | string[]> = {
        labels: ['Còn hàng', 'Sắp hết', 'Hết hàng'],
        datasets: [{
            data: [],
            backgroundColor: ['#29cc00', '#ffc107', '#ff2626']
        }]
    };
    public doughnutChartType: ChartType = 'doughnut';

    ngOnInit(): void {
        this.loadProductData();
    }

    loadProductData(): void {
        this.isLoading = true;

        this.productClient.getProductsPaging(
            1, 1000, null, null, SortDirection.Descending, [], null, null, false, false, false
        ).subscribe({
            next: (response) => {
                if (response.isSuccess && response.data && response.data.items) {
                    this.products = response.data.items.map((item: any) => ({
                        productId: item.productId,
                        name: item.name,
                        stock: item.stockQuantity || 0,
                        categoryName: item.categoryName || 'Chưa phân loại',
                        price: item.price || 0,
                        createdAt: new Date(item.createdAt),
                        isActive: item.isActive
                    }));
                    this.processChartData();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading products', err);
                this.isLoading = false;
            }
        });
    }

    processChartData(): void {
        // Tính tổng tồn kho
        this.totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);

        // Đếm sản phẩm sắp hết và hết hàng
        this.lowStockCount = this.products.filter(p => p.stock > 0 && p.stock <= 10).length;
        this.outOfStockCount = this.products.filter(p => p.stock === 0).length;

        // Bar Chart - Top 10 sản phẩm có tồn kho nhiều nhất
        const topProducts = [...this.products]
            .sort((a, b) => b.stock - a.stock)
            .slice(0, 10);

        this.barChartData = {
            labels: topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
            datasets: [
                { data: topProducts.map(p => p.stock), label: 'Số lượng', backgroundColor: '#f06e17' }
            ]
        };

        // Pie Chart - Tồn kho theo danh mục
        const categoryStock = this.getCategoryStock();
        this.pieChartData = {
            labels: categoryStock.labels,
            datasets: [{
                data: categoryStock.data,
                backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626', '#00bcd4', '#9c27b0', '#ffc107', '#795548']
            }]
        };

        // Doughnut Chart - Trạng thái tồn kho
        const inStock = this.products.filter(p => p.stock > 10).length;
        this.doughnutChartData = {
            labels: ['Còn hàng (>10)', 'Sắp hết (≤10)', 'Hết hàng'],
            datasets: [{
                data: [inStock, this.lowStockCount, this.outOfStockCount],
                backgroundColor: ['#29cc00', '#ffc107', '#ff2626']
            }]
        };
    }

    getCategoryStock(): { labels: string[], data: number[] } {
        const categories: { [key: string]: number } = {};

        this.products.forEach(product => {
            const category = product.categoryName || 'Chưa phân loại';
            categories[category] = (categories[category] || 0) + product.stock;
        });

        // Sắp xếp và lấy top 8 danh mục
        const sorted = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);

        return {
            labels: sorted.map(([name]) => name),
            data: sorted.map(([, stock]) => stock)
        };
    }
}
