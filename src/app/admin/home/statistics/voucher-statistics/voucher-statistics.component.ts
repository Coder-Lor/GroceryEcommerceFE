import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { GiftCardClient, SortDirection } from '@services/system-admin.service';

interface VoucherData {
    giftCardId: string;
    code: string;
    name: string;
    initialAmount: number;
    currentBalance: number;
    usedAmount: number;
    status: number;
    statusName: string;
    validFrom: Date;
    validTo: Date;
    createdAt: Date;
}

@Component({
    selector: 'app-voucher-statistics',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './voucher-statistics.component.html',
    styleUrls: ['./voucher-statistics.component.scss']
})
export class VoucherStatisticsComponent implements OnInit {
    private giftCardClient = inject(GiftCardClient);

    isLoading = true;
    vouchers: VoucherData[] = [];
    totalValue = 0;
    totalUsed = 0;
    activeVouchers = 0;
    expiredVouchers = 0;

    // Bar Chart - Voucher tạo theo tháng
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
                text: 'Voucher phát hành theo tháng'
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Số voucher', backgroundColor: '#29cc00' }
        ]
    };

    // Pie Chart - Trạng thái voucher
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
                text: 'Trạng thái voucher'
            }
        }
    };
    public pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#29cc00', '#ffc107', '#ff2626', '#667eea', '#9c27b0']
        }]
    };
    public pieChartType: ChartType = 'pie';

    // Doughnut Chart - Tỷ lệ sử dụng
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
                text: 'Tỷ lệ sử dụng giá trị voucher'
            }
        }
    };
    public doughnutChartData: ChartData<'doughnut', number[], string | string[]> = {
        labels: ['Đã sử dụng', 'Còn lại'],
        datasets: [{
            data: [],
            backgroundColor: ['#ff2626', '#29cc00']
        }]
    };
    public doughnutChartType: ChartType = 'doughnut';

    // Line Chart - Giá trị voucher theo thời gian
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
                text: 'Giá trị voucher phát hành theo tháng'
            }
        }
    };
    public lineChartType: ChartType = 'line';
    public lineChartData: ChartData<'line'> = {
        labels: [],
        datasets: [
            {
                data: [],
                label: 'Giá trị (VNĐ)',
                borderColor: '#29cc00',
                backgroundColor: 'rgba(41, 204, 0, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    ngOnInit(): void {
        this.loadVoucherData();
    }

    loadVoucherData(): void {
        this.isLoading = true;

        this.giftCardClient.getPaging(
            1, 1000, null, null, SortDirection.Descending, [], null, null, false, false, false
        ).subscribe({
            next: (response) => {
                if (response.isSuccess && response.data && response.data.items) {
                    this.vouchers = response.data.items.map((item: any) => ({
                        giftCardId: item.giftCardId,
                        code: item.code,
                        name: item.name,
                        initialAmount: item.initialAmount || 0,
                        currentBalance: item.currentBalance || 0,
                        usedAmount: item.usedAmount || 0,
                        status: item.status,
                        statusName: item.statusName || 'Không xác định',
                        validFrom: new Date(item.validFrom),
                        validTo: new Date(item.validTo),
                        createdAt: new Date(item.createdAt)
                    }));
                    this.processChartData();
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading vouchers', err);
                this.isLoading = false;
            }
        });
    }

    processChartData(): void {
        // Tính tổng giá trị
        this.totalValue = this.vouchers.reduce((sum, v) => sum + v.initialAmount, 0);
        this.totalUsed = this.vouchers.reduce((sum, v) => sum + v.usedAmount, 0);

        // Đếm voucher theo trạng thái
        const now = new Date();
        this.activeVouchers = this.vouchers.filter(v =>
            v.status === 1 && new Date(v.validTo) >= now
        ).length;
        this.expiredVouchers = this.vouchers.filter(v =>
            new Date(v.validTo) < now
        ).length;

        // Bar Chart - Voucher theo tháng
        const monthlyData = this.getMonthlyVouchers();
        this.barChartData = {
            labels: monthlyData.labels,
            datasets: [
                { data: monthlyData.data, label: 'Số voucher', backgroundColor: '#29cc00' }
            ]
        };

        // Pie Chart - Trạng thái voucher
        const statusData = this.getStatusDistribution();
        this.pieChartData = {
            labels: statusData.labels,
            datasets: [{
                data: statusData.data,
                backgroundColor: ['#29cc00', '#ffc107', '#ff2626', '#667eea', '#9c27b0']
            }]
        };

        // Doughnut Chart - Tỷ lệ sử dụng
        const remaining = this.totalValue - this.totalUsed;
        this.doughnutChartData = {
            labels: ['Đã sử dụng', 'Còn lại'],
            datasets: [{
                data: [this.totalUsed, remaining > 0 ? remaining : 0],
                backgroundColor: ['#ff2626', '#29cc00']
            }]
        };

        // Line Chart - Giá trị theo tháng
        const valueData = this.getMonthlyValue();
        this.lineChartData = {
            labels: valueData.labels,
            datasets: [
                {
                    data: valueData.data,
                    label: 'Giá trị (VNĐ)',
                    borderColor: '#29cc00',
                    backgroundColor: 'rgba(41, 204, 0, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    }

    getMonthlyVouchers(): { labels: string[], data: number[] } {
        const months: { [key: string]: number } = {};
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months[key] = 0;
        }

        this.vouchers.forEach(voucher => {
            if (voucher.createdAt) {
                const date = new Date(voucher.createdAt);
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

    getMonthlyValue(): { labels: string[], data: number[] } {
        const months: { [key: string]: number } = {};
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months[key] = 0;
        }

        this.vouchers.forEach(voucher => {
            if (voucher.createdAt) {
                const date = new Date(voucher.createdAt);
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (months.hasOwnProperty(key)) {
                    months[key] += voucher.initialAmount;
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

        this.vouchers.forEach(voucher => {
            const status = voucher.statusName || 'Không xác định';
            statuses[status] = (statuses[status] || 0) + 1;
        });

        return {
            labels: Object.keys(statuses),
            data: Object.values(statuses)
        };
    }

    formatCurrency(value: number): string {
        return value.toLocaleString('vi-VN') + ' đ';
    }
}
