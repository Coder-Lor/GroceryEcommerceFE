import { Injectable } from '@angular/core';
import { OrderDetailDto, OrderItemDto } from '../../../core/service/system-admin.service';
import { OrderStatusMapper } from '../models';

@Injectable({
    providedIn: 'root',
})
export class InvoicePdfService {
    /**
     * Xuất hóa đơn PDF cho đơn hàng bằng cách tạo HTML và mở cửa sổ in
     */
    exportInvoice(order: OrderDetailDto): void {
        const htmlContent = this.generateInvoiceHtml(order);

        // Tạo một cửa sổ mới để in
        const printWindow = window.open('', '_blank', 'width=800,height=600');

        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            // Đợi load xong rồi in
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            };
        }
    }

    /**
     * Tạo nội dung HTML cho hóa đơn
     */
    private generateInvoiceHtml(order: OrderDetailDto): string {
        const orderDate = this.formatDate(order.orderDate);
        const createdDate = this.formatDate(new Date());
        const orderStatus = OrderStatusMapper.getOrderStatusDisplay(order.status || 1);
        const paymentStatus = OrderStatusMapper.getPaymentStatusDisplay(order.paymentStatus || 1);
        const paymentMethod = OrderStatusMapper.getPaymentMethodDisplay(order.paymentMethod || 4);

        // Tạo rows cho bảng sản phẩm
        const itemsRows = (order.items || [])
            .map(
                (item: OrderItemDto, index: number) => `
        <tr>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">
            <strong>${item.productName || 'N/A'}</strong>
            ${item.variantName ? `<br><small style="color: #666;">Phân loại: ${item.variantName}</small>` : ''}
          </td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">${item.productSku || '-'}</td>
          <td style="text-align: center; padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">${item.quantity || 0}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e0e0e0;">${this.formatCurrency(item.unitPrice || 0)}</td>
          <td style="text-align: right; padding: 10px 8px; border-bottom: 1px solid #e0e0e0; font-weight: 600;">${this.formatCurrency(item.totalPrice || 0)}</td>
        </tr>
      `
            )
            .join('');

        // Tạo row giảm giá nếu có
        const discountRow =
            order.discountAmount && order.discountAmount > 0
                ? `
        <tr>
          <td style="padding: 8px 0; text-align: right;">Giảm giá:</td>
          <td style="padding: 8px 0; text-align: right; color: #dc3545; font-weight: 600;">-${this.formatCurrency(order.discountAmount)}</td>
        </tr>
      `
                : '';

        return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hóa đơn - ${order.orderNumber || 'N/A'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Roboto', 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }
    
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 30px;
      background: #fff;
    }
    
    /* Header */
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 20px;
      border-bottom: 3px solid #667eea;
      margin-bottom: 25px;
    }
    
    .company-info h1 {
      color: #667eea;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .company-info p {
      color: #666;
      font-size: 13px;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h2 {
      color: #333;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .invoice-title .invoice-number {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
    }
    
    /* Info Sections */
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      gap: 30px;
    }
    
    .info-box {
      flex: 1;
      background: #f8f9fa;
      padding: 15px 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    
    .info-box h3 {
      color: #667eea;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .info-box p {
      margin-bottom: 5px;
      font-size: 13px;
    }
    
    .info-box strong {
      color: #333;
    }
    
    /* Order Details Box */
    .order-details {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 25px;
    }
    
    .order-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    
    .order-detail-item {
      text-align: center;
    }
    
    .order-detail-item .label {
      font-size: 11px;
      text-transform: uppercase;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    
    .order-detail-item .value {
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Products Table */
    .section-title {
      color: #333;
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #667eea;
      display: inline-block;
    }
    
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    
    .products-table thead {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .products-table th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    
    .products-table th:first-child {
      border-radius: 8px 0 0 0;
    }
    
    .products-table th:last-child {
      border-radius: 0 8px 0 0;
    }
    
    .products-table tbody tr:hover {
      background: #f8f9fa;
    }
    
    .products-table tbody tr:last-child td {
      border-bottom: none;
    }
    
    /* Summary */
    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    
    .summary-box {
      width: 320px;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
    }
    
    .summary-box table {
      width: 100%;
    }
    
    .summary-box td {
      padding: 8px 0;
    }
    
    .summary-box .total-row {
      border-top: 2px solid #667eea;
      margin-top: 10px;
    }
    
    .summary-box .total-row td {
      padding-top: 15px;
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }
    
    /* Notes */
    .notes-section {
      background: #fff3cd;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 25px;
      border-left: 4px solid #ffc107;
    }
    
    .notes-section h4 {
      color: #856404;
      margin-bottom: 8px;
      font-size: 14px;
    }
    
    .notes-section p {
      color: #856404;
      font-size: 13px;
    }
    
    /* Footer */
    .invoice-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #666;
      font-size: 12px;
    }
    
    .invoice-footer p {
      margin-bottom: 5px;
    }
    
    .invoice-footer .thank-you {
      color: #667eea;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    
    /* Print styles */
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .invoice-container {
        padding: 20px;
      }
      
      .order-details {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .products-table thead {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    @page {
      size: A4;
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>🛒 GROCERYMART</h1>
        <p>Hệ thống thương mại điện tử thực phẩm & hàng tiêu dùng</p>
        <p style="margin-top: 8px;">📍 28 Phố Nhổn, Từ Liêm, Hà Nội</p>
        <p>📞 (0367) 111 302 | ✉️ support@grocerymart.com</p>
      </div>
      <div class="invoice-title">
        <h2>HÓA ĐƠN BÁN HÀNG</h2>
        <p class="invoice-number">Số: ${order.orderNumber || 'N/A'}</p>
        <p style="color: #666; font-size: 13px; margin-top: 5px;">Ngày: ${createdDate}</p>
      </div>
    </div>
    
    <!-- Customer & Shipping Info -->
    <div class="info-section">
      <div class="info-box">
        <h3>👤 Thông tin khách hàng</h3>
        <p><strong>Họ tên:</strong> ${order.userName || 'Không có'}</p>
        <p><strong>Email:</strong> ${order.userEmail || 'Không có'}</p>
      </div>
      <div class="info-box">
        <h3>📦 Địa chỉ giao hàng</h3>
        <p>${order.shippingFullAddress || 'Không có thông tin địa chỉ'}</p>
      </div>
    </div>
    
    <!-- Order Details -->
    <div class="order-details">
      <div class="order-details-grid">
        <div class="order-detail-item">
          <div class="label">Mã đơn hàng</div>
          <div class="value">${order.orderNumber || 'N/A'}</div>
        </div>
        <div class="order-detail-item">
          <div class="label">Ngày đặt hàng</div>
          <div class="value">${orderDate}</div>
        </div>
        <div class="order-detail-item">
          <div class="label">Trạng thái đơn</div>
          <div class="value">${orderStatus}</div>
        </div>
        <div class="order-detail-item">
          <div class="label">Thanh toán</div>
          <div class="value">${paymentStatus}</div>
        </div>
        <div class="order-detail-item">
          <div class="label">Phương thức</div>
          <div class="value">${paymentMethod}</div>
        </div>
        <div class="order-detail-item">
          <div class="label">Tổng SP</div>
          <div class="value">${order.items?.length || 0} sản phẩm</div>
        </div>
      </div>
    </div>
    
    <!-- Products Table -->
    <h3 class="section-title">📋 Chi tiết sản phẩm</h3>
    <table class="products-table">
      <thead>
        <tr>
          <th style="width: 50px; text-align: center;">STT</th>
          <th>Tên sản phẩm</th>
          <th style="width: 100px; text-align: center;">Mã SP</th>
          <th style="width: 60px; text-align: center;">SL</th>
          <th style="width: 120px; text-align: right;">Đơn giá</th>
          <th style="width: 130px; text-align: right;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
    
    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-box">
        <table>
          <tr>
            <td>Tạm tính:</td>
            <td style="text-align: right; font-weight: 500;">${this.formatCurrency(order.subTotal || 0)}</td>
          </tr>
          <tr>
            <td>Phí vận chuyển:</td>
            <td style="text-align: right; font-weight: 500;">${this.formatCurrency(order.shippingAmount || 0)}</td>
          </tr>
          <tr>
            <td>Thuế:</td>
            <td style="text-align: right; font-weight: 500;">${this.formatCurrency(order.taxAmount || 0)}</td>
          </tr>
          ${discountRow}
          <tr class="total-row">
            <td>TỔNG CỘNG:</td>
            <td style="text-align: right;">${this.formatCurrency(order.totalAmount || 0)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    ${order.notes
                ? `
    <!-- Notes -->
    <div class="notes-section">
      <h4>📝 Ghi chú đơn hàng</h4>
      <p>${order.notes}</p>
    </div>
    `
                : ''
            }
    
    <!-- Footer -->
    <div class="invoice-footer">
      <p class="thank-you">🙏 Cảm ơn Quý khách đã mua hàng tại GroceryMart!</p>
      <p>Mọi thắc mắc xin liên hệ: <strong>(0367) 111 302</strong> | Email: <strong>support@grocerymart.com</strong></p>
      <p style="margin-top: 10px; font-style: italic;">Hóa đơn được xuất tự động bởi hệ thống GroceryMart</p>
    </div>
  </div>
</body>
</html>
    `;
    }

    /**
     * Format ngày tháng cho hiển thị
     */
    private formatDate(date?: Date | string | null): string {
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

    /**
     * Format số tiền
     */
    private formatCurrency(amount: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    }
}
