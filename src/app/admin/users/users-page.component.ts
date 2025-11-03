import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/service/user.service';
import { LoadingOverlayComponent } from '../layout/loading-overlay/loading-overlay.component';
import { 
  User, 
  UpdateUserCommand, 
  SortDirection, 
  FilterCriteria,
  ResultOfUser,
  ResultOfBoolean
} from '../../core/service/system-admin.service';

interface UserData {
  userId?: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: number;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: Date;
  lastLoginAt?: Date;
}

@Component({
  selector: 'app-users-page',
  standalone: true,
  templateUrl: 'users-page.component.html',
  styleUrl: './users-page.component.scss',
  imports: [CommonModule, FormsModule, LoadingOverlayComponent]
})
export class UsersPageComponent implements OnInit {
  users: UserData[] = [];
  selectedUser: UserData | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  isEditModalOpen = false;
  isDeleteModalOpen = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;
  
  // Search & Filter
  searchKeyword = '';
  sortBy = 'createdAt';
  sortDirection = SortDirection.Descending;
  
  // Edit form
  editForm: UpdateUserCommand = {} as UpdateUserCommand;
  
  // Status options
  statusOptions = [
    { value: 0, label: 'Không hoạt động' },
    { value: 1, label: 'Hoạt động' },
    { value: 2, label: 'Bị khóa' }
  ];

  // Expose Math and SortDirection to template
  Math = Math;
  SortDirection = SortDirection;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Tải danh sách người dùng
   */
  loadUsers(): void {
    this.isLoading = true;
    
    this.userService.getUsersPaging(
      this.currentPage,
      this.pageSize,
      (response) => {
        this.isLoading = false;
        // Parse blob response to get user data
        this.parseUserData(response);
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi khi tải danh sách người dùng:', error);
        alert('Không thể tải danh sách người dùng. Vui lòng thử lại!');
      },
      this.searchKeyword || undefined,
      this.sortBy,
      this.sortDirection
    );
  }

  /**
   * Parse blob data to user list
   */
  private parseUserData(response: any): void {
    // Handle blob response - convert to JSON
    if (response.data) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const result = JSON.parse(reader.result as string);
          if (result.data && result.data.items) {
            this.users = result.data.items;
            this.totalRecords = result.data.totalCount || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      };
      reader.readAsText(response.data);
    }
  }

  /**
   * Tìm kiếm người dùng
   */
  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * Thay đổi trang
   */
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadUsers();
    }
  }

  /**
   * Thay đổi số lượng hiển thị
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  /**
   * Sắp xếp
   */
  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === SortDirection.Ascending 
        ? SortDirection.Descending 
        : SortDirection.Ascending;
    } else {
      this.sortBy = field;
      this.sortDirection = SortDirection.Ascending;
    }
    this.loadUsers();
  }

  /**
   * Xem chi tiết người dùng
   */
  viewUserDetail(userId: string): void {
    this.userService.getById(
      userId,
      (result: ResultOfUser) => {
        if (this.userService.isSuccess(result) && result.data) {
          this.selectedUser = result.data as UserData;
          this.isDetailModalOpen = true;
        } else {
          alert('Không thể tải thông tin người dùng: ' + this.userService.getErrorMessage(result));
        }
      },
      (error) => {
        console.error('Lỗi:', error);
        alert('Không thể tải thông tin người dùng!');
      }
    );
  }

  /**
   * Mở modal chỉnh sửa
   */
  openEditModal(user: UserData): void {
    this.selectedUser = user;
    this.editForm = new UpdateUserCommand({
      userId: user.userId,
      email: user.email,
      username: user.username
    });
    this.isEditModalOpen = true;
  }

  /**
   * Lưu thay đổi
   */
  saveUser(): void {
    if (!this.editForm.userId) {
      alert('Thiếu thông tin người dùng!');
      return;
    }

    this.isLoading = true;
    this.userService.update(
      this.editForm,
      (result: ResultOfBoolean) => {
        this.isLoading = false;
        if (this.userService.isSuccess(result)) {
          alert('Cập nhật người dùng thành công!');
          this.isEditModalOpen = false;
          this.loadUsers();
        } else {
          alert('Cập nhật thất bại: ' + this.userService.getErrorMessage(result));
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        alert('Không thể cập nhật người dùng!');
      }
    );
  }

  /**
   * Mở modal xác nhận xóa
   */
  openDeleteModal(user: UserData): void {
    this.selectedUser = user;
    this.isDeleteModalOpen = true;
  }

  /**
   * Xóa người dùng
   */
  deleteUser(): void {
    if (!this.selectedUser?.userId) {
      return;
    }

    this.isLoading = true;
    this.userService.delete(
      this.selectedUser.userId,
      (result: ResultOfBoolean) => {
        this.isLoading = false;
        if (this.userService.isSuccess(result)) {
          alert('Xóa người dùng thành công!');
          this.isDeleteModalOpen = false;
          this.loadUsers();
        } else {
          alert('Xóa thất bại: ' + this.userService.getErrorMessage(result));
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        alert('Không thể xóa người dùng!');
      }
    );
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.isDetailModalOpen = false;
    this.isEditModalOpen = false;
    this.isDeleteModalOpen = false;
    this.selectedUser = null;
  }

  /**
   * Lấy tên trạng thái
   */
  getStatusLabel(status?: number): string {
    const found = this.statusOptions.find(opt => opt.value === status);
    return found ? found.label : 'Không xác định';
  }

  /**
   * Lấy class CSS cho trạng thái
   */
  getStatusClass(status?: number): string {
    switch (status) {
      case 1: return 'status-active';
      case 2: return 'status-locked';
      default: return 'status-inactive';
    }
  }

  /**
   * Format ngày tháng
   */
  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Tạo mảng số trang
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
