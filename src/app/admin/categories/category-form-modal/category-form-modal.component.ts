import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { faXmark, faCloudArrowUp, faTrash, faImage } from '@fortawesome/free-solid-svg-icons';
import {
  CreateCategoryCommand,
  UpdateCategoryCommand,
  CategoryDto
} from '../../../core/service/system-admin.service';
import { ImageUploadService } from '../../../core/service/image-upload.service';

@Component({
  selector: 'app-category-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './category-form-modal.component.html',
  styleUrls: ['./category-form-modal.component.scss']
})
export class CategoryFormModalComponent implements OnInit {
  @Input() show: boolean = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() category!: CreateCategoryCommand | UpdateCategoryCommand;
  @Input() allCategories: CategoryDto[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{category: CreateCategoryCommand | UpdateCategoryCommand, imageFile: File | null}>();

  // Icons
  faXmark = faXmark;
  faCloudArrowUp = faCloudArrowUp;
  faTrash = faTrash;
  faImage = faImage;

  // Image upload
  imageFile: File | null = null;
  imagePreview: string | null = null;
  isDragging: boolean = false;

  constructor(private imageUploadService: ImageUploadService) {}

  ngOnInit(): void {
    // Load existing image if in edit mode
    if (this.mode === 'edit') {
      const updateCmd = this.category as UpdateCategoryCommand;
      if (updateCmd.imageUrl) {
        this.imagePreview = updateCmd.imageUrl;
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit({
      category: this.category,
      imageFile: this.imageFile
    });
  }

  // File upload handlers
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validate file
    const validation = this.imageUploadService.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    this.imageFile = file;

    // Create preview
    this.imageUploadService.createPreviewUrl(file)
      .then(preview => {
        this.imagePreview = preview;
      })
      .catch(error => {
        alert('Không thể tạo preview: ' + error);
      });
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview = null;
    // Only UpdateCategoryCommand has imageUrl property
    if (this.mode === 'edit') {
      (this.category as UpdateCategoryCommand).imageUrl = undefined;
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    fileInput?.click();
  }

  generateSlug(): void {
    if (this.category.name) {
      this.category.slug = this.category.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();
    }
  }
}
