import { Component, inject, OnChanges, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { UtilityPanel } from './utility-panel/utility-panel';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { log } from 'console';
import { LogoutCommand } from '@core/service/system-admin.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UtilityPanel, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnChanges {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  isShowSidebar: boolean = false;
  isShowSubMenu: boolean = false;
  isShowSearchBox: boolean = false;
  isShowPanel: boolean = false;

  username: string = '';
  isLoggedIn$ = this.authService.isAuthenticated$;
  user$ = this.authService.currentUser;
  private refreshtoken: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.refreshtoken = new LogoutCommand({
          refreshToken: parsed.refreshToken ?? undefined,
        });
      }
    }
  }

  ngOnInit(): void {
    // this.authService.isAuthenticated$.subscribe((res) => {
    //   this.isLoggedIn = res;
    //   console.log(res);
    // });
    // this.authService.currentUser.subscribe((res) => {
    //   this.userName = res?.username ?? null;
    // });
  }
  ngOnChanges() {
    console.log(this.isLoggedIn$);
  }

  onLogout() {
    this.authService.logout(this.refreshtoken).subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('❌ Lỗi khi logout:', err);
        // Dù lỗi cũng clear localStorage để chắc chắn đăng xuất
        localStorage.clear();
        this.router.navigate(['/login']);
      },
    });
    // this.authService.isLoggedIn$.subscribe((res) => {
    //   this.isLoggedIn = res;
    // });
  }

  toggleSidebar() {
    this.isShowSidebar = !this.isShowSidebar;
  }

  togggleSubmenu() {
    this.isShowSubMenu = !this.isShowSubMenu;
  }

  toggleSearchBox() {
    this.isShowSearchBox = !this.isShowSearchBox;
  }

  toggleUtilPanel() {
    this.isShowPanel = !this.isShowPanel;
  }

  backToHomePage() {
    this.router.navigate(['']);
  }
}
