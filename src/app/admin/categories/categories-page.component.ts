import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faPlus,
  faChartSimple,
  faDownload,
  faMagnifyingGlass,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faFolder,
  faFolderOpen,
  faBox,
  faHurricane,
  faSort,
  faSortUp,
  faSortDown,
  faEye,
  faFileExport,
  faCheckCircle,
  faTimesCircle
} from '@fortawesome/free-solid-svg-icons';
import {
  CategoryClient,
  CategoryDto,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  ResultOfListOfCategoryDto,
  ProductClient,
  ProductBaseResponse,
  FilterCriteria,
  FilterOperator,
  SortDirection
} from '../../core/service/system-admin.service';
import { Subject, takeUntil } from 'rxjs';

interface CategoryReport {
  totalCategories: number;
  totalProducts: number;
  activeCategories: number;
  inactiveCategories: number;
  topCategories: { name: string; count: number }[];
}

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './categories-page.component.html',
  styleUrls: ['./categories-page.component.scss']
})
export class CategoriesPageComponent implements OnInit, OnDestroy {
  categories: CategoryDto[] = [];
  filteredCategories: CategoryDto[] = [];
  allCategories: CategoryDto[] = []; // For parent category dropdown
  private destroy$ = new Subject<void>();
  
  searchTerm: string = '';
  isLoading: boolean = false;
  
  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentCategory: CreateCategoryCommand | UpdateCategoryCommand = this.getEmptyCategory();
  
  showSubCategoriesModal: boolean = false;
  selectedCategory: CategoryDto | null = null;
  
  showProductsModal: boolean = false;
  selectedCategoryForProducts: CategoryDto | null = null;
  categoryProducts: ProductBaseResponse[] = [];
  isLoadingProducts: boolean = false;
  
  showReport: boolean = false;
  report: CategoryReport | null = null;
  
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Font Awesome Icons
  faPlus = faPlus;
  faChartSimple = faChartSimple;
  faDownload = faDownload;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faFolder = faFolder;
  faFolderOpen = faFolderOpen;
  faBox = faBox;
  faHurricane = faHurricane;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faEye = faEye;
  faFileExport = faFileExport;
  faCheckCircle = faCheckCircle;
  faTimesCircle = faTimesCircle;

