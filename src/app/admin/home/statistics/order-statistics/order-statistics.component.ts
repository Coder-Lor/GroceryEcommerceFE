import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { OrderClient, SortDirection } from '@services/system-admin.service';
import { DialogModule } from 'primeng/dialog';

interface OrderData {
    orderId: string;
    orderNumber: string;
    status: number;
    statusName: string;
    totalAmount: number;
    orderDate: Date;
    paymentMethod: number;
    paymentMethodName: string;
}

@Component({
    selector: 'app-order-statistics',
    standalone: true,
    imports: [CommonModule, BaseChartDirective, DialogModule],
    templateUrl: './order-statistics.component.html',
    styleUrls: ['./order-statistics.component.scss']
})
export class OrderStatisticsComponent implements OnInit {
    private orderClient = inject(OrderClient);

    isLoading = true;
    orders: OrderData[] = [];
    totalOrderValue = 0;
    pendingOrders = 0;
    completedOrders = 0;
    cancelledOrders = 0;

    // Dialog state
    showDetailDialog = false;
    detailDialogTitle = '';
    detailOrders: OrderData[] = [];

    // Line Chart - Doanh thu theo tháng
    public lineChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {},
            y: {
                min: 0,
                ticks: {
                    callback: function (value) {
                        return value.toLocaleString('vi-VN') + ' đ';
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: true,
            },
            title: {
                display: true,
                text: 'Giá trị đơn hàng theo tháng (6 tháng gần nhất)'
            }
        }
    };
    public lineChartType: ChartType = 'line';
    public lineChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Giá trị đơn hàng (VNĐ)',
                borderColor: '#ff2626',
                backgroundColor: 'rgba(255, 38, 38, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    // Bar Chart - Số đơn hàng theo tháng
    public barChartOptions: ChartConfiguration['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {},
            y: {
                min: 0,
                ticks: {
                    stepSize: 1
                }
            }
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Số đơn hàng theo tháng'
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Số đơn hàng', backgroundColor: '#ff2626' }
        ]
    };

    // Pie Chart - Trạng thái đơn hàng
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
                text: 'Trạng thái đơn hàng'
            }
        }
    };
    public pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#ffc107', '#00bcd4', '#667eea', '#29cc00', '#ff2626', '#9c27b0']
        }]
    };
    public pieChartType: ChartType = 'pie';

    // Doughnut Chart - Phương thức thanh toán
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
                text: 'Phương thức thanh toán'
            }
        }
    };
    public doughnutChartData: ChartData<'doughnut', number[], string | string[]> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626']
        }]
    };
    public doughnutChartType: ChartType = 'doughnut';

    ngOnInit(): void {
        this.loadOrderData();
    }

    loadOrderData(): void {
        this.isLoading = true;

        this.orderClient.getOrdersPaging(
            1, 1000, null, null, SortDirection.Descending, [], null, null, false, false, false
        ).subscribe({
            next: (response) => {
                if (response.isSuccess && response.data && response.data.items) {
                    this.orders = response.data.items.map((item: any) => ({
                        orderId: item.orderId,
                        orderNumber: item.orderNumber,
                        status: item.status,
                        statusName: item.statusName || 'Không xác định',
                        totalAmount: item.totalAmount || 0,
                        orderDate: new Date(item.orderDate || item.createdAt),
                        paymentMethod: item.paymentMethod,
                        paymentMethodName: item.paymentMethodName || 'Không xác định'
                    }));
                    this.processChartData();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading orders', err);
                this.isLoading = false;
            }
        });
    }

    processChartData(): void {
        // Tính tổng giá trị đơn hàng đã hoàn thành
        this.totalOrderValue = this.orders
            .filter(o => o.status === 4) // Đơn hàng hoàn thành
            .reduce((sum, o) => sum + o.totalAmount, 0);

        // Đếm đơn hàng theo trạng thái
        this.pendingOrders = this.orders.filter(o => o.status === 0 || o.status === 1).length;
        this.completedOrders = this.orders.filter(o => o.status === 4).length;
        this.cancelledOrders = this.orders.filter(o => o.status === 5).length;

        // Line Chart - Giá trị đơn hàng theo tháng
        const orderValueData = this.getMonthlyOrderValue();
        this.lineChartData = {
            labels: orderValueData.labels,
            datasets: [
                {
                    data: orderValueData.data,
                    label: 'Giá trị đơn hàng (VNĐ)',
                    borderColor: '#ff2626',
                    backgroundColor: 'rgba(255, 38, 38, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };

        // Bar Chart - Số đơn hàng theo tháng
        const orderData = this.getMonthlyOrders();
        this.barChartData = {
            labels: orderData.labels,
            datasets: [
                { data: orderData.data, label: 'Số đơn hàng', backgroundColor: '#ff2626' }
            ]
        };

        // Pie Chart - Trạng thái đơn hàng
        const statusData = this.getStatusDistribution();
        this.pieChartData = {
            labels: statusData.labels,
            datasets: [{
                data: statusData.data,
                backgroundColor: ['#ffc107', '#00bcd4', '#667eea', '#29cc00', '#ff2626', '#9c27b0']
            }]
        };

        // Doughnut Chart - Phương thức thanh toán
        const paymentData = this.getPaymentMethodDistribution();
        this.doughnutChartData = {
            labels: paymentData.labels,
            datasets: [{
                data: paymentData.data,
                backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626']
            }]
        };
    }

    getMonthlyOrderValue(): { labels: string[], data: number[] } {
        const months: { [key: string]: number } = {};
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months[key] = 0;
        }

        // Chỉ tính giá trị từ đơn hoàn thành
        this.orders
            .filter(o => o.status === 4)
            .forEach(order => {
                if (order.orderDate) {
                    const date = new Date(order.orderDate);
                    const key = `${date.getFullYear()}-${date.getMonth()}`;
                    if (months.hasOwnProperty(key)) {
                        months[key] += order.totalAmount;
                    }
                }
            });

        const labels: string[] = [];
        const data: number[] = [];

        Object.keys(months).forEach(key => {
            const [year, month] = key.split('-').map(Number);
            labels.push(`${monthNames[month]} ${year}`);
            data.push(months[key]);
        });

        return { labels, data };
    }

    getMonthlyOrders(): { labels: string[], data: number[] } {
        const months: { [key: string]: number } = {};
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months[key] = 0;
        }

        this.orders.forEach(order => {
            if (order.orderDate) {
                const date = new Date(order.orderDate);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (months.hasOwnProperty(key)) {
                    months[key]++;
                }
            }
        });

        const labels: string[] = [];
        const data: number[] = [];

        Object.keys(months).forEach(key => {
            const [year, month] = key.split('-').map(Number);
            labels.push(`${monthNames[month]} ${year}`);
            data.push(months[key]);
        });

        return { labels, data };
    }

    getStatusDistribution(): { labels: string[], data: number[] } {
        const statuses: { [key: string]: number } = {};

        this.orders.forEach(order => {
            const status = order.statusName || 'Không xác định';
            statuses[status] = (statuses[status] || 0) + 1;
        });

        return {
            labels: Object.keys(statuses),
            data: Object.values(statuses)
        };
    }

    getPaymentMethodDistribution(): { labels: string[], data: number[] } {
        const methods: { [key: string]: number } = {};

        this.orders.forEach(order => {
            const method = order.paymentMethodName || 'Không xác định';
            methods[method] = (methods[method] || 0) + 1;
        });

        return {
            labels: Object.keys(methods),
            data: Object.values(methods)
        };
    }

    formatCurrency(value: number): string {
        return value.toLocaleString('vi-VN') + ' ₫';
    }

    showCompletedOrdersDetail(): void {
        this.detailDialogTitle = 'Đơn hàng hoàn thành';
        this.detailOrders = this.orders.filter(o => o.status === 4);
        this.showDetailDialog = true;
    }

    showAllOrdersDetail(): void {
        this.detailDialogTitle = 'Tất cả đơn hàng';
        this.detailOrders = [...this.orders];
        this.showDetailDialog = true;
    }

    showPendingOrdersDetail(): void {
        this.detailDialogTitle = 'Đơn hàng đang chờ xử lý';
        this.detailOrders = this.orders.filter(o => o.status === 0 || o.status === 1);
        this.showDetailDialog = true;
    }

    showSuccessfulOrdersDetail(): void {
        this.detailDialogTitle = 'Giao dịch thành công';
        this.detailOrders = this.orders.filter(o => o.status === 4);
        this.showDetailDialog = true;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getDetailOrdersTotal(): number {
        return this.detailOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    }
}
