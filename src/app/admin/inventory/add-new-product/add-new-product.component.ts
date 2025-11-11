import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
  Validators,
} from '@angular/forms';
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
  faCubes,
} from '@fortawesome/free-solid-svg-icons';
import {
  CategoryClient,
  CategoryDto,
  ResultOfListOfCategoryDto,
  CreateProductCommand,
  ProductClient,
  FileParameter,
  CreateProductVariantRequest,
} from '@services/system-admin.service';
import { InventoryService } from '../../../core/service/inventory.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-add-new-product',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FaIconComponent,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './add-new-product.component.html',
  styleUrls: ['./add-new-product.component.scss'],
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

  variants: CreateProductVariantRequest[] = [];
  showVariantModal: boolean = false;
  variantMode: 'add' | 'edit' = 'add';
  currentVariant: CreateProductVariantRequest = new CreateProductVariantRequest();
  editingVariantIndex: number = -1;
  variantImageFile: File | null = null;
  variantImagePreview: string | null = null;
  variantImages: Map<number, File> = new Map(); // Map variant index to image file
  variantImagePreviews: Map<number, string> = new Map(); // Map variant index to preview URL
  isVariantDragging: boolean = false;

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
      tagIds: [[]],
    });
  }

  loadCategories(): void {
    this.categoryClient
      .getCategoryTree()
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
              life: 3000,
            });
          }
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Có lỗi xảy ra khi tải danh mục',
            life: 3000,
          });
        },
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
        life: 3000,
      });
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    // Prepare image data as FileParameter[]
    const imageFiles: FileParameter[] | null =
      this.selectedImages.length > 0
        ? this.selectedImages.map((img) => ({
            data: img.file,
            fileName: img.file.name,
          }))
        : null;

    const imageAltTexts: string[] | null =
      this.selectedImages.length > 0 ? this.selectedImages.map((img) => img.altText) : null;

    const imageDisplayOrders: number[] | null =
      this.selectedImages.length > 0 ? this.selectedImages.map((img) => img.displayOrder) : null;

    const imageIsPrimary: boolean[] | null =
      this.selectedImages.length > 0 ? this.selectedImages.map((img) => img.isPrimary) : null;

    // Prepare data to send
    const variantsToSend = this.variants.length > 0 ? this.variants : null;
    const attributesToSend = formValue.attributes && formValue.attributes.length > 0 ? formValue.attributes : null;
    const tagIdsToSend = formValue.tagIds && formValue.tagIds.length > 0 ? formValue.tagIds : null;

    // Log data before sending to backend
    console.log('=== DATA BEING SENT TO BACKEND ===');
    console.log('Product Form Values:', formValue);
    console.log('Selected Images Count:', this.selectedImages.length);
    console.log('Image Files:', imageFiles?.map(f => ({ fileName: f.fileName, size: f.data.size })));
    console.log('Image Alt Texts:', imageAltTexts);
    console.log('Image Display Orders:', imageDisplayOrders);
    console.log('Image Is Primary:', imageIsPrimary);
    console.log('Variants Count:', this.variants.length);
    console.log('Variants Data:', variantsToSend);
    console.log('Variant Images Map:', Array.from(this.variantImages.entries()));
    console.log('Attributes:', attributesToSend);
    console.log('Tag IDs:', tagIdsToSend);
    console.log('Selected Category:', this.selectedCategory);
    console.log('==================================');

    // Call the create method with all parameters
    this.productClient
      .create(
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
        variantsToSend,
        attributesToSend,
        tagIdsToSend
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.isSuccess) {
            this.messageService.add({
              severity: 'success',
              summary: 'Thành công',
              detail: 'Thêm sản phẩm thành công!',
              life: 3000,
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
              life: 3000,
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
            life: 3000,
          });
          this.isSubmitting = false;
        },
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
        },
      });
    } else {
      this.router.navigate(['/admin/inventory']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
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
  getFlatCategoryList(
    categories: CategoryDto[],
    level: number = 0
  ): Array<{ category: CategoryDto; level: number }> {
    let result: Array<{ category: CategoryDto; level: number }> = [];

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
    // 1. Định nghĩa các khuôn mẫu sản phẩm (Product Templates)
    // Mỗi object chứa dữ liệu liên quan mật thiết đến nhau
    const productTemplates = [
      {
        name: 'Laptop Dell XPS 15 9530 (i9, 32GB, 1TB, RTX 4070)',
        shortDescription: 'Laptop cao cấp, màn hình 3.5K OLED, vỏ nhôm nguyên khối.',
        description: 'Trải nghiệm hiệu năng đỉnh cao với vi xử lý Intel Core i9-13900H, card đồ họa NVIDIA RTX 4070. Hoàn hảo cho sáng tạo nội dung và lập trình chuyên nghiệp. Thiết kế sang trọng, mỏng nhẹ.',
        baseCost: 45000000, // Giá gốc tham khảo
        weight: 1.9, // kg
        dimensions: '344x230x18', // mm
        metaTitle: 'Mua {name} Giá Tốt | Laptop XPS 15 2023 Chính Hãng',
        metaDescription: 'Đặt mua {name} chính hãng, trả góp 0%. Cấu hình mạnh mẽ, thiết kế sang trọng, bảo hành 12 tháng tại cửa hàng.',
      },
      {
        name: 'ASUS ROG Zephyrus G14 (R9, 32GB, 1TB, RTX 4060)',
        shortDescription: 'Laptop gaming mỏng nhẹ, màn hình 165Hz, tản nhiệt hiệu quả.',
        description: 'Chiến game mượt mà với AMD Ryzen 9 7940HS và RTX 4060. Thiết kế AniMe Matrix độc đáo, pin trâu, trọng lượng chỉ 1.72kg, lý tưởng cho game thủ di động.',
        baseCost: 38000000,
        weight: 1.72,
        dimensions: '312x227x20',
        metaTitle: 'Mua {name} | Laptop Gaming ROG G14 2023 Giá Rẻ',
        metaDescription: 'Sở hữu ngay {name}, laptop gaming mỏng nhẹ cấu hình khủng. Tản nhiệt tốt, màn hình 2K 165Hz, bảo hành 24 tháng.',
      },
      {
        name: 'iPhone 15 Pro Max 256GB (Titan Tự Nhiên)',
        shortDescription: 'Khung viền Titan, chip A17 Pro, 5x Telephoto camera, USB-C.',
        description: 'Siêu phẩm iPhone 15 Pro Max với khung Titan siêu bền nhẹ, chip A17 Pro mạnh mẽ nhất và hệ thống camera zoom quang 5x. Cổng sạc USB-C tiện lợi, quay video ProRes 4K.',
        baseCost: 29000000,
        weight: 0.221,
        dimensions: '159x76x8.25',
        metaTitle: '{name} Chính Hãng VN/A | Trả Góp 0%',
        metaDescription: 'Mua {name} Titan Tự Nhiên 256GB VN/A. Giá tốt nhất, bảo hành 12 tháng, thu cũ đổi mới trợ giá cao tại cửa hàng.',
      },
      {
        name: 'Samsung Galaxy S24 Ultra 512GB (Xám Titan)',
        shortDescription: 'Tích hợp Galaxy AI, S Pen chuyên nghiệp, camera 200MP.',
        description: 'Trải nghiệm Galaxy AI trên Samsung S24 Ultra. Khung Titan bền bỉ, S Pen tích hợp cho công việc, camera 200MP zoom 100x. Màn hình phẳng, hiệu năng Snapdragon 8 Gen 3 for Galaxy.',
        baseCost: 31000000,
        weight: 0.232,
        dimensions: '162x79x8.6',
        metaTitle: 'Samsung {name} 512GB | Kỷ Nguyên AI Mới',
        metaDescription: 'Đặt trước {name} 512GB, nhận ưu đãi độc quyền. Tích hợp AI, S Pen, camera 200MP, trả góp 0% qua thẻ tín dụng.',
      },
      {
        name: 'CPU Intel Core i9-14900K (24 Nhân 32 Luồng)',
        shortDescription: 'Vi xử lý mạnh nhất cho gaming và sáng tạo, socket LGA 1700.',
        description: 'CPU Intel Core i9-14900K thế hệ 14, tốc độ boost lên đến 6.0 GHz. Tương thích mainboard Z790/Z690. Yêu cầu tản nhiệt AIO 360mm trở lên để đạt hiệu suất tối đa.',
        baseCost: 14500000,
        weight: 0.1,
        dimensions: '45x37x5',
        metaTitle: 'CPU {name} Giá Tốt Nhất | Chính Hãng, Bảo Hành 3 Năm',
        metaDescription: 'Mua {name}, vi xử lý cao cấp cho PC. Hỗ trợ DDR5 và PCIe 5.0. Giao hàng toàn quốc, bảo hành 36 tháng.',
      },
      {
        name: 'Card Đồ Họa NVIDIA GeForce RTX 4080 Super 16GB',
        shortDescription: 'Card đồ họa cao cấp, 16GB GDDR6X, hiệu năng 4K vượt trội.',
        description: 'NVIDIA RTX 4080 Super 16GB mang lại trải nghiệm gaming 4K mượt mà với Ray Tracing và DLSS 3. Hiệu năng mạnh mẽ cho đồ họa 3D và render video. Phiên bản 3 fan tản nhiệt mát mẻ.',
        baseCost: 25000000,
        weight: 1.5,
        dimensions: '310x140x61',
        metaTitle: 'VGA {name} 16GB | Chơi Game 4K, Ray Tracing',
        metaDescription: 'Mua card {name} 16GB GDDR6X chính hãng (ASUS, GIGABYTE, MSI). Giá tốt, hiệu năng mạnh mẽ. Bảo hành 36 tháng.',
      },
      {
        name: 'RAM Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz',
        shortDescription: 'Kit RAM DDR5 32GB (2x16GB), bus 6000MHz, tản nhiệt nhôm.',
        description: 'Nâng cấp hiệu năng hệ thống với kit RAM Corsair Vengeance 32GB DDR5. Tốc độ bus 6000MHz C36, hỗ trợ Intel XMP 3.0. Tản nhiệt nhôm giúp hoạt động mát mẻ, ổn định.',
        baseCost: 2800000,
        weight: 0.15,
        dimensions: '135x35x7',
        metaTitle: 'RAM {name} DDR5 6000MHz Giá Tốt',
        metaDescription: 'Mua {name} chính hãng. Bus 6000MHz C36, tối ưu cho Intel Gen 13/14 và AMD Ryzen 7000. Bảo hành 3 năm.',
      },
      {
        name: 'Ổ Cứng SSD Samsung 990 Pro 2TB NVMe PCIe Gen4',
        shortDescription: 'SSD NVMe Gen4, tốc độ đọc 7450MB/s, ghi 6900MB/s.',
        description: 'Trải nghiệm tốc độ tối đa với SSD Samsung 990 Pro 2TB. Giao tiếp PCIe Gen4x4, tốc độ đọc/ghi siêu nhanh, lý tưởng để tải game và làm việc với file lớn. Độ bền (TBW) 1200TB.',
        baseCost: 4100000,
        weight: 0.05,
        dimensions: '80x22x2.3',
        metaTitle: 'SSD {name} 2TB Tốc Độ Cao | Chính Hãng',
        metaDescription: 'Mua {name} 2TB NVMe Gen4. Tốc độ đọc 7450MB/s. Bảo hành 5 năm chính hãng. Giá tốt nhất thị trường.',
      },
      {
        name: 'Tai Nghe Sony WH-1000XM5 (Chống Ồn Chủ Động)',
        shortDescription: 'Tai nghe không dây, chống ồn chủ động (ANC) hàng đầu.',
        description: 'Đắm chìm trong âm thanh với Sony WH-1000XM5. Công nghệ chống ồn tiên tiến nhất, chất âm Hi-Res Audio, thiết kế thoải mái, thời lượng pin 30 giờ. Kết nối Bluetooth 5.2.',
        baseCost: 6500000,
        weight: 0.25,
        dimensions: '200x180x70',
        metaTitle: 'Tai Nghe {name} | Chống Ồn Đỉnh Cao, Giá Tốt',
        metaDescription: 'Mua tai nghe {name} chính hãng. Chống ồn chủ động, âm thanh Hi-Res, pin 30 giờ. Trả góp 0%, giao hàng miễn phí.',
      },
      {
        name: 'Bàn Phím Cơ Keychron Q6 Pro (Full-size, Bluetooth)',
        shortDescription: 'Bàn phím cơ không dây, full-size, vỏ nhôm CNC, QMK/VIA.',
        description: 'Keychron Q6 Pro là bàn phím cơ full-size cao cấp. Vỏ nhôm CNC nguyên khối, kết nối Bluetooth 5.1 và có dây, Hotswap. Tương thích Mac và Windows. Trải nghiệm gõ tuyệt vời.',
        baseCost: 4200000,
        weight: 2.1,
        dimensions: '445x137x33',
        metaTitle: 'Bàn Phím Cơ {name} | Không Dây, Vỏ Nhôm, Hotswap',
        metaDescription: 'Đặt mua {name} chính hãng. Bàn phím cơ full-size cao cấp, hỗ trợ QMK/VIA, Hotswap, Bluetooth. Bảo hành 12 tháng.',
      },
    ];

    // 2. Chọn ngẫu nhiên một khuôn mẫu
    const template = productTemplates[Math.floor(Math.random() * productTemplates.length)];

    // 3. Helper function (giữ nguyên từ lần trước)
    const roundToThousand = (num: number) => Math.round(num / 1000) * 1000;

    // 4. Sinh dữ liệu dựa trên khuôn mẫu
    const randomProductName = template.name;
    const randomShortDesc = template.shortDescription;
    const randomDesc = template.description;
    const weight = template.weight;
    const dimensions = template.dimensions;

    // SKU và Slug (vẫn tạo ngẫu nhiên hoặc dựa trên tên)
    const randomSKU = `SKU${Math.floor(Math.random() * 900000) + 100000}`;
    const randomSlug = randomProductName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9\s-]/g, '') // Xóa ký tự đặc biệt
      .replace(/\s+/g, '-'); // Thay khoảng trắng bằng gạch nối

    // Sinh giá (dựa trên baseCost của khuôn mẫu + một chút ngẫu nhiên)
    const costVariance = 1 + (Math.random() * 0.1 - 0.05); // Biến động giá +/- 5%
    const cost = roundToThousand(template.baseCost * costVariance);

    const priceMarkup = 1.1 + Math.random() * 0.2; // Lợi nhuận 10-30%
    const price = roundToThousand(cost * priceMarkup);

    let discountPrice: number | null = null;
    if (Math.random() > 0.6) { // 40% cơ hội giảm giá
      const rawDiscountPrice = price * (0.9 + Math.random() * 0.09); // Giảm giá ngẫu nhiên 1-10%
      discountPrice = roundToThousand(rawDiscountPrice);
      if (discountPrice >= price) {
        discountPrice = price - 1000; // Đảm bảo giá giảm luôn thấp hơn
      }
    }

    // Tồn kho (vẫn ngẫu nhiên)
    const stockQuantity = Math.floor(Math.random() * 200 + 20); // Tồn kho 20-220
    const minStockLevel = Math.floor(Math.random() * 10 + 5); // Cảnh báo tồn kho 5-15

    // Meta (dựa trên khuôn mẫu)
    const randomMetaTitle = template.metaTitle.replace('{name}', randomProductName);
    const randomMetaDesc = template.metaDescription.replace('{name}', randomProductName);

    // Dữ liệu ngẫu nhiên khác (như cũ)
    const statuses = [1, 1, 1, 2]; // Higher chance of Active
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const isFeatured = Math.random() > 0.7; // 30% chance to be featured
    const isDigital = false; // Tech products are physical

    // Chọn Category (như cũ)
    let randomCategory: CategoryDto | null = null;
    if (this.categories.length > 0) {
      const flatCategories = this.getFlatCategoryList(this.categories);
      if (flatCategories.length > 0) {
        const randomIndex = Math.floor(Math.random() * flatCategories.length);
        randomCategory = flatCategories[randomIndex].category;
        // Tốt hơn nữa: Bạn có thể thêm 'categoryId' vào template để chọn đúng category
      }
    }

    // 5. Patch giá trị vào form
    this.productForm.patchValue({
      // Basic Information (từ template)
      name: randomProductName,
      slug: randomSlug,
      sku: randomSKU,
      description: randomDesc,
      shortDescription: randomShortDesc,

      // Pricing (từ template + ngẫu nhiên)
      price: price,
      discountPrice: discountPrice,
      cost: cost,

      // Inventory (ngẫu nhiên)
      stockQuantity: stockQuantity,
      minStockLevel: minStockLevel,

      // Physical Properties (từ template)
      weight: weight,
      dimensions: dimensions,

      // Categorization (như cũ)
      categoryId: randomCategory?.categoryId || null,
      brandId: null, // Có thể thêm brandId vào template

      // Status & Features (ngẫu nhiên)
      status: randomStatus,
      isFeatured: isFeatured,
      isDigital: isDigital,

      // SEO (từ template)
      metaTitle: randomMetaTitle,
      metaDescription: randomMetaDesc,

      // Dữ liệu khác
      imageFiles: null,
      imageAltTexts: [],
      imageDisplayOrders: [],
      imageIsPrimary: [],
      variants: [],
      attributes: [],
      tagIds: [],
    });

    // Cập nhật (như cũ)
    if (randomCategory) {
      this.selectedCategory = randomCategory;
    }
    this.productForm.markAsDirty();
    console.log(`Đã sinh dữ liệu mẫu (Liên quan) cho: ${randomProductName}`);
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
    const validFiles = files.filter((file) => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `${file.name} không phải là file ảnh`,
          life: 3000,
        });
        return false;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: `${file.name} vượt quá kích thước cho phép (5MB)`,
          life: 3000,
        });
        return false;
      }
      return true;
    });

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const preview = e.target?.result as string;
        const newImage = {
          file: file,
          preview: preview,
          altText: '',
          displayOrder: this.selectedImages.length + 1,
          isPrimary: this.selectedImages.length === 0, // First image is primary by default
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
    
    // Copy values from main product form
    const formValue = this.productForm.value;
    
    this.currentVariant.price = formValue.price || 0;
    this.currentVariant.discountPrice = formValue.discountPrice || null;
    this.currentVariant.stockQuantity = formValue.stockQuantity || 0;
    this.currentVariant.minStockLevel = formValue.minStockLevel || 10;
    this.currentVariant.weight = formValue.weight || null;
    this.currentVariant.dimensions = formValue.dimensions || null;
    this.currentVariant.status = formValue.status || 1; // Active by default
    
    this.editingVariantIndex = -1;
    this.variantImageFile = null;
    this.variantImagePreview = null;
    this.showVariantModal = true;
    console.log('showVariantModal set to:', this.showVariantModal);
    console.log('currentVariant with copied values:', this.currentVariant);
  }

  openEditVariantModal(variant: CreateProductVariantRequest, index: number): void {
    this.variantMode = 'edit';
    this.currentVariant = CreateProductVariantRequest.fromJS(variant.toJSON());
    this.editingVariantIndex = index;
    this.variantImageFile = null;
    this.variantImagePreview = variant.imageUrl || null;
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
        life: 3000,
      });
      return;
    }

    if (!this.currentVariant.price || this.currentVariant.price < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập giá hợp lệ cho biến thể',
        life: 3000,
      });
      return;
    }

    if (this.currentVariant.stockQuantity === undefined || this.currentVariant.stockQuantity < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Vui lòng nhập số lượng tồn kho hợp lệ',
        life: 3000,
      });
      return;
    }

    // Check duplicate SKU
    const isDuplicateSku = this.variants.some(
      (v, idx) =>
        v.sku === this.currentVariant.sku &&
        (this.variantMode === 'add' || idx !== this.editingVariantIndex)
    );

    if (isDuplicateSku) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'SKU biến thể đã tồn tại',
        life: 3000,
      });
      return;
    }

    if (this.variantMode === 'add') {
      const variantIndex = this.variants.length;
      this.variants.push(CreateProductVariantRequest.fromJS(this.currentVariant.toJSON()));
      
      // Store image file and preview if selected
      if (this.variantImageFile) {
        this.variantImages.set(variantIndex, this.variantImageFile);
        if (this.variantImagePreview) {
          this.variantImagePreviews.set(variantIndex, this.variantImagePreview);
        }
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã thêm biến thể mới',
        life: 2000,
      });
    } else {
      this.variants[this.editingVariantIndex] = CreateProductVariantRequest.fromJS(
        this.currentVariant.toJSON()
      );
      
      // Update image file and preview if changed
      if (this.variantImageFile) {
        this.variantImages.set(this.editingVariantIndex, this.variantImageFile);
        if (this.variantImagePreview) {
          this.variantImagePreviews.set(this.editingVariantIndex, this.variantImagePreview);
        }
      } else if (!this.variantImagePreview) {
        // Image was removed
        this.variantImages.delete(this.editingVariantIndex);
        this.variantImagePreviews.delete(this.editingVariantIndex);
        this.variants[this.editingVariantIndex].imageUrl = undefined;
      }
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã cập nhật biến thể',
        life: 2000,
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
          life: 2000,
        });
      },
    });
  }

  getVariantStatusText(status: number | undefined): string {
    switch (status) {
      case 1:
        return 'Hoạt động';
      case 2:
        return 'Nháp';
      case 3:
        return 'Đã lưu trữ';
      default:
        return 'Không xác định';
    }
  }

  getVariantStatusClass(status: number | undefined): string {
    switch (status) {
      case 1:
        return 'status-active';
      case 2:
        return 'status-draft';
      case 3:
        return 'status-archived';
      default:
        return 'status-unknown';
    }
  }

  formatCurrency(value: number | undefined): string {
    if (!value) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  getVariantImagePreview(index: number): string | null {
    // First check if there's a preview from uploaded file
    if (this.variantImagePreviews.has(index)) {
      return this.variantImagePreviews.get(index) || null;
    }
    // Then check if variant has imageUrl from DB
    if (this.variants[index]?.imageUrl) {
      return this.variants[index].imageUrl || null;
    }
    return null;
  }

  // Variant Image Upload Methods
  onVariantImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processVariantImageFile(file);
      input.value = ''; // Reset input
    }
  }

  onVariantDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVariantDragging = true;
  }

  onVariantDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVariantDragging = false;
  }

  onVariantDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isVariantDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processVariantImageFile(files[0]);
    }
  }

  private processVariantImageFile(file: File): void {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Vui lòng chọn file hình ảnh',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Kích thước ảnh không được vượt quá 5MB',
      });
      return;
    }

    this.variantImageFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      this.variantImagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  triggerVariantImageInput(): void {
    const fileInput = document.getElementById('variantImageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  removeVariantImage(): void {
    this.variantImageFile = null;
    this.variantImagePreview = null;
    this.currentVariant.imageUrl = undefined;
    
    // Reset file input
    const fileInput = document.getElementById('variantImageInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
