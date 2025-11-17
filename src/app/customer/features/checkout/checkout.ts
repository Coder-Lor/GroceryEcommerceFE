import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, CartItemViewModel } from '@core/service/cart.service';
import { OrderService } from '@core/service/order.service';
import { AuthService } from '@core/service/auth.service';
import { UserAddressClient, UserAddress, PagedRequest } from '@core/service/system-admin.service';
import { Observable, of } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';

interface CheckoutProduct {
  productId: string;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
}

interface TemporaryAddress {
  fullName: string;
  phone: string;
  address: string;
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
  private userAddressClient = inject(UserAddressClient);

  checkoutForm: FormGroup;
  products: CheckoutProduct[] = [];
  checkoutMode: 'cart' | 'single' = 'cart';
  shippingFee = 30000;
  isProcessing = false;

  // Address management
  userAddresses: UserAddress[] = [];
  selectedAddress: UserAddress | null = null;
  showAddressModal = false;
  showTemporaryAddressModal = false;
  temporaryAddress: TemporaryAddress | null = null;
  temporaryAddressForm: FormGroup;

  constructor() {
    this.checkoutForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: ['', Validators.required],
      paymentMethod: ['cod'],
    });

    this.temporaryAddressForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
      address: ['', Validators.required]
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
    // Load user addresses first
    this.loadUserAddresses();

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

  loadUserAddresses(): void {
    this.authService.currentUser.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          return of(null);
        }

        // Fetch user addresses
        const request = new PagedRequest({
          page: 1,
          pageSize: 100 // Get all addresses
        });

        return this.userAddressClient.getByUser(user.id, request);
      })
    ).subscribe({
      next: (response) => {
        if (response?.isSuccess && response.data?.items) {
          this.userAddresses = response.data.items;
          
          // Set default address as selected
          const defaultAddr = this.userAddresses.find(a => a.isDefault);
          if (defaultAddr) {
            this.selectedAddress = defaultAddr;
            this.updateFormWithAddress(defaultAddr);
          } else if (this.userAddresses.length > 0) {
            // If no default, select the first one
            this.selectedAddress = this.userAddresses[0];
            this.updateFormWithAddress(this.userAddresses[0]);
          }
          
          console.log('✅ Loaded user addresses:', this.userAddresses.length);
        }
      },
      error: (err) => {
        console.error('❌ Failed to load addresses:', err);
      }
    });
  }

  updateFormWithAddress(address: UserAddress): void {
    // Combine address fields for display
    const fullAddress = [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(', ');

    this.checkoutForm.patchValue({
      fullName: address.user?.firstName && address.user?.lastName 
        ? `${address.user.firstName} ${address.user.lastName}` 
        : '',
      phone: address.user?.phoneNumber || '',
      address: fullAddress
    });
  }

  openAddressModal(): void {
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
  }

  selectAddress(address: UserAddress): void {
    this.selectedAddress = address;
    this.temporaryAddress = null; // Clear temporary address if any
    this.updateFormWithAddress(address);
    this.closeAddressModal();
  }

  openTemporaryAddressModal(): void {
    this.temporaryAddressForm.reset();
    this.showTemporaryAddressModal = true;
  }

  closeTemporaryAddressModal(): void {
    this.showTemporaryAddressModal = false;
  }

  saveTemporaryAddress(): void {
    if (this.temporaryAddressForm.invalid) {
      Object.keys(this.temporaryAddressForm.controls).forEach(key => {
        this.temporaryAddressForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.temporaryAddressForm.value;
    this.temporaryAddress = {
      fullName: formValue.fullName,
      phone: formValue.phone,
      address: formValue.address
    };

    // Update main checkout form
    this.checkoutForm.patchValue({
      fullName: formValue.fullName,
      phone: formValue.phone,
      address: formValue.address
    });

    // Clear selected address since we're using temporary
    this.selectedAddress = null;
    
    this.closeTemporaryAddressModal();
    console.log('✅ Using temporary address for this order only');
  }

  get subtotal() {
    return this.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  }

  get totalPrice() {
    return this.subtotal + this.shippingFee;
  }

  getFullAddress(address: UserAddress | null): string {
    if (!address) return '';
    
    return [
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(', ');
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
