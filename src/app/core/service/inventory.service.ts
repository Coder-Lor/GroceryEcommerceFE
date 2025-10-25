import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Product, InventoryReport } from '../../admin/inventory/models/product.model';
import { ProductBaseResponse } from '@services/system-admin.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private productsSubject = new BehaviorSubject<Product[]>(this.getMockProducts());
  public products$ = this.productsSubject.asObservable();
  
  private nextId = 8;

  constructor() {}

  // Lấy danh sách sản phẩm
  getProducts(): Observable<Product[]> {
    return this.products$;
  }

  // Lấy sản phẩm theo ID
  getProductById(id: number): Product | undefined {
    return this.productsSubject.value.find(p => p.productId === id.toString());
  }

  // Thêm sản phẩm mới
  addProduct(product: Product): void {
    const products = this.productsSubject.value;
    const newProduct = ProductBaseResponse.fromJS({
      ...product.toJSON(),
      productId: (this.nextId++).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.productsSubject.next([...products, newProduct]);
  }

  // Cập nhật sản phẩm
  updateProduct(id: number, product: Partial<Product>): void {
    const products = this.productsSubject.value;
    const index = products.findIndex(p => p.productId === id.toString());
    if (index !== -1) {
      products[index] = ProductBaseResponse.fromJS({
        ...products[index].toJSON(),
        ...product,
        updatedAt: new Date()
      });
      this.productsSubject.next([...products]);
    }
  }

  // Xóa sản phẩm
  deleteProduct(id: number): void {
    const products = this.productsSubject.value.filter(p => p.productId !== id.toString());
    this.productsSubject.next(products);
  }

  // Tạo báo cáo kho hàng
  generateReport(): InventoryReport {
    const products = this.productsSubject.value;
    
    return {
      totalProducts: products.length,
      totalStockValue: products.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.cost || 0)), 0),
      lowStockProducts: products.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 0) && (p.stockQuantity || 0) > 0).length,
      outOfStockProducts: products.filter(p => (p.stockQuantity || 0) === 0).length,
      productsByCategory: this.groupProductsByPriceRange(products)
    };
  }

  // Nhóm sản phẩm theo khoảng giá
  private groupProductsByPriceRange(products: Product[]): { [key: string]: number } {
    return products.reduce((acc, product) => {
      let range: string;
      const price = product.price || 0;
      if (price < 100000) {
        range = 'Dưới 100k';
      } else if (price < 500000) {
        range = '100k - 500k';
      } else if (price < 1000000) {
        range = '500k - 1tr';
      } else {
        range = 'Trên 1tr';
      }
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  // Dữ liệu mẫu để test
  private getMockProducts(): Product[] {
    return [
      ProductBaseResponse.fromJS({
        productId: '1',
        sku: 'HW-EPH-007',
        name: 'Tai Nghe Không Dây Cao Cấp',
        slug: 'tai-nghe-khong-day-cao-cap',
        shortDescription: 'Tai nghe chống ồn, thời lượng pin 20h.',
        description: 'Đây là mô tả chi tiết và đầy đủ về sản phẩm này.',
        cost: 15.50,
        price: 49.99,
        discountPrice: 35.00,
        stockQuantity: 150,
        minStockLevel: 10,
        weight: 0.35,
        dimensions: undefined,
        createdAt: new Date('2025-01-15'),
        updatedAt: new Date('2025-01-15')
      }),
      ProductBaseResponse.fromJS({
        productId: '2',
        sku: 'PHONE-IP15-PRO',
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        shortDescription: 'Điện thoại flagship mới nhất của Apple.',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR.',
        cost: 25000000,
        price: 35000000,
        discountPrice: 33000000,
        stockQuantity: 25,
        minStockLevel: 5,
        weight: 0.221,
        dimensions: '159.9 x 76.7 x 8.25 mm',
        createdAt: new Date('2025-02-01'),
        updatedAt: new Date('2025-02-01')
      }),
      ProductBaseResponse.fromJS({
        productId: '3',
        sku: 'LAP-DELL-XPS13',
        name: 'Dell XPS 13',
        slug: 'dell-xps-13',
        shortDescription: 'Laptop cao cấp nhỏ gọn, mạnh mẽ.',
        description: 'Dell XPS 13 với Intel Core i7 thế hệ 13, RAM 16GB, SSD 512GB, màn hình 13.4 inch FHD+.',
        cost: 18000000,
        price: 25000000,
        discountPrice: 23000000,
        stockQuantity: 8,
        minStockLevel: 3,
        weight: 1.2,
        dimensions: '296 x 199 x 15 mm',
        createdAt: new Date('2025-03-10'),
        updatedAt: new Date('2025-03-10')
      }),
      ProductBaseResponse.fromJS({
        productId: '4',
        sku: 'WATCH-APPLE-S9',
        name: 'Apple Watch Series 9',
        slug: 'apple-watch-series-9',
        shortDescription: 'Smartwatch thông minh với nhiều tính năng sức khỏe.',
        description: 'Apple Watch Series 9 với chip S9, màn hình luôn bật, theo dõi sức khỏe toàn diện.',
        cost: 7000000,
        price: 10000000,
        discountPrice: 9500000,
        stockQuantity: 45,
        minStockLevel: 10,
        weight: 0.042,
        dimensions: '45 x 38 x 10.7 mm',
        createdAt: new Date('2025-04-05'),
        updatedAt: new Date('2025-04-05')
      }),
      ProductBaseResponse.fromJS({
        productId: '5',
        sku: 'KB-MECH-RGB',
        name: 'Bàn Phím Cơ RGB',
        slug: 'ban-phim-co-rgb',
        shortDescription: 'Bàn phím cơ gaming với đèn RGB.',
        description: 'Bàn phím cơ với switch blue, đèn LED RGB 16 triệu màu, chống nước.',
        cost: 800000,
        price: 1500000,
        discountPrice: 1200000,
        stockQuantity: 2,
        minStockLevel: 5,
        weight: 1.1,
        dimensions: '440 x 135 x 35 mm',
        createdAt: new Date('2025-05-20'),
        updatedAt: new Date('2025-05-20')
      }),
      ProductBaseResponse.fromJS({
        productId: '6',
        sku: 'MOUSE-LOG-MX',
        name: 'Chuột Logitech MX Master 3S',
        slug: 'chuot-logitech-mx-master-3s',
        shortDescription: 'Chuột không dây cao cấp cho dân văn phòng.',
        description: 'Chuột Logitech MX Master 3S với cảm biến 8000 DPI, pin 70 ngày, kết nối đa thiết bị.',
        cost: 1500000,
        price: 2500000,
        discountPrice: 2200000,
        stockQuantity: 30,
        minStockLevel: 8,
        weight: 0.141,
        dimensions: '124.9 x 84.3 x 51 mm',
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date('2025-06-15')
      }),
      ProductBaseResponse.fromJS({
        productId: '7',
        sku: 'CAM-WEBCAM-HD',
        name: 'Webcam Full HD 1080p',
        slug: 'webcam-full-hd-1080p',
        shortDescription: 'Webcam cho họp online chất lượng cao.',
        description: 'Webcam 1080p với micro tích hợp, tự động lấy nét, góc quay 90 độ.',
        cost: 500000,
        price: 900000,
        discountPrice: 750000,
        stockQuantity: 0,
        minStockLevel: 5,
        weight: 0.15,
        dimensions: '90 x 60 x 50 mm',
        createdAt: new Date('2025-07-01'),
        updatedAt: new Date('2025-07-01')
      })
    ];
  }
}
