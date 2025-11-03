import { Injectable } from '@angular/core';
import { 
  UserClient, 
  FileResponse, 
  ResultOfUser, 
  ResultOfBoolean,
  UpdateUserCommand,
  FilterCriteria,
  SortDirection
} from './system-admin.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private userClient: UserClient) { }

  /**
   * Lấy danh sách người dùng có phân trang
   * @param page Trang hiện tại
   * @param pageSize Số lượng bản ghi trên mỗi trang
   * @param search Từ khóa tìm kiếm (optional)
   * @param sortBy Trường sắp xếp (optional)
   * @param sortDirection Hướng sắp xếp (optional)
   * @param filters Các bộ lọc (optional)
   * @param onSuccess Callback khi thành công
   * @param onError Callback khi có lỗi
   */
  getUsersPaging(
    page: number,
    pageSize: number,
    onSuccess: (response: FileResponse) => void,
    onError: (error: any) => void,
    search?: string,
    sortBy?: string,
    sortDirection?: SortDirection,
    filters?: FilterCriteria[]
  ): void {
    this.userClient.getUsersPaging(
      page,
      pageSize,
      search || null,
      sortBy || null,
      sortDirection || SortDirection.Ascending,
      filters || [],
      null, // entityType
      null, // availableFields
      filters ? filters.length > 0 : false, // hasFilters
      !!search, // hasSearch
      !!sortBy // hasSorting
    ).subscribe({
      next: (response) => onSuccess(response),
      error: (error) => onError(error)
    });
  }

  /**
   * Lấy thông tin chi tiết người dùng theo ID
   * @param userId ID của người dùng
   * @param onSuccess Callback khi thành công
   * @param onError Callback khi có lỗi
   */
  getById(
    userId: string,
    onSuccess: (result: ResultOfUser) => void,
    onError: (error: any) => void
  ): void {
    this.userClient.getById(userId).subscribe({
      next: (result) => onSuccess(result),
      error: (error) => onError(error)
    });
  }

  /**
   * Xóa người dùng theo ID
   * @param userId ID của người dùng cần xóa
   * @param onSuccess Callback khi thành công
   * @param onError Callback khi có lỗi
   */
  delete(
    userId: string,
    onSuccess: (result: ResultOfBoolean) => void,
    onError: (error: any) => void
  ): void {
    this.userClient.delete(userId).subscribe({
      next: (result) => onSuccess(result),
      error: (error) => onError(error)
    });
  }

  /**
   * Cập nhật thông tin người dùng
   * @param command Dữ liệu cập nhật người dùng
   * @param onSuccess Callback khi thành công
   * @param onError Callback khi có lỗi
   */
  update(
    command: UpdateUserCommand,
    onSuccess: (result: ResultOfBoolean) => void,
    onError: (error: any) => void
  ): void {
    this.userClient.update(command).subscribe({
      next: (result) => onSuccess(result),
      error: (error) => onError(error)
    });
  }

  /**
   * Kiểm tra kết quả trả về có thành công hay không
   * @param result Kết quả từ API
   * @returns boolean
   */
  isSuccess(result: ResultOfBoolean | ResultOfUser): boolean {
    return result.isSuccess || false;
  }

  /**
   * Lấy thông tin lỗi từ kết quả
   * @param result Kết quả từ API
   * @returns string
   */
  getErrorMessage(result: ResultOfBoolean | ResultOfUser): string {
    return result.errors?.join(', ') || 'Đã xảy ra lỗi';
  }
}
