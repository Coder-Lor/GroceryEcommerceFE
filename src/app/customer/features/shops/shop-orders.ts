import { Component, OnInit, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MessageService, ConfirmationService, MenuItem } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MenuModule, Menu } from 'primeng/menu';
import {
    faMagnifyingGlass,
    faXmark,
    faEye,
    faSort,
    faSortUp,
    faSortDown,
    faTag,
    faCalendar,
    faAnglesLeft,
    faAnglesRight,
    faChevronLeft,
    faChevronRight,
    faRefresh,
    faEllipsisVertical,
} from '@fortawesome/free-solid-svg-icons';
import {
    OrderClient,
    ShopClient,
    SortDirection,
    FilterCriteria,
    FilterOperator,
    ResultOfPagedResultOfOrderDto,
    OrderDto,
    OrderDetailDto,
} from '@core/service/system-admin.service';
import { AuthService } from '@core/service/auth.service';

@Component({
    selector: 'app-shop-orders',
    standalone: true,
    templateUrl: 'shop-orders.html',
    styleUrl: './shop-orders.scss',
    imports: [
        CommonModule,
        FormsModule,
        FaIconComponent,
        ToastModule,
        ConfirmDialogModule,
        MenuModule,
    ],
    providers: [MessageService, ConfirmationService],
})
export class ShopOrdersComponent implements OnInit {
    private orderClient = inject(OrderClient);
    private shopClient = inject(ShopClient);
    private authService = inject(AuthService);
    private messageService = inject(MessageService);

    shopId?: string;

    // Icons
    faMagnifyingGlass = faMagnifyingGlass;
    faXmark = faXmark;
    faEye = faEye;
    faSort = faSort;
    faSortUp = faSortUp;
    faSortDown = faSortDown;
    faTag = faTag;
    faCalendar = faCalendar;
    faAnglesLeft = faAnglesLeft;
    faAnglesRight = faAnglesRight;
    faChevronLeft = faChevronLeft;
    faChevronRight = faChevronRight;
    faRefresh = faRefresh;
    faEllipsisVertical = faEllipsisVertical;

    // Menu
    @ViewChild('actionMenu') actionMenu!: Menu;
    actionMenuItems: MenuItem[] = [];
    selectedOrderForAction: OrderDto | null = null;

    orders: OrderDto[] = [];
    filteredOrders: OrderDto[] = [];
    selectedOrder: OrderDetailDto | null = null;
    isLoading = false;
    isDetailModalOpen = false;

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalPages = 0;
    totalRecords = 0;

    // Search & Sort
    searchTerm = '';
    sortColumn = 'orderDate';
    sortDirection: 'asc' | 'desc' = 'desc';

    Math = Math;
    SortDirection = SortDirection;

    ngOnInit(): void {
        this.fetchShopAndLoadOrders();
    }

    private fetchShopAndLoadOrders(): void {
        this.isLoading = true;
        this.authService.currentUser.subscribe((user) => {
            if (!user?.id) {
                this.isLoading = false;
                return;
            }

            this.shopClient
                .getByOwner(user.id, 1, 1, undefined, 'createdAt', SortDirection.Descending,
                    undefined, undefined, undefined, false, false, true)
                .subscribe({
                    next: (res) => {
                        const shop = res?.data?.items?.[0];
                        if (shop?.shopId) {
                            this.shopId = shop.shopId;
                            this.loadOrders();
                        } else {
                            this.isLoading = false;
                        }
                    },
                    error: () => {
                        this.isLoading = false;
                    },
                });
        });
    }

    loadOrders(): void {
        if (!this.shopId) return;

        this.isLoading = true;
        const apiSortDirection = this.sortDirection === 'asc'
            ? SortDirection.Ascending
            : SortDirection.Descending;

        // Create filter for ShopId
        const filters = [
            new FilterCriteria({
                fieldName: 'ShopId',
                value: this.shopId,
                operator: FilterOperator.Equals
            })
        ];

        this.orderClient
            .getOrdersPaging(
                this.currentPage,
                this.pageSize,
                this.searchTerm || undefined,
                this.sortColumn,
                apiSortDirection,
                filters,
                undefined,
                undefined,
                true,
                !!this.searchTerm,
                true
            )
            .subscribe({
                next: (response) => {
                    this.isLoading = false;
                    this.parseOrderData(response);
                },
                error: (error) => {
                    this.isLoading = false;
                    console.error('Lỗi khi tải danh sách đơn hàng:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Lỗi',
                        detail: 'Không thể tải danh sách đơn hàng!',
                    });
                },
            });
    }

    private parseOrderData(response: ResultOfPagedResultOfOrderDto): void {
        if (response.data && response.data.items) {
            this.orders = response.data.items;
            this.filteredOrders = [...this.orders];
            this.totalRecords = response.data.totalCount || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
        }
    }

    changeSortColumn(column: string): void {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }
        this.loadOrders();
    }

    onPageChange(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadOrders();
        }
    }

    onPageSizeChange(): void {
        this.currentPage = 1;
        this.loadOrders();
    }

    onSearch(): void {
        this.currentPage = 1;
        this.loadOrders();
    }

    viewOrderDetail(orderId: string): void {
        this.isLoading = true;
        this.orderClient.getById(orderId).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response.data) {
                    this.selectedOrder = response.data;
                    this.isDetailModalOpen = true;
                }
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Lỗi:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: 'Không thể tải thông tin đơn hàng!',
                });
            },
        });
    }

    closeModal(): void {
        this.isDetailModalOpen = false;
        this.selectedOrder = null;
    }

    formatDate(date?: Date | string | null): string {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    formatCurrency(amount?: number): string {
        if (amount === undefined || amount === null) return '0 ₫';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    }

    getPageNumbers(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    getStatusDisplay(status: number): string {
        const statusMap: { [key: number]: string } = {
            1: 'Chờ xử lý',
            2: 'Đang xử lý',
            3: 'Đang giao hàng',
            4: 'Hoàn thành',
            5: 'Đã hủy',
        };
        return statusMap[status] || 'Không xác định';
    }

    getPaymentStatusDisplay(status: number): string {
        const statusMap: { [key: number]: string } = {
            1: 'Chờ thanh toán',
            2: 'Đã thanh toán',
            3: 'Thanh toán thất bại',
            4: 'Đã hoàn tiền',
        };
        return statusMap[status] || 'Không xác định';
    }

    getStatusBadgeClass(status: number): string {
        const classMap: { [key: number]: string } = {
            1: 'status-pending',
            2: 'status-processing',
            3: 'status-shipping',
            4: 'status-completed',
            5: 'status-cancelled',
        };
        return classMap[status] || 'status-unknown';
    }

    getPaymentBadgeClass(status: number): string {
        const classMap: { [key: number]: string } = {
            1: 'payment-pending',
            2: 'payment-completed',
            3: 'payment-failed',
            4: 'payment-refunded',
        };
        return classMap[status] || 'payment-unknown';
    }

    showActionMenu(event: Event, order: OrderDto): void {
        this.selectedOrderForAction = order;
        this.actionMenuItems = [
            {
                label: 'Xem chi tiết',
                icon: 'pi pi-eye',
                command: () => this.viewOrderDetail(order.orderId!),
            },
        ];
        this.actionMenu.toggle(event);
    }
}
