import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/service/auth.service';
import { UserService } from '../../../../core/service/user.service';
import { ResultOfUser, User, UpdateUserCommand, UserClient, ResultOfBoolean } from '../../../../core/service/system-admin.service';
import { Subject, takeUntil, take } from 'rxjs';
import { ProfileDataService } from '../profile-data.service';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    ButtonModule,
    DialogModule,
    MessageModule,
    ProgressSpinnerModule,
    TagModule,
    DividerModule,
    DatePickerModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss',
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading = false;
  errorMessage = '';
  displayEditDialog = false;
  currentUserId = '';

  userInfo = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    status: 0,
    emailVerified: false,
    phoneVerified: false
  };

  editForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: null as Date | null
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private profileDataService: ProfileDataService,
    private userClient: UserClient,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    console.log('🔵 PersonalInfo ngOnInit called');
    
    // Kiểm tra cache trước
    if (this.profileDataService.hasCache()) {
      console.log('📦 Using cached data from service');
      this.profileDataService.getUserInfo().pipe(take(1)).subscribe(cachedData => {
        if (cachedData) {
          this.userInfo = cachedData;
        }
      });
    } else {
      console.log('📡 No cache - loading data');
      this.loadUserInfo();
    }
  }

  ngOnDestroy(): void {
    console.log('🔴 PersonalInfo ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserInfo(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.currentUser.pipe(take(1)).subscribe({
      next: (user) => {
        console.log('🟢 currentUser emitted:', user);
        if (user && user.id) {
          this.currentUserId = user.id;
          console.log('🚀 Calling getById API with userId:', user.id);
          
          // Sử dụng UserClient.getById() - trả về Observable
          this.userClient.getById(user.id)
            .pipe(take(1))
            .subscribe({
              next: (result: ResultOfUser) => {
                console.log('✅ API Response received:', result);
                this.isLoading = false;
                
                if (result.isSuccess && result.data) {
                  const userData = result.data;
                  this.userInfo = {
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    phone: userData.phoneNumber || '',
                    dateOfBirth: userData.dateOfBirth ? this.formatDate(userData.dateOfBirth) : '',
                    gender: this.getGenderText(userData.firstName),
                    status: userData.status || 0,
                    emailVerified: userData.emailVerified || false,
                    phoneVerified: userData.phoneVerified || false
                  };
                  
                  // Lưu vào cache
                  this.profileDataService.setUserInfo(this.userInfo);
                  this.profileDataService.setLoading(false);
                } else {
                  this.errorMessage = result.errorMessage || 'Không thể lấy thông tin người dùng';
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Lỗi',
                    detail: this.errorMessage
                  });
                }
              },
              error: (error) => {
                this.isLoading = false;
                this.profileDataService.setLoading(false);
                this.errorMessage = 'Đã xảy ra lỗi khi tải thông tin';
                console.error('Error loading user info:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: this.errorMessage
                });
              }
            });
        } else {
          this.isLoading = false;
          this.profileDataService.setLoading(false);
          this.errorMessage = 'Chưa đăng nhập';
          this.messageService.add({
            severity: 'warn',
            summary: 'Cảnh báo',
            detail: this.errorMessage
          });
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.profileDataService.setLoading(false);
        this.errorMessage = 'Không thể xác thực người dùng';
        console.error('Auth error:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: this.errorMessage
        });
      }
    });
  }

  openEditDialog(): void {
    this.editForm = {
      firstName: this.userInfo.firstName,
      lastName: this.userInfo.lastName,
      email: this.userInfo.email,
      phone: this.userInfo.phone,
      dateOfBirth: this.userInfo.dateOfBirth ? this.parseDate(this.userInfo.dateOfBirth) : null
    };
    this.displayEditDialog = true;
  }

  saveChanges(): void {
    if (!this.currentUserId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID người dùng'
      });
      return;
    }

    const updateCommand = new UpdateUserCommand({
      userId: this.currentUserId,
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName,
      email: this.editForm.email,
      phoneNumber: this.editForm.phone,
      dateOfBirth: this.editForm.dateOfBirth || undefined
    });

    this.isLoading = true;
    this.userClient.update(updateCommand)
      .pipe(take(1))
      .subscribe({
        next: (result: ResultOfBoolean) => {
          this.isLoading = false;
          if (result.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Cập nhật thông tin thành công'
            });
            this.displayEditDialog = false;
            // Reload data
            this.loadUserInfo();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: result.errorMessage || 'Cập nhật thông tin thất bại'
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error updating user:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Đã xảy ra lỗi khi cập nhật thông tin'
          });
        }
      });
  }

  deleteAccount(): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.',
      header: 'Xác nhận xóa tài khoản',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (!this.currentUserId) {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy ID người dùng'
          });
          return;
        }

        this.isLoading = true;
        this.userClient.delete(this.currentUserId)
          .pipe(take(1))
          .subscribe({
            next: (result: ResultOfBoolean) => {
              this.isLoading = false;
              if (result.isSuccess) {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: 'Xóa tài khoản thành công'
                });
                // Logout user
                setTimeout(() => {
                  this.authService.logout();
                }, 2000);
              } else {
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: result.errorMessage || 'Xóa tài khoản thất bại'
                });
              }
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Error deleting user:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Lỗi',
                detail: 'Đã xảy ra lỗi khi xóa tài khoản'
              });
            }
          });
      }
    });
  }

  private formatDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return null;
  }

  private getGenderText(firstName: string | undefined): string {
    return 'Chưa cập nhật';
  }

  getStatusText(): string {
    return this.userInfo.status === 1 ? 'Đang hoạt động' : 'Không hoạt động';
  }

  getStatusSeverity(): 'success' | 'danger' {
    return this.userInfo.status === 1 ? 'success' : 'danger';
  }
}
