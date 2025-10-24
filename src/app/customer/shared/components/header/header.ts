import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilityPanel } from "./utility-panel/utility-panel";
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, UtilityPanel, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  isShowSidebar: boolean = false;
  isShowSubMenu: boolean = false;
  isShowSearchBox: boolean = false;
  isShowPanel: boolean = false;

  router: Router = inject(Router);


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
