import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/service/auth.service';
import { UserService } from '../../../../core/service/user.service';
import { ResultOfUser, User } from '../../../../core/service/system-admin.service';
import { Subject, takeUntil, take } from 'rxjs';
import { ProfileDataService } from '../profile-data.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.scss',
})
export class PersonalInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
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
    private userService: UserService,
    private profileDataService: ProfileDataService
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
    // Kiểm tra nếu đang load thì không load lại
    this.profileDataService.getLoadingState().pipe(take(1)).subscribe(isLoading => {
      if (isLoading) {
        console.log('⚠️ Already loading, skip this request');
        return;
      }

      this.isLoading = true;
      this.profileDataService.setLoading(true);
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
                this.profileDataService.setLoading(false);
                
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
                } else {
                  this.errorMessage = 'Không thể lấy thông tin người dùng';
                }
              },
              (error) => {
                this.isLoading = false;
                this.profileDataService.setLoading(false);
                this.errorMessage = 'Đã xảy ra lỗi khi tải thông tin';
                console.error('Error loading user info:', error);
              }
            );
          } else {
            this.isLoading = false;
            this.profileDataService.setLoading(false);
            this.errorMessage = 'Chưa đăng nhập';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.profileDataService.setLoading(false);
          this.errorMessage = 'Không thể xác thực người dùng';
          console.error('Auth error:', error);
        }
      });
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
