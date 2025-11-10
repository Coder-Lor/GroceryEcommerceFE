# Checkout Feature - Implementation Guide

## 🎯 Tổng quan

Tính năng checkout đã được triển khai đầy đủ với các tính năng:
- ✅ Checkout từ giỏ hàng (nhiều sản phẩm)
- ✅ Checkout từ trang chi tiết sản phẩm (1 sản phẩm)
- ✅ Thanh toán COD (Cash on Delivery)
- ✅ Tích hợp API backend (PurchaseOrderClient)
- ✅ Trang hiển thị kết quả đặt hàng

## 📁 Cấu trúc Files

```
src/app/
├── customer/features/
│   ├── checkout/
│   │   ├── checkout.ts              # Logic checkout
│   │   ├── checkout.html            # Template checkout
│   │   └── checkout.scss            # Styles
│   │
│   └── order-result/
│       ├── order-result.ts          # Logic kết quả
│       ├── order-result.html        # Template kết quả
│       └── order-result.scss        # Styles kết quả
│
└── core/service/
    └── order.service.ts             # Service gọi API
```

## 🔄 Flow hoạt động

### 1️⃣ Checkout từ Cart (COD)
```
Cart Page
  ↓
Click "Tiến hành thanh toán"
  ↓
/checkout (load all items from CartService)
  ↓
Fill form (fullName, phone, address)
  ↓
Select payment = COD (default)
  ↓
Click "Đặt hàng"
  ↓
OrderService.createOrder()
  ↓
PurchaseOrderClient.createPurchaseOrder({
  expectedDate: today + 2 days,
  items: [{productId, unitCost, quantity}, ...]
})
  ↓
Success → /order-result (success state)
Error → /order-result (error state)
```

### 2️⃣ Checkout từ Product Detail (COD)
```
Product Detail Page
  ↓
Click "Thanh toán"
  ↓
/checkout (with router state: single product)
  ↓
Fill form
  ↓
Click "Đặt hàng"
  ↓
Same as above but with 1 item only
```

## 🛠️ API Integration

### OrderService (`order.service.ts`)

```typescript
createOrder(orderData: CreateOrderRequest): Observable<FileResponse>
```

**Input:**
```typescript
{
  items: [
    {
      productId: "abc123",
      quantity: 2,
      unitPrice: 50000
    }
  ]
}
```

**Process:**
1. Tính `expectedDate = new Date() + 2 days`
2. Map items to `CreatePurchaseOrderItemRequest[]`
3. Tạo `CreatePurchaseOrderCommand`
4. Gọi `PurchaseOrderClient.createPurchaseOrder()`

**Output:** `FileResponse` từ backend

### Backend API

**Endpoint:** `POST /api/PurchaseOrder`

**Request Body:**
```json
{
  "expectedDate": "2025-11-12T00:00:00Z",
  "items": [
    {
      "productId": "abc123",
      "unitCost": 50000,
      "quantity": 2
    }
  ]
}
```

## 🎨 UI Components

### Checkout Page
- Form nhập thông tin (họ tên, SĐT, địa chỉ)
- Chọn phương thức thanh toán (COD/Banking)
- Danh sách sản phẩm
- Tổng kết đơn hàng (tạm tính, phí ship, tổng)
- Nút "Đặt hàng" với loading state

### Order Result Page
**Success State:**
- ✅ Icon check màu xanh
- Thông tin đơn hàng:
  - Mã đơn hàng
  - Ngày đặt
  - Ngày giao dự kiến
  - Tổng tiền
- 2 buttons:
  - "Xem đơn hàng của tôi"
  - "Về trang chủ"

**Error State:**
- ❌ Icon X màu đỏ
- Thông báo lỗi
- 2 buttons:
  - "Về trang chủ"
  - "Quay lại giỏ hàng"

## 🧪 Testing Checklist

### ✅ Functional Testing

**Test 1: Checkout nhiều sản phẩm từ Cart**
- [ ] Add 3+ products to cart
- [ ] Go to /cart
- [ ] Click "Tiến hành thanh toán"
- [ ] Verify: All cart items displayed
- [ ] Fill form completely
- [ ] Select COD
- [ ] Click "Đặt hàng"
- [ ] Check console: API called with correct data
- [ ] Verify: Redirect to /order-result success

