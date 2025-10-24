import { Component } from '@angular/core';

@Component({
  selector: 'app-users-page',
  standalone: true,
  template: `
    <h2>Quản lý người dùng</h2>
    <p>Danh sách người dùng, thêm mới, chỉnh sửa, xóa.</p>
  `,
  styles: [
    `:host { display: block; }`
  ]
})
export class UsersPageComponent {}
