import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { UserService } from '../../core/service/user.service';
import { LoadingOverlayComponent } from '../layout/loading-overlay/loading-overlay.component';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import {
  faPlus,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faEye,
  faSort,
  faSortUp,
  faSortDown,
  faUser,
  faUserCheck,
  faUserSlash,
  faEnvelope,
  faPhone,
  faCalendar,
  faUserShield,
  faUserTag,
  faAnglesLeft,
  faAnglesRight,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  User,
  UpdateUserCommand,
  SortDirection,
  FilterCriteria,
  ResultOfUser,
  ResultOfBoolean,
  UserRoleAssignmentClient,
  UserRoleClient,
  AssignUserRoleCommand,
  RemoveUserRoleCommand,
  ResultOfPagedResultOfUserRole,
  ResultOfListOfString,
  UserRole,
} from '../../core/service/system-admin.service';
import { TooltipDirective } from '@shared/directives/tooltip';

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
  imports: [
    CommonModule,
    FormsModule,
    LoadingOverlayComponent,
    FaIconComponent,
    ToastModule,
    ConfirmDialogModule,
    TooltipDirective
  ],
  providers: [MessageService, ConfirmationService],
})
export class UsersPageComponent implements OnInit {
  // Font Awesome icons
  faPlus = faPlus;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faEye = faEye;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faUser = faUser;
  faUserCheck = faUserCheck;
  faUserSlash = faUserSlash;
  faEnvelope = faEnvelope;
  faPhone = faPhone;
  faCalendar = faCalendar;
  faUserShield = faUserShield;
  faUserTag = faUserTag;
  faAnglesLeft = faAnglesLeft;
  faAnglesRight = faAnglesRight;
  faChevronLeft = faChevronLeft;
  faChevronRight = faChevronRight;

  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  selectedUser: UserData | null = null;
  isLoading = false;
  isDetailModalOpen = false;
  isEditModalOpen = false;
  isRoleModalOpen = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalRecords = 0;

  // Search & Filter
  searchTerm = '';
  sortColumn = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Edit form
  editForm: UpdateUserCommand = {} as UpdateUserCommand;

  // Role management
  availableRoles: UserRole[] = [];
  userRoles: string[] = [];
  selectedRoleIds: string[] = [];

  // Status options
  statusOptions = [
    { value: 0, label: 'Không hoạt động' },
    { value: 1, label: 'Hoạt động' },
    { value: 2, label: 'Bị khóa' },
  ];

