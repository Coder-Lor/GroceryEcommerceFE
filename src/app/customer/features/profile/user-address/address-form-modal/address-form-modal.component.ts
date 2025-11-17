import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserAddress } from '../../../../../core/service/system-admin.service';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-address-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    ButtonModule,
    CheckboxModule,
  ],
  templateUrl: './address-form-modal.component.html',
  styleUrl: './address-form-modal.component.scss',
})
export class AddressFormModalComponent implements OnInit, OnChanges {
  @Input() address: UserAddress | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  addressForm!: FormGroup;
  isEditMode = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['address'] || changes['isOpen']) {
      if (this.isOpen) {
        if (this.address) {
          this.isEditMode = true;
          this.populateForm();
        } else {
          this.isEditMode = false;
          this.clearForm();
        }
      }
    }
  }

  initializeForm() {
    this.addressForm = this.fb.group({
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['', Validators.required],
      zipCode: ['', Validators.required],
      addressType: [0],
      isDefault: [false],
    });
  }

  populateForm() {
    if (this.address) {
      this.addressForm.patchValue({
        addressLine1: this.address.addressLine1,
        addressLine2: this.address.addressLine2,
        city: this.address.city,
        state: this.address.state,
        country: this.address.country,
        zipCode: this.address.zipCode,
        addressType: this.address.addressType,
        isDefault: this.address.isDefault,
      });
    }
  }

  clearForm() {
    this.addressForm.reset({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      addressType: 0,
      isDefault: false,
    });
  }

  onSubmit() {
    if (this.addressForm.valid) {
      const formData = {
        ...this.addressForm.value,
        addressId: this.address?.addressId,
      };
      this.save.emit(formData);
    }
  }

  onClose() {
    this.close.emit();
  }
}
