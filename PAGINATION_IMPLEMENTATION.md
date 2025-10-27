# Triển khai Pagination cho Quản lý Kho hàng

## Tổng quan
Đã triển khai chức năng phân trang (pagination) đầy đủ cho trang quản lý kho hàng (Inventory Management), cho phép người dùng:
- Chọn số lượng items hiển thị mỗi trang (5, 10, 20, 50, 100)
- Điều hướng giữa các trang (Trang đầu, Trước, Sau, Trang cuối)
- Hiển thị thông tin phân trang chi tiết
- Tự động gọi lại API khi thay đổi trang hoặc số lượng items

## Các thay đổi chính

### 1. InventoryService (`src/app/core/service/inventory.service.ts`)

#### Thêm interface PagingInfo
```typescript
export interface PagingInfo {
  totalCount: number;      // Tổng số sản phẩm
  totalPages: number;      // Tổng số trang
  currentPage: number;     // Trang hiện tại
  pageSize: number;        // Số items mỗi trang
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

#### Thêm Observable cho paging info
```typescript
private pagingInfoSubject = new BehaviorSubject<PagingInfo>({...});
public pagingInfo$ = this.pagingInfoSubject.asObservable();
```

#### Cập nhật phương thức loadProducts
- Nhận parameters: `page` và `pageSize`
- Cập nhật cả products và paging info từ API response
- Parse response từ `PagedResultOfProductBaseResponse`

#### Thêm các phương thức mới
- `getPagingInfo()`: Lấy thông tin phân trang hiện tại
- `changePage(page: number)`: Chuyển sang trang khác
- `changePageSize(pageSize: number)`: Thay đổi số lượng items mỗi trang
- `refreshProducts(page?, pageSize?)`: Refresh danh sách với parameters tùy chọn

### 2. InventoryPageComponent (`src/app/admin/inventory/`)

#### Thêm properties
```typescript
pagingInfo: PagingInfo = {...};
pageSizeOptions: number[] = [5, 10, 20, 50, 100];
```

#### Thêm Font Awesome icons
- `faChevronLeft`, `faChevronRight`: Navigation arrows
- `faAnglesLeft`, `faAnglesRight`: First/Last page arrows

#### Subscribe đến paging info trong ngOnInit
```typescript
this.inventoryService.getPagingInfo().subscribe(pagingInfo => {
  this.pagingInfo = pagingInfo;
});
```

#### Thêm các phương thức pagination
- `onPageSizeChange()`: Xử lý khi thay đổi pageSize
- `goToPage(page)`: Chuyển đến trang cụ thể
- `goToFirstPage()`: Về trang đầu
- `goToLastPage()`: Đến trang cuối
- `goToPreviousPage()`: Về trang trước
- `goToNextPage()`: Đến trang sau
- `getPageNumbers()`: Tính toán các số trang hiển thị với ellipsis (...)

### 3. Template HTML (`inventory-page.component.html`)

#### Cập nhật search result display
```html
<span class="search-result">
  Hiển thị {{ filteredProducts.length }} sản phẩm / Tổng {{ pagingInfo.totalCount }} sản phẩm
</span>
```

#### Thêm pagination controls
```html
<div class="pagination-container">
  <div class="pagination-info">
    <!-- Page info và page size selector -->
  </div>
  
  <div class="pagination-controls">
    <!-- First, Previous, Page numbers, Next, Last buttons -->
  </div>
</div>
```

#### Pagination controls bao gồm:
- **Pagination Info**: Hiển thị "Trang X / Y" và dropdown chọn số dòng mỗi trang
- **First/Last buttons**: Nút đến trang đầu/cuối (disabled khi không available)
- **Previous/Next buttons**: Nút trang trước/sau (disabled khi không available)
- **Page numbers**: Danh sách số trang với ellipsis cho nhiều trang
  - Hiển thị tất cả nếu ≤ 7 trang
  - Hiển thị với ellipsis nếu > 7 trang
  - Highlight trang hiện tại

### 4. Styles (`inventory-page.component.scss`)

#### Thêm `.pagination-container`
- Flexbox layout với space-between
- Responsive design cho mobile (flex-direction: column)
- Background và shadow giống table

#### `.pagination-info`
- Display thông tin và page size selector
- Styled select dropdown với hover/focus effects

#### `.pagination-controls`
- Button styles với hover effects
- Active state cho trang hiện tại (gradient background)
- Disabled state với opacity giảm
- Transition animations cho smooth UX

## Cách sử dụng

### Khi component khởi tạo
1. Service tự động gọi API với page=1, pageSize=10
2. Nhận response và update cả products lẫn paging info
3. Component subscribe và hiển thị dữ liệu

### Khi người dùng thay đổi page size
1. User chọn size mới từ dropdown
2. Trigger `onPageSizeChange()`
3. Service gọi API với page=1 và pageSize mới
4. UI update với data mới

### Khi người dùng chuyển trang
1. User click vào số trang hoặc navigation buttons
2. Trigger `goToPage(pageNumber)`
3. Service gọi API với page và pageSize hiện tại
4. UI update với data của trang mới

## Lưu ý

### Server-side vs Client-side
- **Paging**: Hoàn toàn server-side (API handle)
- **Search**: Hiện tại client-side (có thể chuyển sang server-side)
- **Sort**: Hiện tại client-side (có thể chuyển sang server-side)
- **Filter**: Hiện tại client-side (có thể chuyển sang server-side)

### Cải tiến trong tương lai
1. Implement server-side search/sort/filter
2. Add loading state khi đang fetch data
3. Add debounce cho search input
4. Cache responses để giảm API calls
5. Add "Go to page" input field
6. Persist page state trong URL query params

## API Response Structure
```typescript
PagedResultOfProductBaseResponse {
  items: ProductBaseResponse[];
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
```

## Testing
- Test với các page sizes khác nhau
- Test navigation giữa các trang
- Test edge cases (trang đầu, trang cuối)
- Test với số lượng data khác nhau
- Verify API calls với đúng parameters

## Build Status
✅ Build thành công
✅ Không có TypeScript errors
✅ Pagination UI responsive
✅ Ready for testing với backend API