  constructor(
    private categoryClient: CategoryClient,
    private productClient: ProductClient
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.categoryClient.getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResultOfListOfCategoryDto) => {
          this.isLoading = false;
          if (response.isSuccess && response.data) {
            this.categories = this.flattenCategories(response.data);
            this.allCategories = [...this.categories];
            this.filterCategories();
          } else {
            alert(response.errorMessage || 'Không thể tải danh sách danh mục');
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading categories:', error);
          alert('Lỗi khi tải danh sách danh mục');
        }
      });
  }

  // Flatten nested categories for table display
  flattenCategories(categories: CategoryDto[]): CategoryDto[] {
    let flattened: CategoryDto[] = [];
    categories.forEach(cat => {
      flattened.push(cat);
      if (cat.subCategories && cat.subCategories.length > 0) {
        flattened = flattened.concat(this.flattenCategories(cat.subCategories));
      }
    });
    return flattened;
  }

  filterCategories(): void {
    let filtered = [...this.categories];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.slug?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }

    this.filteredCategories = filtered;
    this.sortCategories();
  }

  sortCategories(): void {
    this.filteredCategories.sort((a, b) => {
      let aValue: any = (a as any)[this.sortColumn];
      let bValue: any = (b as any)[this.sortColumn];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue ? bValue.toLowerCase() : '';
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortCategories();
  }

  openAddModal(): void {
    this.modalMode = 'add';
    this.currentCategory = this.getEmptyCategory();
    this.showModal = true;
  }

  openEditModal(category: CategoryDto): void {
    this.modalMode = 'edit';
    const updateCmd = new UpdateCategoryCommand();
    updateCmd.categoryId = category.categoryId;
    updateCmd.name = category.name;
    updateCmd.slug = category.slug;
    updateCmd.description = category.description;
    updateCmd.parentCategoryId = category.parentCategoryId;
    updateCmd.displayOrder = category.displayOrder;
    updateCmd.status = category.status;
    updateCmd.metaTitle = category.metaTitle;
    updateCmd.metaDescription = category.metaDescription;
    
    this.currentCategory = updateCmd;
    this.showModal = true;
    this.closeSubCategoriesModal(); // Close sub-categories modal if open
  }

  closeModal(): void {
    this.showModal = false;
    this.currentCategory = this.getEmptyCategory();
  }

  saveCategory(): void {
    if (!this.validateCategory()) {
      return;
    }

    this.isLoading = true;

    if (this.modalMode === 'add') {
      const createCmd = this.currentCategory as CreateCategoryCommand;
      this.categoryClient.createCategory(createCmd)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.isSuccess) {
              alert('Thêm danh mục thành công!');
              this.closeModal();
              this.loadCategories();
            } else {
              alert(response.errorMessage || 'Không thể thêm danh mục');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error creating category:', error);
            alert('Lỗi khi thêm danh mục');
          }
        });
    } else {
      const updateCmd = this.currentCategory as UpdateCategoryCommand;
      this.categoryClient.updateCategory(updateCmd.categoryId!, updateCmd)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.isSuccess) {
              alert('Cập nhật danh mục thành công!');
              this.closeModal();
              this.loadCategories();
            } else {
              alert(response.errorMessage || 'Không thể cập nhật danh mục');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error updating category:', error);
            alert('Lỗi khi cập nhật danh mục');
          }
        });
    }
  }

  confirmDelete(category: CategoryDto): void {
    if (!category.categoryId) return;
    
    if (confirm(`Bạn có chắc muốn xóa danh mục "${category.name}"?`)) {
      this.isLoading = true;
      this.categoryClient.deleteCategory(category.categoryId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response.isSuccess) {
              alert('Xóa danh mục thành công!');
              this.loadCategories();
            } else {
              alert(response.errorMessage || 'Không thể xóa danh mục');
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error deleting category:', error);
            alert('Lỗi khi xóa danh mục');
          }
        });
    }
  }

  viewSubCategories(category: CategoryDto): void {
    this.selectedCategory = category;
    this.showSubCategoriesModal = true;
  }

  closeSubCategoriesModal(): void {
    this.showSubCategoriesModal = false;
    this.selectedCategory = null;
  }

  viewCategoryProducts(category: CategoryDto): void {
    if (!category.categoryId) return;
    
    this.selectedCategoryForProducts = category;
    this.showProductsModal = true;
    this.isLoadingProducts = true;
    this.categoryProducts = [];
    
    // Tạo filter để lọc sản phẩm theo categoryId
    const categoryFilter = new FilterCriteria({
      fieldName: 'CategoryId',
      operator: FilterOperator.Equals,
      value: "38737d23-2a6f-49a9-9171-77fbf361e64f"
    });
    // categoryFilter.fieldName = 'CategoryId';
    // categoryFilter.value = category.categoryId;
    // categoryFilter.operator = FilterOperator.Equals;
    // categoryFilter.toJSON();
    // Gọi API getProductsPaging với filter
    this.productClient.getProductsPaging(
      1,                              // page
      100,                            // pageSize - lấy tối đa 100 sản phẩm
      undefined,                      // search
      'Name',                         // sortBy
      SortDirection.Ascending,        // sortDirection
      [categoryFilter],               // filters
      undefined,                      // entityType
      undefined,                      // availableFields
      true,                           // hasFilters
      false,                          // hasSearch
      true                            // hasSorting
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.isLoadingProducts = false;
        if (response.isSuccess && response.data?.items) {
          this.categoryProducts = response.data.items;
        } else {
          this.categoryProducts = [];
          if (response.errorMessage) {
            alert(response.errorMessage);
          }
        }
      },
      error: (error) => {
        this.isLoadingProducts = false;
        console.error('Error loading category products:', error);
        alert('Lỗi khi tải danh sách sản phẩm');
      }
    });
  }

  closeProductsModal(): void {
    this.showProductsModal = false;
    this.selectedCategoryForProducts = null;
    this.categoryProducts = [];
  }

  showCategoryReport(): void {
    this.report = this.generateReport();
    this.showReport = true;
  }

  closeReport(): void {
    this.showReport = false;
    this.report = null;
  }

  exportReport(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `category_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateCSV(): string {
    const headers = ['Tên danh mục', 'Slug', 'Danh mục cha', 'Thứ tự', 'Số sản phẩm', 'Trạng thái', 'Ngày tạo'];
    const rows = this.filteredCategories.map(c => [
      c.name || '',
      c.slug || '',
      c.parentCategoryName || 'Danh mục gốc',
      (c.displayOrder || 0).toString(),
      (c.productCount || 0).toString(),
      this.getStatusText(c),
      this.formatDate(c.createdAt)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generateReport(): CategoryReport {
    const totalCategories = this.categories.length;
    const totalProducts = this.categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    const activeCategories = this.categories.filter(c => c.status === 1).length;
    const inactiveCategories = this.categories.filter(c => c.status === 0).length;
    
    const topCategories = [...this.categories]
      .sort((a, b) => (b.productCount || 0) - (a.productCount || 0))
      .slice(0, 5)
      .map(c => ({ name: c.name || '', count: c.productCount || 0 }));

    return {
      totalCategories,
      totalProducts,
      activeCategories,
      inactiveCategories,
      topCategories
    };
  }

  getStatusText(category: CategoryDto): string {
    return category.status === 1 ? 'Hoạt động' : 'Tạm ẩn';
  }

  getStatusClass(category: CategoryDto): string {
    return category.status === 1 ? 'status-active' : 'status-inactive';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  private validateCategory(): boolean {
    if (!this.currentCategory.name?.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return false;
    }
    if (!this.currentCategory.slug?.trim()) {
      alert('Vui lòng nhập slug');
      return false;
    }
    if (this.currentCategory.displayOrder === undefined || this.currentCategory.displayOrder < 0) {
      alert('Thứ tự hiển thị phải >= 0');
      return false;
    }
    return true;
  }

  private getEmptyCategory(): CreateCategoryCommand {
    const category = new CreateCategoryCommand();
    category.name = '';
    category.slug = '';
    category.description = '';
    category.parentCategoryId = undefined;
    category.displayOrder = 0;
    category.status = 1;
    category.metaTitle = '';
    category.metaDescription = '';
    return category;
  }
}
