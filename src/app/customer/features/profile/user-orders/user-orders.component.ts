import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-orders.component.html',
  styleUrl: './user-orders.component.scss',
})
export class UserOrdersComponent {
  orders = [
    {
      id: '#12345',
      date: '2024-01-15',
      status: 'delivered',
      statusText: 'Đã giao',
      total: 1500000,
      items: [
        { name: 'Coffee Beans - Espresso Arabica', quantity: 2, price: 470000 },
        { name: 'Lavazza Coffee Blends', quantity: 1, price: 530000 }
      ]
    },
    {
      id: '#12344',
      date: '2024-01-13',
      status: 'shipping',
      statusText: 'Đang giao',
      total: 890000,
      items: [
        { name: 'Organic Green Tea', quantity: 3, price: 890000 }
      ]
    },
    {
      id: '#12343',
      date: '2024-01-10',
      status: 'processing',
      statusText: 'Đang xử lý',
      total: 650000,
      items: [
        { name: 'Premium Black Tea', quantity: 1, price: 650000 }
      ]
    }
  ];

  viewOrderDetail(order: any) {
    console.log('View order detail:', order);
  }

  reorder(order: any) {
    console.log('Reorder:', order);
  }

  cancelOrder(order: any) {
    console.log('Cancel order:', order);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  }
}
