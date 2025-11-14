import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  PurchaseOrderClient, 
  CreatePurchaseOrderCommand, 
  CreatePurchaseOrderItemRequest,
  FileResponse 
} from './system-admin.service';

export interface CreateOrderRequest {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private purchaseOrderClient = inject(PurchaseOrderClient);

  /**
   * Tạo đơn hàng mới với phương thức COD
   * @param orderData Dữ liệu đơn hàng
   * @returns Observable<FileResponse>
   */
  createOrder(orderData: CreateOrderRequest): Observable<FileResponse> {
    // Tính ngày dự kiến (ngày hiện tại + 2 ngày)
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 2);

    // Tạo danh sách items
    const items = orderData.items.map(item => 
      new CreatePurchaseOrderItemRequest({
        productId: item.productId,
        unitCost: item.unitPrice,
        quantity: item.quantity
      })
    );

    // Tạo command
    const command = new CreatePurchaseOrderCommand({
      expectedDate: expectedDate,
      items: items
    });

    console.log('📦 Creating order with command:', command);

    return this.purchaseOrderClient.createPurchaseOrder(command);
  }
}
