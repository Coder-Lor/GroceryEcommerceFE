import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  OrderClient,
  CreateOrderRequest as BackendCreateOrderRequest,
  CreateOrderItemRequest,
  ShippingAddressDto,
  BillingAddressDto,
  ResultOfOrderDto
} from './system-admin.service';

export interface CreateOrderRequest {
  userId: string;
  items: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  paymentMethod: 'cod' | 'banking';
  subtotal: number;
  shippingFee: number;
  taxAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orderClient = inject(OrderClient);

  /**
   * Tạo đơn hàng bán hàng cho khách hàng (Sales Order)
   * @param orderData Dữ liệu đơn hàng
   * @returns Observable<ResultOfOrderDto>
   */
  createOrder(orderData: CreateOrderRequest): Observable<ResultOfOrderDto> {
    // Parse tên đầy đủ thành firstName và lastName
    const nameParts = orderData.shippingAddress.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Tạo shipping address
    const shippingAddress = new ShippingAddressDto({
      firstName: firstName,
      lastName: lastName,
      email: '', // Có thể lấy từ user profile nếu có
      phone: orderData.shippingAddress.phone,
      address: orderData.shippingAddress.address,
      city: 'Hà Nội', // Mặc định, có thể parse từ address nếu cần
      state: 'Hà Nội',
      zipCode: '100000',
      country: 'Vietnam'
    });

    // Tạo billing address (mặc định giống shipping address)
    const billingAddress = new BillingAddressDto({
      firstName: firstName,
      lastName: lastName,
      email: '', // Có thể lấy từ user profile nếu có
      phone: orderData.shippingAddress.phone,
      address: orderData.shippingAddress.address,
      city: 'Hà Nội',
      state: 'Hà Nội',
      zipCode: '100000',
      country: 'Vietnam'
    });

    // Tạo order items (không cần orderId vì sẽ được tạo ở backend)
    const items = orderData.items.map(item =>
      new CreateOrderItemRequest({
        orderId: undefined, // Backend sẽ tạo
        productId: item.productId,
        productVariantId: item.productVariantId || undefined,
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })
    );

    // Tính tổng tiền
    const subtotal = orderData.subtotal || orderData.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingAmount = orderData.shippingFee || 0;
    const taxAmount = orderData.taxAmount || 0;
    const discountAmount = orderData.discountAmount || 0;
    const totalAmount = subtotal + shippingAmount + taxAmount - discountAmount;

    // Map payment method: cod = 4, banking = 3
    const paymentMethod = orderData.paymentMethod === 'cod' ? 4 : 3;

    // Tạo request
    const request = new BackendCreateOrderRequest({
      userId: orderData.userId,
      subTotal: subtotal,
      taxAmount: taxAmount,
      shippingAmount: shippingAmount,
      discountAmount: discountAmount,
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      couponCode: orderData.couponCode,
      shippingAddress: shippingAddress,
      billingAddress: billingAddress,
      notes: orderData.notes,
      items: items
    });

    console.log('📦 Creating sales order:', request);
    console.log('📦 Request JSON:', JSON.stringify(request.toJSON(), null, 2));

    return this.orderClient.create(request);
  }
}
