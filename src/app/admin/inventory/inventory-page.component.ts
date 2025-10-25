import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../core/service/inventory.service';
import { Product, InventoryReport } from './models/product.model';
import { faPlus, faChartSimple, faFile, faFileArrowDown, faDownload, faMagnifyingGlass, faPenToSquare, faTrashCan, faXmark, faBox, faMoneyBill, faTriangleExclamation, faCircleXmark, faFileExport, faHurricane, faCoins, faSort, faSortUp, faSortDown, faFilter } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { CategoryClient, CategoryDto, ResultOfListOfCategoryDto } from "@services/system-admin.service"
import { Subject, takeUntil } from 'rxjs';
@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: 'inventory-page.component.html',
  styleUrls: ['inventory-page.component.scss']
})
export class InventoryPageComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: CategoryDto[] = [];
  private destroy$ = new Subject<void>();
  searchTerm: string = '';
  
  showModal: boolean = false;
  modalMode: 'add' | 'edit' = 'add';
  currentProduct: Product = this.getEmptyProduct();
  
  showReport: boolean = false;
  report: InventoryReport | null = null;
  isLoading: boolean = false;

  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  showStatusFilterModal: boolean = false;
  statusFilters: { [key: string]: boolean } = {
    'Còn hàng': true,
    'Sắp hết': true,
    'Hết hàng': true
  };
  statusOptions: string[] = Object.keys(this.statusFilters);

  faPlus = faPlus;
  faChartSimple = faChartSimple;
  faFileArrowDown = faFileArrowDown;
  faDownload = faDownload;
  faMagnifyingGlass = faMagnifyingGlass;
  faPenToSquare = faPenToSquare;
  faTrashCan = faTrashCan;
  faXmark = faXmark;
  faBox = faBox;
  faMoneyBill = faMoneyBill;
  faTriangleExclamation = faTriangleExclamation;
  faCircleXmark = faCircleXmark;
  faFileExport = faFileExport;
  faCoins = faCoins;  
  faHurricane = faHurricane;
  faSort = faSort;
  faSortUp = faSortUp;
  faSortDown = faSortDown;
  faFilter = faFilter;

  constructor(private inventoryService: InventoryService, private categoryClient : CategoryClient) {}


  ngOnInit(): void {
    this.inventoryService.getProducts().subscribe(products => {
      this.products = products;
      this.filterProducts();
    });
    this.categoryClient.getCategoryTree().pipe(
      takeUntil(this.destroy$)
    ).subscribe( {
      next: (response: ResultOfListOfCategoryDto) => {
        if (response.isSuccess){
          this.categories = response.data ?? [];
        }
        console.log(response);
      },
      error: (error: ResultOfListOfCategoryDto) => {
        
      }
      
    });
    this.startLoading();
  }

  startLoading() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = !this.isLoading;
    }, 2500);
  }

  // Lọc sản phẩm theo từ khóa
  filterProducts(): void {
    let productsToFilter = [...this.products];

    // Lọc theo từ khóa
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      productsToFilter = productsToFilter.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.shortDescription.toLowerCase().includes(term)
      );
    }

    // Lọc theo trạng thái
    const activeStatusFilters = this.statusOptions.filter(status => this.statusFilters[status]);
    // Only filter if not all options are selected
    if (activeStatusFilters.length > 0 && activeStatusFilters.length < this.statusOptions.length) {
        productsToFilter = productsToFilter.filter(p => activeStatusFilters.includes(this.getStockStatus(p)));
    }

    this.filteredProducts = productsToFilter;
    this.sortProducts();
  }

  // Sắp xếp sản phẩm
  sortProducts(): void {
    this.filteredProducts.sort((a, b) => {
      let aValue: any = a[this.sortColumn as keyof Product];
      let bValue: any = b[this.sortColumn as keyof Product];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Thay đổi cột sắp xếp
  changeSortColumn(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortProducts();
  }

  openStatusFilterModal(event: Event): void {
    event.stopPropagation();
    this.showStatusFilterModal = true;
  }

  closeStatusFilterModal(): void {
    this.showStatusFilterModal = false;
  }

  // Mở modal thêm sản phẩm
  openAddModal(): void {
    this.modalMode = 'add';
    this.currentProduct = this.getEmptyProduct();
    this.showModal = true;
  }

  // Mở modal sửa sản phẩm
  openEditModal(product: Product): void {
    this.modalMode = 'edit';
    this.currentProduct = { ...product };
    this.showModal = true;
  }

  // Đóng modal
  closeModal(): void {
    this.showModal = false;
    this.currentProduct = this.getEmptyProduct();
  }

  // Lưu sản phẩm
  saveProduct(): void {
    if (this.validateProduct()) {
      if (this.modalMode === 'add') {
        this.inventoryService.addProduct(this.currentProduct);
      } else {
        this.inventoryService.updateProduct(this.currentProduct.id!, this.currentProduct);
      }
      this.closeModal();
    }
  }

  // Xác nhận xóa sản phẩm
  confirmDelete(product: Product): void {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm "${product.name}"?`)) {
      this.inventoryService.deleteProduct(product.id!);
    }
  }

  // Hiển thị báo cáo
  showInventoryReport(): void {
    this.report = this.inventoryService.generateReport();
    this.showReport = true;
  }

  // Đóng báo cáo
  closeReport(): void {
    this.showReport = false;
    this.report = null;
  }

  // Xuất báo cáo (CSV)
  exportReport(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_report_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Tạo nội dung CSV
  private generateCSV(): string {
    const headers = ['SKU', 'Tên sản phẩm', 'Giá vốn', 'Giá bán', 'Tồn kho', 'Mức tồn tối thiểu', 'Trạng thái'];
    const rows = this.filteredProducts.map(p => [
      p.sku,
      p.name,
      p.cost.toString(),
      p.price.toString(),
      p.stockQuantity.toString(),
      p.minStockLevel.toString(),
      this.getStockStatus(p)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Lấy trạng thái tồn kho
  getStockStatus(product: Product): string {
    if (product.stockQuantity === 0) return 'Hết hàng';
    if (product.stockQuantity <= product.minStockLevel) return 'Sắp hết';
    return 'Còn hàng';
  }

  // Lấy class CSS cho trạng thái
  getStockStatusClass(product: Product): string {
    if (product.stockQuantity === 0) return 'status-out';
    if (product.stockQuantity <= product.minStockLevel) return 'status-low';
    return 'status-ok';
  }

  // Validate sản phẩm
  private validateProduct(): boolean {
    if (!this.currentProduct.sku.trim()) {
      alert('Vui lòng nhập mã SKU');
      return false;
    }
    if (!this.currentProduct.name.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return false;
    }
    if (this.currentProduct.price <= 0) {
      alert('Giá bán phải lớn hơn 0');
      return false;
    }
    if (this.currentProduct.cost < 0) {
      alert('Giá vốn không được âm');
      return false;
    }
    if (this.currentProduct.stockQuantity < 0) {
      alert('Số lượng tồn kho không được âm');
      return false;
    }
    return true;
  }

  // Tạo sản phẩm rỗng
  private getEmptyProduct(): Product {
    return {
      sku: '',
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      cost: 0,
      price: 0,
      discountPrice: 0,
      stockQuantity: 0,
      minStockLevel: 10,
      weight: 0,
      dimensions: null
    };
  }

  // Tính giá trị tồn kho
  calculateStockValue(product: Product): number {
    return product.stockQuantity * product.cost;
  }

  // Format tiền tệ
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  // Object keys helper cho báo cáo
  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
}
