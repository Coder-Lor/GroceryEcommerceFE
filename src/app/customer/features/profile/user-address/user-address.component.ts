import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/service/auth.service';
import {
  UserAddressClient,
  UserAddress,
  PagedRequest,
  CreateUserAddressCommand,
  UpdateUserAddressCommand,
} from '../../../../core/service/system-admin.service';
import { AddressFormModalComponent } from './address-form-modal/address-form-modal.component';
import { finalize } from 'rxjs';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-user-address',
  standalone: true,
  imports: [
    CommonModule,
    AddressFormModalComponent,
    CardModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-address.component.html',
  styleUrl: './user-address.component.scss',
})
export class UserAddressComponent implements OnInit {
  private authService = inject(AuthService);
  private userAddressClient = inject(UserAddressClient);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  addresses: UserAddress[] = [];
  isLoading = false;
  isModalOpen = false;
  selectedAddress: UserAddress | null = null;

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng đăng nhập để xem địa chỉ',
      });
      return;
    }

    this.isLoading = true;
    const pageRequest = new PagedRequest({
      page: 1,
      pageSize: 100,
    });

    this.userAddressClient
      .getByUser(userId, pageRequest)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (result) => {
          if (result.isSuccess && result.data?.items) {
            this.addresses = result.data.items;
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: result.errorMessage || 'Không thể tải danh sách địa chỉ',
            });
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi tải danh sách địa chỉ',
          });
        },
      });
  }

  addNewAddress() {
    this.selectedAddress = null;
    this.isModalOpen = true;
  }

  editAddress(address: UserAddress) {
    this.selectedAddress = address;
    this.isModalOpen = true;
  }

  deleteAddress(address: UserAddress) {
    if (!address.addressId) return;

    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isLoading = true;
        this.userAddressClient
          .delete(address.addressId!)
          .pipe(finalize(() => (this.isLoading = false)))
          .subscribe({
            next: (result) => {
              if (result.isSuccess) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Xóa địa chỉ thành công',
                });
                this.loadAddresses();
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: result.errorMessage || 'Xóa địa chỉ thất bại',
                });
              }
            },
            error: (err) => {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi xóa địa chỉ',
              });
            },
          });
      },
    });
  }

  setDefaultAddress(address: UserAddress) {
    const userId = this.authService.currentUserValue?.id;
    if (!userId || !address.addressId) return;

    this.isLoading = true;
    this.userAddressClient
      .setDefault(userId, address.addressId)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Đã đặt địa chỉ mặc định',
            });
            this.loadAddresses();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: result.errorMessage || 'Đặt địa chỉ mặc định thất bại',
            });
          }
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi đặt địa chỉ mặc định',
          });
        },
      });
  }

  onCloseModal() {
    this.isModalOpen = false;
    this.selectedAddress = null;
  }

  onSaveAddress(formData: any) {
    const userId = this.authService.currentUserValue?.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng đăng nhập',
      });
      return;
    }

    this.isLoading = true;

    if (this.selectedAddress && formData.addressId) {
      // Update existing address
      const updateCommand = new UpdateUserAddressCommand({
        addressId: formData.addressId,
        userId: userId,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.zipCode, // Form uses zipCode, API expects postalCode
        addressType: formData.addressType,
        isDefault: formData.isDefault,
      });

      this.userAddressClient
        .update(updateCommand)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (result) => {
            if (result.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật địa chỉ thành công',
              });
              this.onCloseModal();
              this.loadAddresses();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: result.errorMessage || 'Cập nhật địa chỉ thất bại',
              });
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Có lỗi xảy ra khi cập nhật địa chỉ',
            });
          },
        });
    } else {
      // Create new address
      const createCommand = new CreateUserAddressCommand({
        userId: userId,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.zipCode, // Form uses zipCode, API expects postalCode
        addressType: formData.addressType,
        isDefault: formData.isDefault,
      });

      this.userAddressClient
        .create(createCommand)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: (result) => {
            if (result.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Thêm địa chỉ mới thành công',
              });
              this.onCloseModal();
              this.loadAddresses();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: result.errorMessage || 'Thêm địa chỉ thất bại',
              });
            }
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Có lỗi xảy ra khi thêm địa chỉ',
            });
          },
        });
    }
  }
}
