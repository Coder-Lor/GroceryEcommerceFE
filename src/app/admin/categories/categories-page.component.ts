import { Component } from '@angular/core';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  template: `
    <h2>Quản lý danh mục</h2>
    <p>Tạo, chỉnh sửa, sắp xếp danh mục sản phẩm.</p>
  `,
  styles: [
    `:host { display: block; }`
  ]
})
export class CategoriesPageComponent {}
