import { Component, inject } from '@angular/core';


@Component({
  selector: 'app-users-page',
  standalone: true,
  templateUrl: 'users-page.component.html',
  styles: [
    `:host { display: block; }`
  ],
  imports: []
})
export class UsersPageComponent {
}
