import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItemViewModel } from '@core/service/cart.service';
import { OrderService } from '@core/service/order.service';
import { AuthService } from '@core/service/auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';

interface CheckoutProduct {
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  checkoutForm: FormGroup;
  products: CheckoutProduct[] = [];
  checkoutMode: 'cart' | 'single' = 'cart';
  shippingFee = 30000;
  isProcessing = false;

  constructor() {
    this.checkoutForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: ['', Validators.required],
      paymentMethod: ['cod'],
    });

    // Kiểm tra navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as any;
    
    if (state?.checkoutMode === 'single' && state?.product) {
      // Checkout từ product-detail
      this.checkoutMode = 'single';
      this.products = [state.product];
      console.log('✅ Checkout mode: Single product', this.products[0]);
    }
  }

  ngOnInit(): void {
    // Nếu không có state (checkout từ cart), load từ cartService
    if (this.checkoutMode === 'cart') {
      this.cartService.cartItems$.subscribe(items => {
        this.products = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        }));
        console.log('✅ Checkout mode: Cart', this.products.length, 'items');
      });
    }
  }

  get subtotal() {
    return this.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  }

  get totalPrice() {
    return this.subtotal + this.shippingFee;
  }

  placeOrder() {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (this.isProcessing) return;

    const paymentMethod = this.checkoutForm.get('paymentMethod')?.value;

    // Chỉ xử lý thanh toán COD
    if (paymentMethod === 'cod') {
      this.processOrder();
    } else {
      // TODO: Xử lý thanh toán online khác
      alert('Phương thức thanh toán này chưa được hỗ trợ. Vui lòng chọn COD.');
    }
  }

  private processOrder() {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Lấy userId từ authService
    this.authService.currentUser.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          // Nếu chưa đăng nhập, chuyển đến trang login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/checkout' }
          });
          return of(null);
        }

        this.isProcessing = true;

        const formValue = this.checkoutForm.value;
        
        // Chuẩn bị dữ liệu đơn hàng với đầy đủ thông tin
        const orderRequest = {
          userId: user.id,
          items: this.products.map(p => ({
            productId: p.productId,
            productVariantId: undefined, // Có thể thêm sau nếu cần
            quantity: p.quantity,
            unitPrice: p.unitPrice
          })),
          shippingAddress: {
            fullName: formValue.fullName,
            phone: formValue.phone,
            address: formValue.address
          },
          paymentMethod: formValue.paymentMethod || 'cod',
          subtotal: this.subtotal,
          shippingFee: this.shippingFee,
          taxAmount: 0,
          discountAmount: 0,
          notes: undefined
        };

        console.log('📦 Submitting order...', orderRequest);

        return this.orderService.createOrder(orderRequest).pipe(
          switchMap((response) => {
            console.log('✅ Order created successfully:', response);
            this.isProcessing = false;

            // Tính ngày dự kiến giao hàng
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + 2);

            // Nếu checkout từ cart, xóa giỏ hàng sau khi tạo order thành công
            if (this.checkoutMode === 'cart') {
              return this.cartService.clearCart().pipe(
                switchMap((clearResult) => {
                  if (clearResult?.isSuccess) {
                    console.log('✅ Cart cleared after order creation');
                  } else {
                    console.warn('⚠️ Cart clear may have failed, but order was created');
                  }
                  
                  // Navigate đến trang kết quả thành công
                  this.router.navigate(['/order-result'], {
                    state: {
                      success: true,
                      orderInfo: {
                        orderId: response.data?.orderId || response.data?.orderNumber || 'Đang cập nhật',
                        orderNumber: response.data?.orderNumber || 'Đang cập nhật',
                        orderDate: new Date(),
                        expectedDate: expectedDate.toLocaleDateString('vi-VN'),
                        total: this.totalPrice,
                        items: this.products
                      }
                    }
                  });
                  
                  return of(null);
                }),
                catchError((clearErr) => {
                  console.error('❌ Error clearing cart:', clearErr);
                  // Vẫn navigate ngay cả khi xóa giỏ hàng thất bại
                  this.router.navigate(['/order-result'], {
                    state: {
                      success: true,
                      orderInfo: {
                        orderId: response.data?.orderId || response.data?.orderNumber || 'Đang cập nhật',
                        orderNumber: response.data?.orderNumber || 'Đang cập nhật',
                        orderDate: new Date(),
                        expectedDate: expectedDate.toLocaleDateString('vi-VN'),
                        total: this.totalPrice,
                        items: this.products
                      }
                    }
                  });
                  return of(null);
                })
              );
            } else {
              // Checkout single product, không cần xóa cart
              this.router.navigate(['/order-result'], {
                state: {
                  success: true,
                  orderInfo: {
                    orderId: response.data?.orderId || response.data?.orderNumber || 'Đang cập nhật',
                    orderNumber: response.data?.orderNumber || 'Đang cập nhật',
                    orderDate: new Date(),
                    expectedDate: expectedDate.toLocaleDateString('vi-VN'),
                    total: this.totalPrice,
                    items: this.products
                  }
                }
              });
              return of(null);
            }
          }),
          catchError((err) => {
            console.error('❌ Order creation failed:', err);
            this.isProcessing = false;

            // Navigate đến trang kết quả thất bại
            this.router.navigate(['/order-result'], {
              state: {
                success: false,
                errorMessage: err?.message || 'Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.'
              }
            });
            return of(null);
          })
        );
      })
    ).subscribe();
  }
}
