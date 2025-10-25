import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilityPanel } from './utility-panel/utility-panel';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/service/auth.service';
import { log } from 'console';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UtilityPanel, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  isShowSidebar: boolean = false;
  isShowSubMenu: boolean = false;
  isShowSearchBox: boolean = false;
  isShowPanel: boolean = false;

  username: string = '';
  isLoggedIn: boolean = false;

  userName: string | null = null;

  ngOnInit(): void {
    this.authService.isLoggedIn$.subscribe((res) => {
      this.isLoggedIn = res;
    });
    this.authService.currentUser$.subscribe((res) => {
      this.userName = res?.name ?? null;
    });
  }

  onLogout() {
    this.authService.logout();
    this.authService.isLoggedIn$.subscribe((res) => {
      this.isLoggedIn = res;
    });
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
