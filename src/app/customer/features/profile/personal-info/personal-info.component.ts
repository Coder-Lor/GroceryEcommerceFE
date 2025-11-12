import { Component, OnInit, OnDestroy, PLATFORM_ID, inject, makeStateKey, TransferState } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../../core/service/auth.service';
import { UserService } from '../../../../core/service/user.service';
import { ResultOfUser, User } from '../../../../core/service/system-admin.service';
import { Subject, takeUntil, take } from 'rxjs';

// Tạo key để lưu trữ state
const USER_INFO_KEY = makeStateKey<any>('userInfo');

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss',
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);
  
  isLoading = false;
  errorMessage = '';

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

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('🔵 PersonalInfo ngOnInit called');
    this.loadUserInfo();
  }

  ngOnDestroy(): void {
    console.log('🔴 PersonalInfo ngOnDestroy called');
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserInfo(): void {
    console.log('🟡 loadUserInfo called');
    
    // Kiểm tra xem đã có data trong TransferState chưa (từ SSR)
    const cachedUserInfo = this.transferState.get(USER_INFO_KEY, null);
    
    if (cachedUserInfo) {
      console.log('📦 Using cached data from SSR');
      this.userInfo = cachedUserInfo;
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Sử dụng pipe(take(1)) để chỉ lấy giá trị đầu tiên và tự động unsubscribe
    this.authService.currentUser.pipe(take(1)).subscribe({
      next: (user) => {
        console.log('🟢 currentUser emitted:', user);
        if (user && user.id) {
          console.log('🚀 Calling getById API with userId:', user.id);
          // Gọi API để lấy thông tin chi tiết
          this.userService.getById(
            user.id,
            (result: ResultOfUser) => {
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
                
                // Lưu vào TransferState nếu đang chạy trên server
                if (!isPlatformBrowser(this.platformId)) {
                  console.log('💾 Saving data to TransferState (Server)');
                  this.transferState.set(USER_INFO_KEY, this.userInfo);
                } else {
                  console.log('🌐 Running on Browser - removing TransferState key');
                  // Xóa key sau khi đã sử dụng trên client
                  this.transferState.remove(USER_INFO_KEY);
                }
              } else {
                this.errorMessage = 'Không thể lấy thông tin người dùng';
              }
            },
            (error) => {
              this.isLoading = false;
              this.errorMessage = 'Đã xảy ra lỗi khi tải thông tin';
              console.error('Error loading user info:', error);
            }
          );
        } else {
          this.isLoading = false;
          this.errorMessage = 'Chưa đăng nhập';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Không thể xác thực người dùng';
        console.error('Auth error:', error);
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

  private getGenderText(firstName: string | undefined): string {
    // Đây chỉ là logic tạm, bạn có thể thêm trường gender vào User model
    return 'Chưa cập nhật';
  }

  getStatusText(): string {
    return this.userInfo.status === 1 ? 'Đang hoạt động' : 'Không hoạt động';
  }
}
