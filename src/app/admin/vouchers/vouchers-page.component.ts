import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { LoadingOverlayComponent } from '../layout/loading-overlay/loading-overlay.component';
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faGift,
  faTicket,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import {
  GiftCardClient,
  CouponUsageClient,
  GiftCardDto,
  CouponUsageDto,
  CreateGiftCardCommand,
  UpdateGiftCardCommand,
  CreateCouponUsageCommand,
  ResultOfGiftCardDto,
  ResultOfCouponUsageDto,
  ResultOfBoolean,
  SortDirection,
} from '../../core/service/system-admin.service';
import { Subject, takeUntil } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-vouchers-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FaIconComponent,
    ToastModule,
    ConfirmDialogModule,
    LoadingOverlayComponent,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './vouchers-page.component.html',
  styleUrls: ['./vouchers-page.component.scss'],
})
export class VouchersPageComponent implements OnInit, OnDestroy {
  private giftCardClient: GiftCardClient = inject(GiftCardClient);
  private couponUsageClient: CouponUsageClient = inject(CouponUsageClient);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  activeTab: 'giftcards' | 'coupons' = 'giftcards';

  // Gift Cards
  giftCards: GiftCardDto[] = [];
  filteredGiftCards: GiftCardDto[] = [];
  giftCardSearchTerm: string = '';
  isLoadingGiftCards: boolean = false;

  // Coupon Usage
  couponUsages: CouponUsageDto[] = [];
  filteredCouponUsages: CouponUsageDto[] = [];
  couponUsageSearchTerm: string = '';
  isLoadingCouponUsages: boolean = false;

  // Modals
  showGiftCardModal: boolean = false;
  showCouponUsageModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';

  // Gift Card Form
  currentGiftCard: CreateGiftCardCommand | UpdateGiftCardCommand = this.getEmptyGiftCard();
  selectedGiftCard: GiftCardDto | null = null;

  // Coupon Usage Form
  currentCouponUsage: CreateCouponUsageCommand = this.getEmptyCouponUsage();
  selectedCouponUsage: CouponUsageDto | null = null;

  private destroy$ = new Subject<void>();

  // Icons
  faPlus = faPlus;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faGift = faGift;
  faTicket = faTicket;
  faDownload = faDownload;

  ngOnInit(): void {
    this.loadGiftCards();
  }

