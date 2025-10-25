import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faArrowLeft, 
  faXmark, 
  faSave, 
  faFolder,
  faCheck,
  faMagic
} from '@fortawesome/free-solid-svg-icons';
import { 
  CategoryClient, 
  CategoryDto, 
  ResultOfListOfCategoryDto,
  CreateProductCommand,
  ProductClient
} from '@services/system-admin.service';
import { InventoryService } from '../../../core/service/inventory.service';

@Component({
  selector: 'app-add-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FaIconComponent],
  templateUrl: './add-new-product.component.html',
  styleUrls: ['./add-new-product.component.scss']
})
export class AddNewProductComponent implements OnInit, OnDestroy {
  productForm!: FormGroup;
  categories: CategoryDto[] = [];
  selectedCategory: CategoryDto | null = null;
  showCategoryModal: boolean = false;
  isSubmitting: boolean = false;
  private destroy$ = new Subject<void>();

  // Font Awesome icons
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faSave = faSave;
  faFolder = faFolder;
  faCheck = faCheck;
  faMagic = faMagic;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoryClient: CategoryClient,
    private inventoryService: InventoryService,
    private productClient: ProductClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required]],
      slug: [''],
      name: ['', [Validators.required]],
      shortDescription: [''],
      description: [''],
      cost: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [0, [Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [10, [Validators.required, Validators.min(0)]],
      weight: [0, [Validators.min(0)]],
      dimensions: [''],
      categoryId: [null, [Validators.required]]
    });
  }

  loadCategories(): void {
    this.categoryClient.getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ResultOfListOfCategoryDto) => {
          if (response.isSuccess && response.data) {
            this.categories = response.data;
          } else {
            alert(response.errorMessage || 'Không thể tải danh mục');
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          alert('Có lỗi xảy ra khi tải danh mục');
        }
      });
  }

  openCategoryModal(): void {
    this.showCategoryModal = true;
  }

  closeCategoryModal(): void {
    this.showCategoryModal = false;
  }

  selectCategory(category: CategoryDto): void {
    this.selectedCategory = category;
    this.productForm.patchValue({ categoryId: category.categoryId });
    this.closeCategoryModal();
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    this.productClient.create(
      formValue.name,
      formValue.slug,
      formValue.sku,
      formValue.description,
      formValue.shortDescription,
      formValue.price,
      formValue.discountPrice,
      formValue.cost,
      formValue.stockQuantity,
      formValue.minStockLevel,
      formValue.weight,
      formValue.dimensions,
      formValue.categoryId,
      null, // brandId
      1, // status (Active)
      false, // isFeatured
      false, // isDigital
      null, // metaTitle
      null, // metaDescription
      null, // imageFiles
      null, // imageAltTexts
      null, // imageDisplayOrders
      null, // imageIsPrimary
      null, // variants
      null, // attributes
      null  // tagIds
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess) {
            alert('Thêm sản phẩm thành công!');
            this.router.navigate(['/admin/inventory']);
          } else {
            alert(response.errorMessage || 'Không thể thêm sản phẩm');
            this.isSubmitting = false;
          }
        },
        error: (error: any) => {
          console.error('Error creating product:', error);
          alert('Có lỗi xảy ra khi thêm sản phẩm'); 
          this.isSubmitting = false;
        }
      });
  }

  goBack(): void {
    if (this.productForm.dirty) {
      if (confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn quay lại?')) {
        this.router.navigate(['/admin/inventory']);
      }
    } else {
      this.router.navigate(['/admin/inventory']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Trường này là bắt buộc';
    }
    if (field?.hasError('min')) {
      return 'Giá trị không được âm';
    }
    return '';
  }

  // Helper method to get flat category list for modal
  getFlatCategoryList(categories: CategoryDto[], level: number = 0): Array<{ category: CategoryDto, level: number }> {
    let result: Array<{ category: CategoryDto, level: number }> = [];
    
    for (const category of categories) {
      result.push({ category, level });
      
      if (category.subCategories && category.subCategories.length > 0) {
        result = result.concat(this.getFlatCategoryList(category.subCategories, level + 1));
      }
    }
    
    return result;
  }

  // Generate sample data
  generateSampleData(): void {
    // Sample product names with Vietnamese grocery items
    const productNames = [
      'Gạo Thơm ST25',
      'Sữa Tươi Vinamilk',
      'Trứng Gà Sạch',
      'Rau Cải Xanh Organic',
      'Thịt Ba Chỉ',
      'Cà Chua Đà Lạt',
      'Bánh Mì Sandwich',
      'Nước Mắm Phú Quốc',
      'Dầu Ăn Neptune',
      'Mì Gói Hảo Hảo',
      'Cà Phê G7',
      'Sữa Chua Vinamilk',
      'Khoai Tây Đà Lạt',
      'Táo Fuji Nhật',
      'Cam Sành Cao Phong',
      'Thịt Heo Xay',
      'Tôm Sú Tươi',
      'Rau Muống',
      'Bí Đỏ',
      'Dưa Hấu'
    ];

    const shortDescriptions = [
      'Sản phẩm chất lượng cao, nguồn gốc rõ ràng',
      'Hàng tươi mới, được nhập khẩu trực tiếp',
      'Sản phẩm organic, an toàn cho sức khỏe',
      'Được kiểm định chất lượng nghiêm ngặt',
      'Giá cả phải chăng, chất lượng tốt',
      'Sản phẩm được yêu thích nhất',
      'Hàng chính hãng, xuất xứ rõ ràng',
      'Sản phẩm bán chạy nhất tháng',
      'Được nhiều khách hàng tin dùng',
      'Chất lượng cao, giá cả hợp lý'
    ];

    const descriptions = [
      'Sản phẩm được sản xuất từ nguyên liệu tự nhiên, không chất bảo quản, đảm bảo an toàn vệ sinh thực phẩm.',
      'Đây là sản phẩm cao cấp, được chọn lọc kỹ càng từ những vùng nguyên liệu tốt nhất.',
      'Sản phẩm có nguồn gốc xuất xứ rõ ràng, được kiểm định chất lượng nghiêm ngặt theo tiêu chuẩn quốc tế.',
      'Được đóng gói cẩn thận, bảo quản trong điều kiện tối ưu để giữ độ tươi ngon.',
      'Sản phẩm giàu dinh dưỡng, có lợi cho sức khỏe, phù hợp cho mọi lứa tuổi.',
      'Được chế biến và đóng gói theo quy trình hiện đại, đảm bảo vệ sinh an toàn thực phẩm.',
      'Sản phẩm chất lượng cao, được nhiều gia đình Việt Nam tin dùng và lựa chọn.',
      'Hàng nhập khẩu chính hãng, có giấy tờ đầy đủ, đảm bảo chất lượng tốt nhất.'
    ];

    // Generate random data
    const randomProductName = productNames[Math.floor(Math.random() * productNames.length)];
    const randomShortDesc = shortDescriptions[Math.floor(Math.random() * shortDescriptions.length)];
    const randomDesc = descriptions[Math.floor(Math.random() * descriptions.length)];
    
    const randomSKU = `SKU${Math.floor(Math.random() * 900000) + 100000}`;
    const randomSlug = randomProductName.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, '-');
    
    const cost = Math.floor(Math.random() * 50000 + 10000);
    const price = Math.floor(cost * (1.2 + Math.random() * 0.5)); // 20-70% markup
    const discountPrice = Math.random() > 0.5 ? Math.floor(price * 0.9) : 0; // 10% discount
    
    const stockQuantity = Math.floor(Math.random() * 500 + 50);
    const minStockLevel = Math.floor(Math.random() * 30 + 10);
    const weight = Math.floor(Math.random() * 5000 + 100) / 1000; // 0.1 - 5 kg
    
    const length = Math.floor(Math.random() * 300 + 50);
    const width = Math.floor(Math.random() * 200 + 50);
    const height = Math.floor(Math.random() * 150 + 30);
    const dimensions = `${length}x${width}x${height}`;

    // Select random category if available
    let randomCategory: CategoryDto | null = null;
    if (this.categories.length > 0) {
      const flatCategories = this.getFlatCategoryList(this.categories);
      const randomIndex = Math.floor(Math.random() * flatCategories.length);
      randomCategory = flatCategories[randomIndex].category;
    }

    // Patch form with generated data
    this.productForm.patchValue({
      sku: randomSKU,
      slug: randomSlug,
      name: randomProductName,
      shortDescription: randomShortDesc,
      description: randomDesc,
      cost: cost,
      price: price,
      discountPrice: discountPrice,
      stockQuantity: stockQuantity,
      minStockLevel: minStockLevel,
      weight: weight,
      dimensions: dimensions,
      categoryId: randomCategory?.categoryId || null
    });

    // Update selected category
    if (randomCategory) {
      this.selectedCategory = randomCategory;
    }

    // Mark form as dirty to enable validation display
    this.productForm.markAsDirty();
  }
}
