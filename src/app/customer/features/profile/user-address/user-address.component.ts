import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-address',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-address.component.html',
  styleUrl: './user-address.component.scss',
})
export class UserAddressComponent {
  addresses = [
    {
      id: 1,
      name: 'Địa chỉ nhà riêng',
      fullAddress: 'Bangladesh Embassy, Washington, DC 20008',
      phone: '+000 11122 2345 657',
      isDefault: true
    },
    {
      id: 2,
      name: 'Địa chỉ văn phòng',
      fullAddress: '123 Main Street, New York, NY 10001',
      phone: '+000 11122 2345 658',
      isDefault: false
    }
  ];

  addNewAddress() {
    console.log('Add new address');
  }

  editAddress(address: any) {
    console.log('Edit address:', address);
  }

  deleteAddress(address: any) {
    console.log('Delete address:', address);
  }

  setDefaultAddress(address: any) {
    this.addresses.forEach(a => a.isDefault = false);
    address.isDefault = true;
  }
}