  // Expose Math and SortDirection to template
  Math = Math;
  SortDirection = SortDirection;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private userRoleAssignmentClient: UserRoleAssignmentClient,
    private userRoleClient: UserRoleClient
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadAllRoles();
  }

  /**
   * Tải danh sách tất cả các vai trò
   */
  loadAllRoles(): void {
    this.userRoleClient.getAll().subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) {
          this.availableRoles = result.data;
        }
      },
      error: (error) => {
        console.error('Lỗi khi tải danh sách vai trò:', error);
      },
    });
  }

  /**
   * Tải danh sách người dùng
   */
  loadUsers(): void {
    this.isLoading = true;

    const apiSortDirection =
      this.sortDirection === 'asc' ? SortDirection.Ascending : SortDirection.Descending;

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
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách người dùng!',
        });
      },
      this.searchTerm || undefined,
      this.sortColumn,
      apiSortDirection
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
            this.filteredUsers = [...this.users];
            this.totalRecords = result.data.totalCount || 0;
            this.totalPages = Math.ceil(this.totalRecords / this.pageSize);
            this.sortUsers();
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu người dùng',
          });
        }
      };
      reader.readAsText(response.data);
    }
  }

  /**
   * Lọc người dùng
   */
  filterUsers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredUsers = [...this.users];
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredUsers = this.users.filter(
        (user) =>
          user.username?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term) ||
          user.firstName?.toLowerCase().includes(term) ||
          user.lastName?.toLowerCase().includes(term) ||
          user.phoneNumber?.toLowerCase().includes(term)
      );
    }
    this.sortUsers();
  }

  /**
   * Sắp xếp người dùng
   */
  sortUsers(): void {
    this.filteredUsers.sort((a, b) => {
      let valueA: any = (a as any)[this.sortColumn];
      let valueB: any = (b as any)[this.sortColumn];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      if (typeof valueA === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      let comparison = 0;
      if (valueA > valueB) comparison = 1;
      else if (valueA < valueB) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Thay đổi cột sắp xếp
   */
  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortUsers();
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
   * Xem chi tiết người dùng
   */
  viewUserDetail(userId: string): void {
    this.isLoading = true;
    this.userService.getById(
      userId,
      (result: ResultOfUser) => {
        this.isLoading = false;
        if (this.userService.isSuccess(result) && result.data) {
          this.selectedUser = result.data as UserData;
          this.isDetailModalOpen = true;
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail:
              'Không thể tải thông tin người dùng: ' + this.userService.getErrorMessage(result),
          });
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin người dùng!',
        });
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
      username: user.username,
    });
    this.isEditModalOpen = true;
  }

  /**
   * Lưu thay đổi
   */
  saveUser(): void {
    if (!this.editForm.userId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Thiếu thông tin người dùng!',
      });
      return;
    }

    this.isLoading = true;
    this.userService.update(
      this.editForm,
      (result: ResultOfBoolean) => {
        this.isLoading = false;
        if (this.userService.isSuccess(result)) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Cập nhật người dùng thành công!',
          });
          this.isEditModalOpen = false;
          this.loadUsers();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Cập nhật thất bại: ' + this.userService.getErrorMessage(result),
          });
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể cập nhật người dùng!',
        });
      }
    );
  }

  /**
   * Xác nhận xóa người dùng
   */
  confirmDelete(user: UserData): void {
    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa người dùng <strong>${user.username}</strong>? Hành động này không thể hoàn tác!`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteUser(user);
      },
    });
  }

  /**
   * Xóa người dùng
   */
  deleteUser(user: UserData): void {
    if (!user.userId) {
      return;
    }

    this.isLoading = true;
    this.userService.delete(
      user.userId,
      (result: ResultOfBoolean) => {
        this.isLoading = false;
        if (this.userService.isSuccess(result)) {
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Xóa người dùng thành công!',
          });
          this.loadUsers();
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Xóa thất bại: ' + this.userService.getErrorMessage(result),
          });
        }
      },
      (error) => {
        this.isLoading = false;
        console.error('Lỗi:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa người dùng!',
        });
      }
    );
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.isDetailModalOpen = false;
    this.isEditModalOpen = false;
    this.isRoleModalOpen = false;
    this.selectedUser = null;
    this.userRoles = [];
    this.selectedRoleIds = [];
  }

  /**
   * Mở modal quản lý vai trò
   */
  openRoleModal(user: UserData): void {
    this.selectedUser = user;
    this.selectedRoleIds = [];
    this.loadUserRoles(user.userId!);
    this.isRoleModalOpen = true;
  }

  /**
   * Tải vai trò của người dùng
   */
  loadUserRoles(userId: string): void {
    this.isLoading = true;
    this.userRoleAssignmentClient.getUserRoleNames(userId).subscribe({
      next: (result: ResultOfListOfString) => {
        this.isLoading = false;
        if (result.isSuccess && result.data) {
          this.userRoles = result.data;
          // Tìm roleId từ roleName
          this.selectedRoleIds = this.availableRoles
            .filter((role) => this.userRoles.includes(role.roleName || ''))
            .map((role) => role.roleId || '');
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Lỗi khi tải vai trò người dùng:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải vai trò người dùng!',
        });
      },
    });
  }

  /**
   * Toggle vai trò
   */
  toggleRole(roleId: string): void {
    const index = this.selectedRoleIds.indexOf(roleId);
    if (index > -1) {
      this.selectedRoleIds.splice(index, 1);
    } else {
      this.selectedRoleIds.push(roleId);
    }
  }

  /**
   * Kiểm tra vai trò có được chọn không
   */
  isRoleSelected(roleId: string): boolean {
    return this.selectedRoleIds.includes(roleId);
  }

  /**
   * Lưu thay đổi vai trò
   */
  saveRoles(): void {
    if (!this.selectedUser || !this.selectedUser.userId) {
      return;
    }

    this.isLoading = true;
    const userId = this.selectedUser.userId;

    // Tìm các role cần thêm và cần xóa
    const currentRoleIds = this.availableRoles
      .filter((role) => this.userRoles.includes(role.roleName || ''))
      .map((role) => role.roleId || '');

    const rolesToAdd = this.selectedRoleIds.filter((id) => !currentRoleIds.includes(id));
    const rolesToRemove = currentRoleIds.filter((id) => !this.selectedRoleIds.includes(id));

    let completedOperations = 0;
    const totalOperations = rolesToAdd.length + rolesToRemove.length;

    if (totalOperations === 0) {
      this.isLoading = false;
      this.messageService.add({
        severity: 'info',
        summary: 'Thông báo',
        detail: 'Không có thay đổi nào!',
      });
      return;
    }

    const checkComplete = () => {
      completedOperations++;
      if (completedOperations === totalOperations) {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Cập nhật vai trò thành công!',
        });
        this.isRoleModalOpen = false;
        this.loadUserRoles(userId);
      }
    };

    // Thêm vai trò mới
    rolesToAdd.forEach((roleId) => {
      const command = new AssignUserRoleCommand({
        userId: userId,
        roleId: roleId,
      });

      this.userRoleAssignmentClient.assign(command).subscribe({
        next: (result: ResultOfBoolean) => {
          if (result.isSuccess) {
            checkComplete();
          } else {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể gán vai trò: ' + (result.errorMessage || 'Unknown error'),
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi khi gán vai trò:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể gán vai trò!',
          });
        },
      });
    });

    // Xóa vai trò
    rolesToRemove.forEach((roleId) => {
      const command = new RemoveUserRoleCommand({
        userId: userId,
        roleId: roleId,
      });

      this.userRoleAssignmentClient.remove(command).subscribe({
        next: (result: ResultOfBoolean) => {
          if (result.isSuccess) {
            checkComplete();
          } else {
            this.isLoading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể xóa vai trò: ' + (result.errorMessage || 'Unknown error'),
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Lỗi khi xóa vai trò:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể xóa vai trò!',
          });
        },
      });
    });
  }

  /**
   * Lấy tên trạng thái
   */
  getStatusLabel(status?: number): string {
    const found = this.statusOptions.find((opt) => opt.value === status);
    return found ? found.label : 'Không xác định';
  }

  /**
   * Lấy class CSS cho trạng thái
   */
  getStatusClass(status?: number): string {
    switch (status) {
      case 1:
        return 'status-active';
      case 2:
        return 'status-locked';
      default:
        return 'status-inactive';
    }
  }

  /**
   * Format ngày tháng
   */
  formatDate(date?: Date | string): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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