**Test 2: Checkout 1 sản phẩm từ Product Detail**
- [ ] Go to any product detail page
- [ ] Click "Thanh toán"
- [ ] Verify: Only 1 product in checkout
- [ ] Verify: Alert shows "Thanh toán nhanh 1 sản phẩm"
- [ ] Complete checkout
- [ ] Verify: Success page shows correct info

**Test 3: Form Validation**
- [ ] Go to checkout
- [ ] Click "Đặt hàng" without filling
- [ ] Verify: Error messages appear
- [ ] Enter phone with 9 digits
- [ ] Verify: Phone error "10-11 số"
- [ ] Fix all errors
- [ ] Verify: Form submits successfully

**Test 4: Error Handling**
- [ ] Stop backend server
- [ ] Try to checkout
- [ ] Verify: Error page displays
- [ ] Verify: Error message is clear
- [ ] Buttons work correctly

**Test 5: Loading State**
- [ ] Slow down network (DevTools → Network → Slow 3G)
- [ ] Click "Đặt hàng"
- [ ] Verify: Button shows spinner and "Đang xử lý..."
- [ ] Verify: Button is disabled during processing

## 📊 Data Models

### CheckoutProduct
```typescript
interface CheckoutProduct {
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}
```

### CreatePurchaseOrderCommand
```typescript
{
  expectedDate: Date;        // Ngày dự kiến giao hàng
  items: CreatePurchaseOrderItemRequest[];
}
```

### CreatePurchaseOrderItemRequest
```typescript
{
  productId: string;
  unitCost: number;          // Đơn giá
  quantity: number;          // Số lượng
}
```

## ⚙️ Configuration

### Phí vận chuyển
Hiện tại: **30,000₫** (cố định)

Thay đổi trong `checkout.ts`:
```typescript
shippingFee = 30000; // Đổi giá trị này
```

### Ngày giao hàng dự kiến
Hiện tại: **Ngày hiện tại + 2 ngày**

Thay đổi trong `order.service.ts`:
```typescript
expectedDate.setDate(expectedDate.getDate() + 2); // Đổi số 2
```

## 🚀 Future Enhancements

### TODO: Thanh toán Online
```typescript
// Trong checkout.ts
if (paymentMethod === 'banking') {
  // Redirect to payment gateway
  this.processOnlinePayment();
}
```

### TODO: Clear Cart sau khi đặt hàng
```typescript
// Trong checkout.ts, after success
if (this.checkoutMode === 'cart') {
  this.cartService.clearCart().subscribe();
}
```

### TODO: Email/SMS Confirmation
```typescript
// Gọi API gửi email/SMS
this.notificationService.sendOrderConfirmation({
  email: user.email,
  phone: this.checkoutForm.get('phone')?.value,
  orderId: response.orderId
});
```

### TODO: Phí ship động
```typescript
calculateShippingFee(address: string, subtotal: number): number {
  // Logic tính phí ship theo địa chỉ và tổng tiền
  if (subtotal >= 200000) return 0; // Free ship
  if (address.includes('Hà Nội')) return 25000;
  if (address.includes('TP.HCM')) return 25000;
  return 35000; // Tỉnh khác
}
```

## 🐛 Troubleshooting

### Issue: API returns error
**Solution:** Check console logs, verify backend is running

### Issue: Navigation state lost on refresh
**Solution:** This is expected. User must go through proper flow.

### Issue: Form không submit
**Solution:** Check validation errors, all required fields must be filled

### Issue: Products không hiển thị
**Solution:** 
- Checkout từ cart: Check CartService data
- Checkout từ product: Check navigation state

## 📝 Notes

- ✅ Hiện tại chỉ hỗ trợ COD
- ✅ ExpectedDate tự động tính = today + 2 days
- ⏳ Banking payment chưa implement
- ⏳ Clear cart after order chưa implement
- ⏳ Email/SMS notification chưa implement
