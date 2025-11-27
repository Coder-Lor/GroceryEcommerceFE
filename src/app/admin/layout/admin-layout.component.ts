import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../core/service/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MenuModule,
    AvatarModule,
    BadgeModule,
    RippleModule
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  isSidebarCollapsed = false;
  userName = 'Admin';
  userRole = 'Administrator';
  userAvatar = 'https://static.vecteezy.com/system/resources/previews/012/210/707/non_2x/worker-employee-businessman-avatar-profile-icon-vector.jpg';

  menuItems: MenuItem[] = [
    {
      items: [
        { label: 'Trang chủ', icon: 'pi pi-home', command: () => this.navigateTo('/admin/home') },
        { label: 'Người dùng', icon: 'pi pi-users', command: () => this.navigateTo('/admin/users') },
        { label: 'Kho hàng', icon: 'pi pi-box', command: () => this.navigateTo('/admin/inventory') },
        { label: 'Đơn hàng', icon: 'pi pi-shopping-bag', command: () => this.navigateTo('/admin/orders') },
        { label: 'Danh mục', icon: 'pi pi-list', command: () => this.navigateTo('/admin/categories') },
        { label: 'Voucher', icon: 'pi pi-ticket', command: () => this.navigateTo('/admin/vouchers') }
      ]
    }
  ];

  profileItems: MenuItem[] = [
    { label: 'Về trang người dùng', icon: 'pi pi-home', command: () => this.navigateTo('/home') },
    { label: 'Đăng xuất', icon: 'pi pi-sign-out', command: () => this.logout() }
  ];

  constructor() {
    this.authService.currentUser
      .pipe(takeUntilDestroyed())
      .subscribe((user) => {
        if (user?.username) {
          this.userName = user.username;
        }
        if (user?.email) {
          this.userRole = user.email;
        }
      });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onMenuItemSelect(event: Event, item: MenuItem) {
    event.preventDefault();
    event.stopPropagation();
    if (item.disabled) {
      return;
    }
    if (item.command) {
      item.command({ originalEvent: event, item });
    }
  }

  private navigateTo(path: string) {
    this.router.navigateByUrl(path);
  }

  private logout() {
    this.authService.logout().subscribe({
      complete: () => this.router.navigateByUrl('/login'),
      error: () => this.router.navigateByUrl('/login')
    });
  }
}
