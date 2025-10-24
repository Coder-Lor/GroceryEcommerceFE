import { Component } from '@angular/core';
import { Header } from "../../shared/components/header/header";
import { RouterModule } from "@angular/router";
import { Footer } from "../../shared/components/footer/footer";

@Component({
  selector: 'app-customer-page',
  imports: [Header, RouterModule, Footer],
  templateUrl: './customer-page.html',
  styleUrl: './customer-page.scss',
})
export class CustomerPage {

}
