import { Component, inject } from '@angular/core';
import { ToastModule, Toast } from 'primeng/toast';
import { Button } from "primeng/button";
import { MessageService } from 'primeng/api';
import { RippleModule, Ripple } from 'primeng/ripple';

@Component({
  selector: 'app-users-page',
  standalone: true,
  templateUrl: 'users-page.component.html',
  styles: [
    `:host { display: block; }`
  ],
  imports: [Toast, Button, Ripple]
})
export class UsersPageComponent {
  private messageService = inject(MessageService);

  show(): void {
    this.messageService.add({ severity: 'error', summary: 'Info', detail: 'Message Content', life: 3000 });
  }

}
