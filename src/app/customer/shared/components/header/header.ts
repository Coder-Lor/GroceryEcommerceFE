import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { UtilityPanel } from './utility-panel/utility-panel';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { log } from 'console';
import { LogoutCommand } from '@core/service/system-admin.service';
import { Ripple } from "primeng/ripple";

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

  @ViewChild('userMenu', { static: false }) userMenu!: ElementRef;

  isShowSidebar: boolean = false;
  isShowSubMenu: boolean = false;
  isShowSearchBox: boolean = false;
  isShowPanel: boolean = false;
  isOpen: boolean = false;

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

  redirectToProfile(): void {
    this.isOpen = !this.isOpen;
    this.router.navigate(['/profile']);
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
  toggleUserMenu(event: Event) {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    // Check if userMenu exists and click target is valid
    if (this.userMenu?.nativeElement && event.target instanceof Node) {
      const clickedInside = this.userMenu.nativeElement.contains(event.target);
      if (!clickedInside) {
        this.isOpen = false;
      }
    }
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

  onSearch(rawQuery: string) {
    const query = (rawQuery ?? '').trim();
    if (!query) {
      this.router.navigate(['/product-list'], { queryParams: {} });
      return;
    }
    this.router.navigate(['/product-list'], { queryParams: { search: query } });
  }
}
