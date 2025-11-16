import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faBox,
  faCreditCard,
  faUndo,
  faShoppingCart,
  faTruck,
  faHistory,
  faTruckFast,
} from '@fortawesome/free-solid-svg-icons';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderPaymentListComponent } from './order-payment-list/order-payment-list.component';
import { OrderRefundListComponent } from './order-refund-list/order-refund-list.component';
import { OrderItemListComponent } from './order-item-list/order-item-list.component';
import { OrderShipmentListComponent } from './order-shipment-list/order-shipment-list.component';
import { OrderStatusHistoryListComponent } from './order-status-history-list/order-status-history-list.component';
import { ShipmentCarrierListComponent } from './shipment-carrier-list/shipment-carrier-list.component';

@Component({
  selector: 'app-order-management-page',
  standalone: true,
  templateUrl: 'order-management-page.component.html',
  styleUrl: './order-management-page.component.scss',
  imports: [
    CommonModule,
    FaIconComponent,
    OrderListComponent,
    OrderPaymentListComponent,
    OrderRefundListComponent,
    OrderItemListComponent,
    OrderShipmentListComponent,
    OrderStatusHistoryListComponent,
    ShipmentCarrierListComponent,
  ],
})
export class OrderManagementPageComponent implements OnInit {
  // Icons
  faBox = faBox;
  faCreditCard = faCreditCard;
  faUndo = faUndo;
  faShoppingCart = faShoppingCart;
  faTruck = faTruck;
  faHistory = faHistory;
  faTruckFast = faTruckFast;

  activeTab: string = 'orders';

  tabs = [
    { id: 'orders', label: 'Đơn hàng', icon: faBox },
    { id: 'order-payments', label: 'Thanh toán', icon: faCreditCard },
    { id: 'order-refunds', label: 'Hoàn tiền', icon: faUndo },
    { id: 'order-items', label: 'Sản phẩm đơn hàng', icon: faShoppingCart },
    { id: 'order-shipments', label: 'Vận chuyển', icon: faTruck },
    { id: 'order-status-history', label: 'Lịch sử trạng thái', icon: faHistory },
    { id: 'shipment-carriers', label: 'Đơn vị vận chuyển', icon: faTruckFast },
  ];

  ngOnInit(): void {}

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
  }
}

