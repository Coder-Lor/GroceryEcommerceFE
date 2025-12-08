import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { UserClient, SortDirection } from '@services/system-admin.service';

interface UserData {
    userId: string;
    userName: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
    roleName: string;
}

@Component({
    selector: 'app-user-statistics',
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    templateUrl: './user-statistics.component.html',
    styleUrls: ['./user-statistics.component.scss']
})
export class UserStatisticsComponent implements OnInit {
    private userClient = inject(UserClient);

    isLoading = true;
    users: UserData[] = [];

    // Bar Chart - Người dùng theo tháng
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
                display: true,
            },
            title: {
                display: true,
                text: 'Người dùng đăng ký theo tháng'
            }
        }
    };
    public barChartType: ChartType = 'bar';
    public barChartData: ChartData<'bar'> = {
        labels: [],
        datasets: [
            { data: [], label: 'Số người dùng mới', backgroundColor: '#667eea' }
        ]
    };

    // Pie Chart - Phân loại người dùng theo role
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
                text: 'Phân loại người dùng theo vai trò'
            }
        }
    };
    public pieChartData: ChartData<'pie', number[], string | string[]> = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626', '#00bcd4']
        }]
    };
    public pieChartType: ChartType = 'pie';

    // Doughnut Chart - Trạng thái người dùng
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
                text: 'Trạng thái tài khoản'
            }
        }
    };
    public doughnutChartData: ChartData<'doughnut', number[], string | string[]> = {
        labels: ['Hoạt động', 'Không hoạt động'],
        datasets: [{
            data: [],
            backgroundColor: ['#29cc00', '#ff2626']
        }]
    };
    public doughnutChartType: ChartType = 'doughnut';

    ngOnInit(): void {
        this.loadUserData();
    }

    loadUserData(): void {
        this.isLoading = true;

        // Load tất cả người dùng để phân tích
        this.userClient.getUsersPaging(
            1, 1000, null, null, SortDirection.Descending, [], null, null, false, false, false
        ).subscribe({
            next: (response) => {
                if (response && response.data) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const result = JSON.parse(reader.result as string);
                            if (result.isSuccess && result.data && result.data.items) {
                                this.users = result.data.items.map((item: any) => ({
                                    userId: item.userId,
                                    userName: item.userName,
                                    email: item.email,
                                    createdAt: new Date(item.createdAt),
                                    isActive: item.isActive,
                                    roleName: item.roleName || 'User'
                                }));
                                this.processChartData();
                            }
                        } catch (e) {
                            console.error('Error parsing users response', e);
                        }
                        this.isLoading = false;
                    };
                    reader.readAsText(response.data);
                }
            },
            error: (err) => {
                console.error('Error loading users', err);
                this.isLoading = false;
            }
        });
    }

    processChartData(): void {
        // Xử lý dữ liệu cho Bar Chart - Người dùng theo tháng (6 tháng gần nhất)
        const monthlyData = this.getMonthlyRegistrations();
        this.barChartData = {
            labels: monthlyData.labels,
            datasets: [
                { data: monthlyData.data, label: 'Số người dùng mới', backgroundColor: '#667eea' }
            ]
        };

        // Xử lý dữ liệu cho Pie Chart - Phân loại theo role
        const roleData = this.getRoleDistribution();
        this.pieChartData = {
            labels: roleData.labels,
            datasets: [{
                data: roleData.data,
                backgroundColor: ['#667eea', '#f06e17', '#29cc00', '#ff2626', '#00bcd4']
            }]
        };

        // Xử lý dữ liệu cho Doughnut Chart - Trạng thái
        const statusData = this.getStatusDistribution();
        this.doughnutChartData = {
            labels: ['Hoạt động', 'Không hoạt động'],
            datasets: [{
                data: statusData,
                backgroundColor: ['#29cc00', '#ff2626']
            }]
        };
    }

    getMonthlyRegistrations(): { labels: string[], data: number[] } {
        const months: { [key: string]: number } = {};
        const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
            'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

        // Lấy 6 tháng gần nhất
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            months[key] = 0;
        }

        // Đếm người dùng theo tháng
        this.users.forEach(user => {
            if (user.createdAt) {
                const date = new Date(user.createdAt);
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

    getRoleDistribution(): { labels: string[], data: number[] } {
        const roles: { [key: string]: number } = {};

        this.users.forEach(user => {
            const role = user.roleName || 'User';
            roles[role] = (roles[role] || 0) + 1;
        });

        return {
            labels: Object.keys(roles),
            data: Object.values(roles)
        };
    }

    getStatusDistribution(): number[] {
        let active = 0;
        let inactive = 0;

        this.users.forEach(user => {
            if (user.isActive) {
                active++;
            } else {
                inactive++;
            }
        });

        return [active, inactive];
    }
}
