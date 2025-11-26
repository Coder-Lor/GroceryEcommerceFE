/**
 * Enum cho trạng thái đơn hàng
 * Order Status Enum
 */
export enum OrderStatus {
  pending = 1,        // Chờ xử lý
  processing = 2,        // Đang xử lý
  shipping = 3,   // Đang vận chuyển
  delivered = 4,      // Đã nhận hàng
  cancelled = 5            // Đã huỷ
}

/**
 * Enum cho trạng thái thanh toán
 * Payment Status Enum
 */
export enum PaymentStatus {
  pending = 1,    // Chờ thanh toán
  paid = 2,     // Đã thanh toán
  failed = 3,         // Thất bại
  refunded = 4       // Đã hoàn tiền
}

/**
 * Enum cho phương thức thanh toán
 * Payment Method Enum
 */
export enum PaymentMethod {
  creditCard = 1,      // Thẻ tín dụng
  PayPal = 2,          // PayPal
  bankTransfer = 3, // Chuyển khoản ngân hàng
  COD = 4              // COD (Cash on Delivery)
}

/**
 * Class để map giá trị enum thành text hiển thị
 * Mapping class for enum to display text
 */
export class OrderStatusMapper {
  /**
   * Map trạng thái đơn hàng sang text hiển thị
   */
  static getOrderStatusDisplay(status: number): string {
    const statusMap: Record<number, string> = {
      [OrderStatus.pending]: 'Chờ xử lý',
      [OrderStatus.processing]: 'Đang xử lý',
      [OrderStatus.shipping]: 'Đang vận chuyển',
      [OrderStatus.delivered]: 'Đã nhận hàng',
      [OrderStatus.cancelled]: 'Đã huỷ'
    };
    return statusMap[status] || 'Không xác định';
  }

  /**
   * Map trạng thái thanh toán sang text hiển thị
   */
  static getPaymentStatusDisplay(status: number): string {
    const statusMap: Record<number, string> = {
      [PaymentStatus.pending]: 'Chờ thanh toán',
      [PaymentStatus.paid]: 'Đã thanh toán',
      [PaymentStatus.failed]: 'Thất bại',
      [PaymentStatus.refunded]: 'Đã hoàn tiền'
    };
    return statusMap[status] || 'Không xác định';
  }

  /**
   * Map phương thức thanh toán sang text hiển thị
   */
  static getPaymentMethodDisplay(method: number): string {
    const methodMap: Record<number, string> = {
      [PaymentMethod.creditCard]: 'Thẻ tín dụng',
      [PaymentMethod.PayPal]: 'PayPal',
      [PaymentMethod.bankTransfer]: 'Chuyển khoản ngân hàng',
      [PaymentMethod.COD]: 'Thanh toán khi nhận hàng (COD)'
    };
    return methodMap[method] || 'Không xác định';
  }

  /**
   * Lấy class CSS cho trạng thái đơn hàng (cho badge styling)
   */
  static getOrderStatusClass(status: number): string {
    const classMap: Record<number, string> = {
      [OrderStatus.pending]: 'status-pending',
      [OrderStatus.processing]: 'status-processing',
      [OrderStatus.shipping]: 'status-shipping',
      [OrderStatus.delivered]: 'status-completed',
      [OrderStatus.cancelled]: 'status-cancelled'
    };
    return classMap[status] || 'status-unknown';
  }

  /**
   * Lấy class CSS cho trạng thái thanh toán
   */
  static getPaymentStatusClass(status: number): string {
    const classMap: Record<number, string> = {
      [PaymentStatus.pending]: 'payment-pending',
      [PaymentStatus.paid]: 'payment-completed',
      [PaymentStatus.failed]: 'payment-failed',
      [PaymentStatus.refunded]: 'payment-refunded'
    };
    return classMap[status] || 'payment-unknown';
  }

  /**
   * Lấy tất cả các trạng thái đơn hàng dưới dạng array
   */
  static getAllOrderStatuses(): Array<{ value: number; label: string }> {
    return [
      { value: OrderStatus.pending, label: 'Chờ xử lý' },
      { value: OrderStatus.processing, label: 'Đang xử lý' },
      { value: OrderStatus.shipping, label: 'Đang vận chuyển' },
      { value: OrderStatus.delivered, label: 'Đã nhận hàng' },
      { value: OrderStatus.cancelled, label: 'Đã huỷ' }
    ];
  }

  /**
   * Lấy tất cả các trạng thái thanh toán dưới dạng array
   */
  static getAllPaymentStatuses(): Array<{ value: number; label: string }> {
    return [
      { value: PaymentStatus.pending, label: 'Chờ thanh toán' },
      { value: PaymentStatus.paid, label: 'Đã thanh toán' },
      { value: PaymentStatus.failed, label: 'Thất bại' },
      { value: PaymentStatus.refunded, label: 'Đã hoàn tiền' }
    ];
  }

  /**
   * Lấy tất cả các phương thức thanh toán dưới dạng array
   */
  static getAllPaymentMethods(): Array<{ value: number; label: string }> {
    return [
      { value: PaymentMethod.creditCard, label: 'Thẻ tín dụng' },
      { value: PaymentMethod.PayPal, label: 'PayPal' },
      { value: PaymentMethod.bankTransfer, label: 'Chuyển khoản ngân hàng' },
      { value: PaymentMethod.COD, label: 'Thanh toán khi nhận hàng (COD)' }
    ];
  }
}