  loadGiftCards(): void {
    this.isLoadingGiftCards = true;
    this.giftCardClient
      .getPaging(1, 100, null, null, SortDirection.Descending, [], null, null, false, false, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoadingGiftCards = false;
          if (response.isSuccess && response.data) {
            this.giftCards = response.data.items || [];
            this.filteredGiftCards = [...this.giftCards];
          }
        },
        error: (error) => {
          this.isLoadingGiftCards = false;
          console.error('Error loading gift cards:', error);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Gift Card Methods
  getEmptyGiftCard(): CreateGiftCardCommand {
    const command = new CreateGiftCardCommand();
    command.name = '';
    command.description = '';
    command.initialAmount = 0;
    command.validFrom = new Date();
    command.validTo = new Date();
    return command;
  }

  openAddGiftCardModal(): void {
    this.modalMode = 'add';
    this.currentGiftCard = this.getEmptyGiftCard();
    this.selectedGiftCard = null;
    this.showGiftCardModal = true;
  }

  openEditGiftCardModal(giftCard: GiftCardDto): void {
    this.modalMode = 'edit';
    this.selectedGiftCard = giftCard;
    const command = new UpdateGiftCardCommand();
    command.name = giftCard.name;
    command.description = giftCard.description;
    command.initialAmount = giftCard.initialAmount;
    command.validFrom = giftCard.validFrom ? new Date(giftCard.validFrom) : new Date();
    command.validTo = giftCard.validTo ? new Date(giftCard.validTo) : new Date();
    this.currentGiftCard = command;
    this.showGiftCardModal = true;
  }

  closeGiftCardModal(): void {
    this.showGiftCardModal = false;
    this.currentGiftCard = this.getEmptyGiftCard();
    this.selectedGiftCard = null;
  }

  saveGiftCard(): void {
    if (!this.validateGiftCard()) {
      return;
    }

    this.isLoadingGiftCards = true;
    const command = { ...this.currentGiftCard };

    if (this.modalMode === 'add') {
      this.giftCardClient
        .create(command as CreateGiftCardCommand)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ResultOfGiftCardDto) => {
            this.isLoadingGiftCards = false;
            if (response.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Tạo thẻ quà tặng thành công!',
              });
              this.closeGiftCardModal();
              this.loadGiftCards();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: response.errorMessage || 'Không thể tạo thẻ quà tặng',
              });
            }
          },
          error: (error) => {
            this.isLoadingGiftCards = false;
            console.error('Error creating gift card:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Có lỗi xảy ra khi tạo thẻ quà tặng',
            });
          },
        });
    } else {
      if (!this.selectedGiftCard?.giftCardId) {
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không tìm thấy ID thẻ quà tặng',
        });
        return;
      }

      const updateCommand = new UpdateGiftCardCommand();
      updateCommand.giftCardId = this.selectedGiftCard.giftCardId;
      updateCommand.name = command.name;
      updateCommand.description = command.description;
      updateCommand.initialAmount = command.initialAmount;
      updateCommand.validFrom = command.validFrom;
      updateCommand.validTo = command.validTo;

      this.giftCardClient
        .update(updateCommand)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ResultOfGiftCardDto) => {
            this.isLoadingGiftCards = false;
            if (response.isSuccess) {
              this.messageService.add({
                severity: 'success',
                summary: 'Thành công',
                detail: 'Cập nhật thẻ quà tặng thành công!',
              });
              this.closeGiftCardModal();
              this.loadGiftCards();
            } else {
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: response.errorMessage || 'Không thể cập nhật thẻ quà tặng',
              });
            }
          },
          error: (error) => {
            this.isLoadingGiftCards = false;
            console.error('Error updating gift card:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Có lỗi xảy ra khi cập nhật thẻ quà tặng',
            });
          },
        });
    }
  }

  deleteGiftCard(giftCard: GiftCardDto): void {
    if (!giftCard.giftCardId) return;

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa thẻ quà tặng "${giftCard.name || giftCard.code}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.isLoadingGiftCards = true;
        this.giftCardClient
          .delete(giftCard.giftCardId!)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response: ResultOfBoolean) => {
              this.isLoadingGiftCards = false;
              if (response.isSuccess) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Xóa thẻ quà tặng thành công!',
                });
                this.loadGiftCards();
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: response.errorMessage || 'Không thể xóa thẻ quà tặng',
                });
              }
            },
            error: (error) => {
              this.isLoadingGiftCards = false;
              console.error('Error deleting gift card:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Có lỗi xảy ra khi xóa thẻ quà tặng',
              });
            },
          });
      },
    });
  }

  validateGiftCard(): boolean {
    if (!this.currentGiftCard.name || this.currentGiftCard.name.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập tên thẻ quà tặng',
      });
      return false;
    }

    if (!this.currentGiftCard.initialAmount || this.currentGiftCard.initialAmount <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số tiền hợp lệ',
      });
      return false;
    }

    if (this.currentGiftCard.validTo && this.currentGiftCard.validFrom) {
      if (new Date(this.currentGiftCard.validTo) < new Date(this.currentGiftCard.validFrom)) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Ngày kết thúc phải sau ngày bắt đầu',
        });
        return false;
      }
    }

    return true;
  }

  // Coupon Usage Methods
  getEmptyCouponUsage(): CreateCouponUsageCommand {
    const command = new CreateCouponUsageCommand();
    command.couponId = '';
    command.userId = '';
    command.orderId = '';
    command.orderAmount = 0;
    command.discountAmount = 0;
    return command;
  }

  openAddCouponUsageModal(): void {
    this.modalMode = 'add';
    this.currentCouponUsage = this.getEmptyCouponUsage();
    this.selectedCouponUsage = null;
    this.showCouponUsageModal = true;
  }

  closeCouponUsageModal(): void {
    this.showCouponUsageModal = false;
    this.currentCouponUsage = this.getEmptyCouponUsage();
    this.selectedCouponUsage = null;
  }

  saveCouponUsage(): void {
    if (!this.validateCouponUsage()) {
      return;
    }

    this.isLoadingCouponUsages = true;
    const command = new CreateCouponUsageCommand();
    command.couponId = this.currentCouponUsage.couponId;
    command.userId = this.currentCouponUsage.userId;
    command.orderId = this.currentCouponUsage.orderId;
    command.orderAmount = this.currentCouponUsage.orderAmount;
    command.discountAmount = this.currentCouponUsage.discountAmount;

    this.couponUsageClient
      .create(command)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResultOfCouponUsageDto) => {
          this.isLoadingCouponUsages = false;
          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Tạo sử dụng coupon thành công!',
            });
            this.closeCouponUsageModal();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể tạo sử dụng coupon',
            });
          }
        },
        error: (error) => {
          this.isLoadingCouponUsages = false;
          console.error('Error creating coupon usage:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi tạo sử dụng coupon',
          });
        },
      });
  }

  validateCouponUsage(): boolean {
    if (!this.currentCouponUsage.couponId || this.currentCouponUsage.couponId.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập ID coupon',
      });
      return false;
    }

    if (!this.currentCouponUsage.userId || this.currentCouponUsage.userId.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập ID người dùng',
      });
      return false;
    }

    if (!this.currentCouponUsage.discountAmount || this.currentCouponUsage.discountAmount <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số tiền giảm giá hợp lệ',
      });
      return false;
    }

    return true;
  }

  filterGiftCards(): void {
    // Implement filtering logic if needed
    this.filteredGiftCards = [...this.giftCards];
  }

  filterCouponUsages(): void {
    // Implement filtering logic if needed
    this.filteredCouponUsages = [...this.couponUsages];
  }

  // Date helper methods
  getDateString(date?: Date | string | null): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onValidFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.value) {
      this.currentGiftCard.validFrom = new Date(target.value);
    } else {
      this.currentGiftCard.validFrom = new Date();
    }
  }

  onValidToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.value) {
      this.currentGiftCard.validTo = new Date(target.value);
    } else {
      this.currentGiftCard.validTo = new Date();
    }
  }

  /**
   * Xuất báo cáo CSV cho Gift Cards
   */
  exportGiftCardsReport(): void {
    const csvContent = this.generateGiftCardsCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `giftcards_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Tạo nội dung CSV cho Gift Cards
   */
  private generateGiftCardsCSV(): string {
    const headers = [
      'Mã thẻ',
      'Tên',
      'Mô tả',
      'Số tiền ban đầu',
      'Số dư hiện tại',
      'Ngày hiệu lực',
      'Ngày hết hạn',
      'Trạng thái',
    ];
    const dataToExport = this.filteredGiftCards.length > 0 ? this.filteredGiftCards : this.giftCards;
    const rows = dataToExport.map((giftCard) => [
      this.escapeCSV(giftCard.code || ''),
      this.escapeCSV(giftCard.name || ''),
      this.escapeCSV(giftCard.description || ''),
      (giftCard.initialAmount || 0).toString(),
      (giftCard.currentBalance || 0).toString(),
      this.formatDateForCSV(giftCard.validFrom),
      this.formatDateForCSV(giftCard.validTo),
      giftCard.isValid ? 'Hoạt động' : 'Ngừng',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Xuất báo cáo CSV cho Coupon Usages
   */
  exportCouponUsagesReport(): void {
    const csvContent = this.generateCouponUsagesCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `coupon_usages_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Tạo nội dung CSV cho Coupon Usages
   */
  private generateCouponUsagesCSV(): string {
    const headers = [
      'ID Coupon',
      'ID Người dùng',
      'ID Đơn hàng',
      'Giá trị đơn hàng',
      'Số tiền giảm',
    ];
    const dataToExport = this.filteredCouponUsages.length > 0 ? this.filteredCouponUsages : this.couponUsages;
    const rows = dataToExport.map((coupon) => [
      this.escapeCSV(coupon.couponId || ''),
      this.escapeCSV(coupon.userId || ''),
      this.escapeCSV(coupon.orderId || ''),
      (coupon.orderAmount || 0).toString(),
      (coupon.discountAmount || 0).toString(),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Format date for CSV
   */
  private formatDateForCSV(date?: Date | string | null): string {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN');
  }
}

