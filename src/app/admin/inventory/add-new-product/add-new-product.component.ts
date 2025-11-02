import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faArrowLeft, 
  faXmark, 
  faSave, 
  faFolder,
  faCheck,
  faMagic,
  faImage,
  faTrash,
  faStar,
  faCloudUpload,
  faPlus,
  faPenToSquare,
  faCubes
} from '@fortawesome/free-solid-svg-icons';
import { 
  CategoryClient, 
  CategoryDto, 
  ResultOfListOfCategoryDto,
  CreateProductCommand,
  ProductClient,
  FileParameter,
  CreateProductVariantRequest
} from '@services/system-admin.service';
import { InventoryService } from '../../../core/service/inventory.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-add-new-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FaIconComponent, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
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

  // Image upload
  selectedImages: Array<{
    file: File;
    preview: string;
    altText: string;
    displayOrder: number;
    isPrimary: boolean;
  }> = [];
  isDragging: boolean = false;

  // Variants management
  variants: CreateProductVariantRequest[] = [];
  showVariantModal: boolean = false;
  variantMode: 'add' | 'edit' = 'add';
  currentVariant: CreateProductVariantRequest = new CreateProductVariantRequest();
  editingVariantIndex: number = -1;

  // Font Awesome icons
  faArrowLeft = faArrowLeft;
  faXmark = faXmark;
  faSave = faSave;
  faFolder = faFolder;
  faCheck = faCheck;
  faMagic = faMagic;
  faImage = faImage;
  faTrash = faTrash;
  faStar = faStar;
  faCloudUpload = faCloudUpload;
  faPlus = faPlus;
  faPenToSquare = faPenToSquare;
  faCubes = faCubes;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoryClient: CategoryClient,
    private inventoryService: InventoryService,
    private productClient: ProductClient,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
      // Basic Information
      name: ['', [Validators.required]],
      slug: [''],
      sku: ['', [Validators.required]],
      description: ['', [Validators.required]],
      shortDescription: [''],
      
      // Pricing
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [null],
      cost: [null],
      
      // Inventory
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      minStockLevel: [10, [Validators.required, Validators.min(0)]],
      
      // Physical Properties
      weight: [null],
      dimensions: [''],
      
      // Categorization
      categoryId: ['', [Validators.required]],
      brandId: [null],
      
      // Status & Features
      status: [1], // 1 = Active
      isFeatured: [false],
      isDigital: [false],
      
      // SEO
      metaTitle: [''],
      metaDescription: [''],
      
      // Images (arrays)
      imageFiles: [null],
      imageAltTexts: [[]],
      imageDisplayOrders: [[]],
      imageIsPrimary: [[]],
      
      // Related Data (arrays)
      variants: [[]],
      attributes: [[]],
      tagIds: [[]]
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
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể tải danh mục',
              life: 3000
            });
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi tải danh mục',
            life: 3000
          });
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
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        life: 3000
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    // Prepare image data as FileParameter[]
    const imageFiles: FileParameter[] | null = this.selectedImages.length > 0 
      ? this.selectedImages.map(img => ({
          data: img.file,
          fileName: img.file.name
        }))
      : null;
    
    const imageAltTexts: string[] | null = this.selectedImages.length > 0 
      ? this.selectedImages.map(img => img.altText)
      : null;
    
    const imageDisplayOrders: number[] | null = this.selectedImages.length > 0 
      ? this.selectedImages.map(img => img.displayOrder)
      : null;
    
    const imageIsPrimary: boolean[] | null = this.selectedImages.length > 0 
      ? this.selectedImages.map(img => img.isPrimary)
      : null;

    // Call the create method with all parameters
    this.productClient.create(
      formValue.name,
      formValue.slug || null,
      formValue.sku,
      formValue.description,
      formValue.shortDescription || null,
      formValue.price,
      formValue.discountPrice,
      formValue.cost,
      formValue.stockQuantity,
      formValue.minStockLevel,
      formValue.weight,
      formValue.dimensions || null,
      formValue.categoryId,
      formValue.brandId,
      formValue.status,
      formValue.isFeatured,
      formValue.isDigital,
      formValue.metaTitle || null,
      formValue.metaDescription || null,
      imageFiles,
      imageAltTexts,
      imageDisplayOrders,
      imageIsPrimary,
      this.variants.length > 0 ? this.variants : null,
      formValue.attributes && formValue.attributes.length > 0 ? formValue.attributes : null,
      formValue.tagIds && formValue.tagIds.length > 0 ? formValue.tagIds : null
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Thêm sản phẩm thành công!',
              life: 3000
            });
            // Refresh danh sách sản phẩm để cập nhật danh sách mới nhất
            this.inventoryService.refreshProducts();
            // Navigate sau khi toast hiển thị
            setTimeout(() => {
              this.router.navigate(['/admin/inventory']);
            }, 500);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: response.errorMessage || 'Không thể thêm sản phẩm',
              life: 3000
            });
            this.isSubmitting = false;
          }
        },
        error: (error: any) => {
          console.error('Error creating product:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi thêm sản phẩm',
            life: 3000
          });
          this.isSubmitting = false;
        }
      });
  }

  goBack(): void {
    if (this.productForm.dirty) {
      this.confirmationService.confirm({
        message: 'Bạn có thay đổi chưa lưu. Bạn có chắc muốn quay lại?',
        header: 'Xác nhận',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Có',
        rejectLabel: 'Không',
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-secondary p-button-text',
        defaultFocus: 'reject',
        accept: () => {
          this.router.navigate(['/admin/inventory']);
        }
      });
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
      'Sản phẩm được sản xuất từ nguyên liệu tự nhiên, không chất bảo quản, đảm bảo an toàn vệ sinh thực phẩm. Đây là lựa chọn hoàn hảo cho gia đình bạn.',
      'Đây là sản phẩm cao cấp, được chọn lọc kỹ càng từ những vùng nguyên liệu tốt nhất. Cam kết chất lượng và độ tươi ngon.',
      'Sản phẩm có nguồn gốc xuất xứ rõ ràng, được kiểm định chất lượng nghiêm ngặt theo tiêu chuẩn quốc tế. An toàn tuyệt đối cho người tiêu dùng.',
      'Được đóng gói cẩn thận, bảo quản trong điều kiện tối ưu để giữ độ tươi ngon. Giao hàng nhanh chóng, đảm bảo sản phẩm đến tay khách hàng trong tình trạng tốt nhất.',
      'Sản phẩm giàu dinh dưỡng, có lợi cho sức khỏe, phù hợp cho mọi lứa tuổi. Được các chuyên gia dinh dưỡng khuyên dùng.',
      'Được chế biến và đóng gói theo quy trình hiện đại, đảm bảo vệ sinh an toàn thực phẩm. Tuân thủ nghiêm ngặt các quy định về ATTP.',
      'Sản phẩm chất lượng cao, được nhiều gia đình Việt Nam tin dùng và lựa chọn. Thương hiệu uy tín trên thị trường.',
      'Hàng nhập khẩu chính hãng, có giấy tờ đầy đủ, đảm bảo chất lượng tốt nhất. Bảo hành và hỗ trợ khách hàng tận tình.'
    ];

    const metaTitles = [
      'Mua {name} Giá Tốt - Giao Hàng Nhanh',
      '{name} Chất Lượng Cao - Giá Cả Phải Chăng',
      '{name} - Sản Phẩm Được Yêu Thích Nhất',
      'Đặt {name} Online - Ưu Đãi Hấp Dẫn',
      '{name} Chính Hãng - Cam Kết Chất Lượng'
    ];

    const metaDescriptions = [
      'Mua {name} giá tốt nhất. Giao hàng nhanh, đảm bảo chất lượng. Nhiều khuyến mãi hấp dẫn. Đặt hàng ngay!',
      '{name} chất lượng cao, nguồn gốc rõ ràng. Giá cả phải chăng, giao hàng tận nơi. Mua ngay hôm nay!',
      'Đặt mua {name} online với giá ưu đãi. Sản phẩm chính hãng, bảo hành đầy đủ. Freeship toàn quốc.',
      '{name} - Sản phẩm được nhiều khách hàng tin dùng. Chất lượng đảm bảo, giá cả cạnh tranh.',
      'Mua {name} tại cửa hàng uy tín. Cam kết chất lượng, đổi trả dễ dàng. Giao hàng nhanh chóng.'
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
    const discountPrice = Math.random() > 0.5 ? Math.floor(price * 0.9) : null; // 10% discount randomly
    
    const stockQuantity = Math.floor(Math.random() * 500 + 50);
    const minStockLevel = Math.floor(Math.random() * 30 + 10);
    const weight = Math.round((Math.random() * 4900 + 100)) / 1000; // 0.1 - 5 kg
    
    const length = Math.floor(Math.random() * 300 + 50);
    const width = Math.floor(Math.random() * 200 + 50);
    const height = Math.floor(Math.random() * 150 + 30);
    const dimensions = `${length}x${width}x${height}`;

    // Generate meta tags
    const randomMetaTitle = metaTitles[Math.floor(Math.random() * metaTitles.length)].replace('{name}', randomProductName);
    const randomMetaDesc = metaDescriptions[Math.floor(Math.random() * metaDescriptions.length)].replace('{name}', randomProductName);

    // Random status (1 = Active, 2 = Draft, 3 = Archived)
    const statuses = [1, 1, 1, 2]; // Higher chance of Active
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    // Random features
    const isFeatured = Math.random() > 0.7; // 30% chance to be featured
    const isDigital = Math.random() > 0.9; // 10% chance to be digital

    // Select random category if available
    let randomCategory: CategoryDto | null = null;
    if (this.categories.length > 0) {
      const flatCategories = this.getFlatCategoryList(this.categories);
      const randomIndex = Math.floor(Math.random() * flatCategories.length);
      randomCategory = flatCategories[randomIndex].category;
    }

    // Patch form with generated data
    this.productForm.patchValue({
      // Basic Information
      name: randomProductName,
      slug: randomSlug,
      sku: randomSKU,
      description: randomDesc,
      shortDescription: randomShortDesc,
      
      // Pricing
      price: price,
      discountPrice: discountPrice,
      cost: cost,
      
      // Inventory
      stockQuantity: stockQuantity,
      minStockLevel: minStockLevel,
      
      // Physical Properties
      weight: weight,
      dimensions: dimensions,
      
      // Categorization
      categoryId: randomCategory?.categoryId || null,
      brandId: null,
      
      // Status & Features
      status: randomStatus,
      isFeatured: isFeatured,
      isDigital: isDigital,
      
      // SEO
      metaTitle: randomMetaTitle,
      metaDescription: randomMetaDesc,
      
      // Images and related data (empty arrays for now)
      imageFiles: null,
      imageAltTexts: [],
      imageDisplayOrders: [],
      imageIsPrimary: [],
      variants: [],
      attributes: [],
      tagIds: []
    });

    // Update selected category
    if (randomCategory) {
      this.selectedCategory = randomCategory;
    }

    // Mark form as dirty to enable validation display
    this.productForm.markAsDirty();
    
    // Show success message
    console.log('Đã sinh dữ liệu mẫu thành công!');
  }

  // Image upload methods
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = ''; // Reset input
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `${file.name} không phải là file ảnh`,
          life: 3000
        });
        return false;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `${file.name} vượt quá kích thước cho phép (5MB)`,
          life: 3000
        });
        return false;
      }
      return true;
    });

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const preview = e.target?.result as string;
        const newImage = {
          file: file,
          preview: preview,
          altText: '',
          displayOrder: this.selectedImages.length + 1,
          isPrimary: this.selectedImages.length === 0 // First image is primary by default
        };
        this.selectedImages.push(newImage);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    const removedImage = this.selectedImages[index];
    this.selectedImages.splice(index, 1);

    // Reorder remaining images
    this.selectedImages.forEach((img, idx) => {
      img.displayOrder = idx + 1;
    });

    // If removed image was primary, set first image as primary
    if (removedImage.isPrimary && this.selectedImages.length > 0) {
      this.selectedImages[0].isPrimary = true;
    }
  }

  setPrimaryImage(index: number): void {
    this.selectedImages.forEach((img, idx) => {
      img.isPrimary = idx === index;
    });
  }

  updateImageAltText(index: number, altText: string): void {
    this.selectedImages[index].altText = altText;
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('imageFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // ===== Variants Management Methods =====
  
  openAddVariantModal(): void {
    console.log('openAddVariantModal called');
    this.variantMode = 'add';
    this.currentVariant = new CreateProductVariantRequest();
    this.currentVariant.status = 1; // Active by default
    this.currentVariant.stockQuantity = 0;
    this.currentVariant.minStockLevel = 10;
    this.currentVariant.price = 0;
    this.editingVariantIndex = -1;
    this.showVariantModal = true;
    console.log('showVariantModal set to:', this.showVariantModal);
    console.log('currentVariant:', this.currentVariant);
  }

  openEditVariantModal(variant: CreateProductVariantRequest, index: number): void {
    this.variantMode = 'edit';
    this.currentVariant = CreateProductVariantRequest.fromJS(variant.toJSON());
    this.editingVariantIndex = index;
    this.showVariantModal = true;
  }

  closeVariantModal(): void {
    this.showVariantModal = false;
    this.currentVariant = new CreateProductVariantRequest();
    this.editingVariantIndex = -1;
  }

  saveVariant(): void {
    // Validate required fields
    if (!this.currentVariant.sku || !this.currentVariant.sku.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập SKU cho biến thể',
        life: 3000
      });
      return;
    }

    if (!this.currentVariant.price || this.currentVariant.price < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập giá hợp lệ cho biến thể',
        life: 3000
      });
      return;
    }

    if (this.currentVariant.stockQuantity === undefined || this.currentVariant.stockQuantity < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số lượng tồn kho hợp lệ',
        life: 3000
      });
      return;
    }

    // Check duplicate SKU
    const isDuplicateSku = this.variants.some((v, idx) => 
      v.sku === this.currentVariant.sku && 
      (this.variantMode === 'add' || idx !== this.editingVariantIndex)
    );

    if (isDuplicateSku) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'SKU biến thể đã tồn tại',
        life: 3000
      });
      return;
    }

    if (this.variantMode === 'add') {
      this.variants.push(CreateProductVariantRequest.fromJS(this.currentVariant.toJSON()));
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã thêm biến thể mới',
        life: 2000
      });
    } else {
      this.variants[this.editingVariantIndex] = CreateProductVariantRequest.fromJS(this.currentVariant.toJSON());
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã cập nhật biến thể',
        life: 2000
      });
    }

    this.closeVariantModal();
  }

  deleteVariant(index: number): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn xóa biến thể này?',
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary p-button-text',
      defaultFocus: 'reject',
      accept: () => {
        this.variants.splice(index, 1);
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã xóa biến thể',
          life: 2000
        });
      }
    });
  }

  getVariantStatusText(status: number | undefined): string {
    switch (status) {
      case 1: return 'Hoạt động';
      case 2: return 'Nháp';
      case 3: return 'Đã lưu trữ';
      default: return 'Không xác định';
    }
  }

  getVariantStatusClass(status: number | undefined): string {
    switch (status) {
      case 1: return 'status-active';
      case 2: return 'status-draft';
      case 3: return 'status-archived';
      default: return 'status-unknown';
    }
  }

  formatCurrency(value: number | undefined): string {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }
}
