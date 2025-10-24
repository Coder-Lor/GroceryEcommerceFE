import { Component } from '@angular/core';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  template: `
    <h2>Quản lý đơn hàng</h2>
    <p>Theo dõi, xử lý và cập nhật trạng thái đơn hàng.</p>
  `,
  styles: [
    `:host { display: block; }`
  ]
})
export class OrdersPageComponent {}
