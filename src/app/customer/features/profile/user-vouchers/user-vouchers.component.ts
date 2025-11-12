import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-vouchers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-vouchers.component.html',
  styleUrl: './user-vouchers.component.scss',
})
export class UserVouchersComponent {
  vouchers = [
    {
      id: 1,
      code: 'SUMMER2024',
      title: 'Giảm giá mùa hè',
      description: 'Giảm 20% cho đơn hàng từ 500.000đ',
      discount: '20%',
      expiry: '2024-06-30',
      isUsed: false
    },
    {
      id: 2,
      code: 'FREESHIP50',
      title: 'Miễn phí vận chuyển',
      description: 'Miễn phí ship cho đơn hàng từ 300.000đ',
      discount: 'Free Ship',
      expiry: '2024-05-31',
      isUsed: false
    },
    {
      id: 3,
      code: 'WELCOME100',
      title: 'Chào mừng thành viên mới',
      description: 'Giảm 100.000đ cho đơn hàng đầu tiên',
      discount: '100.000đ',
      expiry: '2024-03-15',
      isUsed: true
    }
  ];

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
    console.log('Copied:', code);
    // Có thể thêm toast notification ở đây
  }

  useVoucher(voucher: any) {
    console.log('Use voucher:', voucher);
  }
}
