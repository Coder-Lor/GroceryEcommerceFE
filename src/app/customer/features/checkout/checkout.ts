import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { CartService, CartItemViewModel } from '@core/service/cart.service';
import { OrderService } from '@core/service/order.service';
import { AuthService } from '@core/service/auth.service';
import { UserAddressClient, UserAddress, PagedRequest, GiftCardClient, GiftCardDto, SortDirection } from '@core/service/system-admin.service';
import { UserService } from '@core/service/user.service';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, take, catchError } from 'rxjs/operators';

interface CheckoutProduct {
  productId: string;
  productVariantId: string;
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
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
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
  private userService = inject(UserService);
  private giftCardClient = inject(GiftCardClient);

  checkoutForm: FormGroup;
  products: CheckoutProduct[] = [];
  checkoutMode: 'cart' | 'single' = 'cart';
  shippingFee = 0;
  isProcessing = false;

  // Address management
  userAddresses: UserAddress[] = [];
  selectedAddress: UserAddress | null = null;
  showAddressModal = false;
  showTemporaryAddressModal = false;
  temporaryAddress: TemporaryAddress | null = null;
  temporaryAddressForm: FormGroup;

  // User info for display
  userFullName: string = '';
  userPhone: string = '';

  // Voucher management
  availableVouchers: GiftCardDto[] = [];
  selectedVoucher: GiftCardDto | null = null;
  voucherCode: string = '';
  voucherError: string = '';
  voucherSuccess: string = '';
  isApplyingVoucher = false;
  showVoucherModal = false;

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
      const productFromState = state.product;
      this.products = [{
        productId: productFromState.productId,
        productVariantId: productFromState.productVariantId ?? productFromState.variantId,
        productName: productFromState.productName,
        imageUrl: productFromState.imageUrl,
        unitPrice: productFromState.unitPrice,
        quantity: productFromState.quantity
      }];
      console.log('✅ Checkout mode: Single product', this.products[0]);
    }
  }

  ngOnInit(): void {
    // Load user info and set default values in form
    this.loadUserInfoAndAddresses();
    // Làm mới giỏ hàng từ backend để đảm bảo có đủ thông tin biến thể
    this.cartService.loadCartSummary();
    // Load available vouchers
    this.loadAvailableVouchers();

    // Nếu không có state (checkout từ cart), load từ cartService
    if (this.checkoutMode === 'cart') {
      this.cartService.cartItems$.subscribe(items => {
        this.products = items.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId,
          productName: item.productName,
          imageUrl: item.imageUrl,
          unitPrice: item.unitPrice,
          quantity: item.quantity
        }));
        console.log('✅ Checkout mode: Cart', this.products.length, 'items');
      });
    }
  }

  loadUserInfoAndAddresses(): void {
    this.authService.currentUser.pipe(
      take(1),
      switchMap(user => {
        if (!user?.id) {
          console.warn('⚠️ No user logged in');
          return of({ userInfo: null, addresses: null });
        }

        console.log('🔍 Loading user info for userId:', user.id);

        // Fetch both user info and addresses in parallel
        const request = new PagedRequest({
          page: 1,
          pageSize: 100
        });

        // Convert callback-based API to Observable
        const userInfo$ = new Observable<any>(observer => {
          this.userService.getById(
            user.id,
            (result) => {
              if (result.isSuccess && result.data) {
                observer.next(result.data);
              } else {
                observer.next(null);
              }
              observer.complete();
            },
            (error) => {
              console.error('❌ Failed to load user info:', error);
              observer.next(null);
              observer.complete();
            }
          );
        });

        const addresses$ = this.userAddressClient.getByUser(user.id, request).pipe(
          catchError(err => {
            console.error('❌ Failed to load addresses:', err);
            return of(null);
          })
        );

        return forkJoin({
          userInfo: userInfo$,
          addresses: addresses$
        });
      })
    ).subscribe({
      next: (result) => {
        console.log('✅ Loaded data:', result);

        // Process user info
        if (result.userInfo) {
          const user = result.userInfo;
          this.userFullName = user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`.trim()
            : user.firstName || user.lastName || '';
          this.userPhone = user.phoneNumber || '';

          console.log('👤 Setting default user info - Name:', this.userFullName, 'Phone:', this.userPhone);

          // Set default user info in form
          this.checkoutForm.patchValue({
            fullName: this.userFullName,
            phone: this.userPhone
          });
        }

        // Process addresses
        if (result.addresses?.isSuccess && result.addresses.data?.items) {
          this.userAddresses = result.addresses.data.items;

          // Set default address as selected
          const defaultAddr = this.userAddresses.find(a => a.isDefault);
          if (defaultAddr) {
            console.log('✅ Found default address:', defaultAddr);
            this.selectedAddress = defaultAddr;
            this.updateFormWithAddress(defaultAddr);
          } else if (this.userAddresses.length > 0) {
            console.log('✅ Using first address:', this.userAddresses[0]);
            this.selectedAddress = this.userAddresses[0];
            this.updateFormWithAddress(this.userAddresses[0]);
          } else {
            console.warn('⚠️ No user addresses found');
          }

          console.log('✅ Loaded user addresses:', this.userAddresses.length);
        }

        console.log('📍 Selected address:', this.selectedAddress);
        console.log('📝 Form after loading:', this.checkoutForm.value);
        console.log('✅ Form valid:', this.checkoutForm.valid);
      },
      error: (err) => {
        console.error('❌ Failed to load user data:', err);
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

    // Get current form values for name and phone (keep user's default info)
    const currentFullName = this.checkoutForm.get('fullName')?.value;
    const currentPhone = this.checkoutForm.get('phone')?.value;

    // Update form - keep current name and phone if already set, otherwise use from address
    this.checkoutForm.patchValue({
      fullName: currentFullName || (address.user?.firstName && address.user?.lastName
        ? `${address.user.firstName} ${address.user.lastName}`
        : ''),
      phone: currentPhone || address.user?.phoneNumber || '',
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
    console.log('📍 Selecting address:', address);
    this.selectedAddress = address;
    this.temporaryAddress = null; // Clear temporary address if any
    this.updateFormWithAddress(address);
    console.log('✅ Form updated with address:', this.checkoutForm.value);
    console.log('✅ Form valid after address selection:', this.checkoutForm.valid);
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
    console.log('💾 Saving temporary address...');

    if (this.temporaryAddressForm.invalid) {
      console.warn('⚠️ Temporary address form is invalid');
      Object.keys(this.temporaryAddressForm.controls).forEach(key => {
        this.temporaryAddressForm.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.temporaryAddressForm.value;
    console.log('📝 Temporary address form value:', formValue);

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

    console.log('✅ Checkout form updated:', this.checkoutForm.value);
    console.log('✅ Checkout form valid:', this.checkoutForm.valid);

    // Clear selected address since we're using temporary
    this.selectedAddress = null;

    this.closeTemporaryAddressModal();
    console.log('✅ Using temporary address for this order only');
  }

  get subtotal() {
    return this.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
  }

  get discountAmount() {
    if (!this.selectedVoucher || !this.selectedVoucher.currentBalance) {
      return 0;
    }
    // Giảm giá tối đa bằng số dư voucher hoặc tổng tiền hàng (không giảm quá tổng tiền)
    return Math.min(this.selectedVoucher.currentBalance, this.subtotal);
  }

  get totalPrice() {
    return Math.max(0, this.subtotal + this.shippingFee - this.discountAmount);
  }

  // Voucher methods
  loadAvailableVouchers(): void {
    this.giftCardClient.getPaging(1, 50, null, null, SortDirection.Descending, [], null, null, false, false, false)
      .pipe(catchError(err => {
        console.error('❌ Failed to load vouchers:', err);
        return of(null);
      }))
      .subscribe(response => {
        if (response?.isSuccess && response.data?.items) {
          // Lọc chỉ lấy các voucher còn hạn và còn số dư
          const now = new Date();
          this.availableVouchers = response.data.items.filter(v =>
            v.isValid &&
            v.currentBalance && v.currentBalance > 0 &&
            v.validFrom && new Date(v.validFrom) <= now &&
            v.validTo && new Date(v.validTo) >= now
          );
          console.log('✅ Loaded available vouchers:', this.availableVouchers.length);
        }
      });
  }

  applyVoucherCode(): void {
    if (!this.voucherCode.trim()) {
      this.voucherError = 'Vui lòng nhập mã voucher';
      return;
    }

    this.isApplyingVoucher = true;
    this.voucherError = '';
    this.voucherSuccess = '';

    this.giftCardClient.getByCode(this.voucherCode.trim())
      .pipe(catchError(err => {
        console.error('❌ Failed to get voucher by code:', err);
        return of(null);
      }))
      .subscribe(response => {
        this.isApplyingVoucher = false;

        if (response?.isSuccess && response.data) {
          const voucher = response.data;
          const now = new Date();

          // Validate voucher
          if (!voucher.isValid) {
            this.voucherError = voucher.validationMessage || 'Mã voucher không hợp lệ';
            return;
          }

          if (!voucher.currentBalance || voucher.currentBalance <= 0) {
            this.voucherError = 'Mã voucher đã hết số dư';
            return;
          }

          if (voucher.validFrom && new Date(voucher.validFrom) > now) {
            this.voucherError = 'Mã voucher chưa đến thời gian sử dụng';
            return;
          }

          if (voucher.validTo && new Date(voucher.validTo) < now) {
            this.voucherError = 'Mã voucher đã hết hạn';
            return;
          }

          // Apply voucher
          this.selectedVoucher = voucher;
          this.voucherSuccess = `Áp dụng thành công! Giảm ${this.formatCurrency(this.discountAmount)}`;
          console.log('✅ Voucher applied:', voucher);
        } else {
          this.voucherError = 'Mã voucher không tồn tại';
        }
      });
  }

  selectVoucher(voucher: GiftCardDto): void {
    this.selectedVoucher = voucher;
    this.voucherCode = voucher.code || '';
    this.voucherError = '';
    this.voucherSuccess = `Áp dụng thành công! Giảm ${this.formatCurrency(this.discountAmount)}`;
    this.closeVoucherModal();
    console.log('✅ Voucher selected:', voucher);
  }

  removeVoucher(): void {
    this.selectedVoucher = null;
    this.voucherCode = '';
    this.voucherError = '';
    this.voucherSuccess = '';
    console.log('✅ Voucher removed');
  }

  openVoucherModal(): void {
    this.showVoucherModal = true;
  }

  closeVoucherModal(): void {
    this.showVoucherModal = false;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
    console.log('🔔 placeOrder() called');
    console.log('📋 Form valid:', this.checkoutForm.valid);
    console.log('📋 Form value:', this.checkoutForm.value);
    console.log('📦 Products:', this.products);
    console.log('📍 Selected address:', this.selectedAddress);
    console.log('📍 Temporary address:', this.temporaryAddress);

    if (this.checkoutForm.invalid) {
      console.warn('⚠️ Form is invalid');
      const invalidFields: string[] = [];
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        console.log(`Field ${key}: valid=${control?.valid}, value=${control?.value}, errors=`, control?.errors);
        if (control?.invalid) {
          invalidFields.push(key);
        }
        this.checkoutForm.get(key)?.markAsTouched();
      });

      alert(`⚠️ Vui lòng điền đầy đủ thông tin:\n${invalidFields.join(', ')}`);
      return;
    }

    if (this.isProcessing) {
      console.warn('⚠️ Already processing');
      return;
    }

    const paymentMethod = this.checkoutForm.get('paymentMethod')?.value as 'cod' | 'banking';
    console.log('💳 Payment method:', paymentMethod);

    if (paymentMethod === 'cod' || paymentMethod === 'banking') {
      console.log('✅ Processing order with method:', paymentMethod);
      this.processOrder(paymentMethod);
    } else {
      console.warn('⚠️ Payment method not supported:', paymentMethod);
      alert('Phuong thuc thanh toan nay chua duoc ho tro. Vui long chon COD hoac chuyen khoan.');
    }
  }

  private processOrder(paymentMethod: 'cod' | 'banking') {
    console.log('🚀 processOrder() started');

    if (this.checkoutForm.invalid) {
      console.error('❌ Form validation failed in processOrder');
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    console.log('📝 Getting current user...');
    // Lấy userId từ authService
    this.authService.currentUser.pipe(
      take(1),
      switchMap(user => {
        console.log('👤 Current user:', user);

        if (!user?.id) {
          console.error('❌ User not logged in, redirecting to login');
          // Nếu chưa đăng nhập, chuyển đến trang login
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/checkout' }
          });
          return of(null);
        }

        console.log('✅ User logged in, userId:', user.id);
        this.isProcessing = true;

        const formValue = this.checkoutForm.value;
        console.log('📝 Form values:', formValue);
        const selectedPaymentMethod = paymentMethod || 'cod';

        // Chuẩn bị dữ liệu đơn hàng với đầy đủ thông tin
        const orderRequest = {
          userId: user.id,
          items: this.products.map(p => ({
            productId: p.productId,
            productVariantId: p.productVariantId,
            quantity: p.quantity,
            unitPrice: p.unitPrice
          })),
          shippingAddress: {
            fullName: formValue.fullName,
            phone: formValue.phone,
            address: formValue.address
          },
          paymentMethod: selectedPaymentMethod,
          subtotal: this.subtotal,
          shippingFee: this.shippingFee,
          taxAmount: 0,
          discountAmount: this.discountAmount,
          couponCode: this.selectedVoucher?.code || undefined,
          notes: undefined
        };
        console.log('📝 Order request prepared:', orderRequest.items);
        console.log('🎫 Voucher applied:', this.selectedVoucher?.code, 'Discount:', this.discountAmount);

        console.log('📦 Submitting order...', JSON.stringify(orderRequest, null, 2));

        return this.orderService.createOrder(orderRequest).pipe(
          switchMap((response) => {
            console.log('✅ Order created successfully:', JSON.stringify(response, null, 2));
            console.log('✅ Response data:', response);
            this.isProcessing = false;

            // Tính ngày dự kiến giao hàng
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() + 2);
            const orderData = response.data;
            const orderInfo = {
              orderId: orderData?.orderId || orderData?.orderNumber || 'Đang cập nhật',
              orderNumber: orderData?.orderNumber || 'Đang cập nhật',
              orderDate: orderData?.orderDate ? new Date(orderData.orderDate) : new Date(),
              expectedDate: expectedDate.toLocaleDateString('vi-VN'),
              total: orderData?.totalAmount ?? this.totalPrice,
              items: this.products,
              paymentMethod: selectedPaymentMethod,
              paymentMethodName: orderData?.paymentMethodName,
              paymentStatusName: orderData?.paymentStatusName,
              paymentStatus: orderData?.paymentStatus,
              qrCodeUrl: orderData?.qrCodeUrl,
              paymentUrl: orderData?.paymentUrl,
              paymentTransactionId: orderData?.paymentTransactionId
            };

            const navigateAfterCreate = () => {
              if (selectedPaymentMethod === 'banking') {
                this.router.navigate(['/payment-pending'], {
                  state: {
                    orderInfo
                  }
                });
              } else {
                this.router.navigate(['/order-result'], {
                  state: {
                    success: true,
                    orderInfo
                  }
                });
              }
            };

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
                  navigateAfterCreate();

                  return of(null);
                }),
                catchError((clearErr) => {
                  console.error('❌ Error clearing cart:', clearErr);
                  // Vẫn navigate ngay cả khi xóa giỏ hàng thất bại
                  navigateAfterCreate();
                  return of(null);
                })
              );
            } else {
              // Checkout single product, không cần xóa cart
              navigateAfterCreate();
              return of(null);
            }
          }),
          catchError((err) => {
            console.error('❌ Order creation failed:', err);
            console.error('❌ Error details:', JSON.stringify(err, null, 2));
            console.error('❌ Error status:', err?.status);
            console.error('❌ Error message:', err?.error || err?.message);
            this.isProcessing = false;

            // Lấy error message từ backend response
            let errorMessage = 'Đã có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại sau.';
            if (err?.error?.errorMessage) {
              errorMessage = err.error.errorMessage;
            } else if (err?.error?.message) {
              errorMessage = err.error.message;
            } else if (err?.message) {
              errorMessage = err.message;
            }

            // Navigate đến trang kết quả thất bại
            this.router.navigate(['/order-result'], {
              state: {
                success: false,
                errorMessage: errorMessage
              }
            });
            return of(null);
          })
        );
      })
    ).subscribe();
  }
}
