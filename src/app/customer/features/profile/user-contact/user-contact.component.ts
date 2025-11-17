import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-contact.component.html',
  styleUrl: './user-contact.component.scss',
})
export class UserContactComponent {
  messages = [
    {
      id: 1,
      subject: 'Đơn hàng của bạn đã được giao',
      content: 'Đơn hàng #12345 đã được giao thành công. Cảm ơn bạn đã mua hàng!',
      date: '2024-01-15',
      isRead: true
    },
    {
      id: 2,
      subject: 'Khuyến mãi đặc biệt cho bạn',
      content: 'Giảm giá 20% cho tất cả sản phẩm. Áp dụng từ ngày 20/01 đến 25/01.',
      date: '2024-01-14',
      isRead: false
    },
    {
      id: 3,
      subject: 'Xác nhận đơn hàng #12344',
      content: 'Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị.',
      date: '2024-01-13',
      isRead: true
    }
  ];

  markAsRead(message: any) {
    message.isRead = true;
  }

  deleteMessage(message: any) {
    this.messages = this.messages.filter(m => m.id !== message.id);
  }
}
