import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage } from 'ngx-image-cropper';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-image-cropper-dialog',
  standalone: true,
  imports: [CommonModule, ImageCropperComponent, DialogModule, ButtonModule],
  templateUrl: './image-cropper-dialog.component.html',
  styleUrls: ['./image-cropper-dialog.component.scss']
})
export class ImageCropperDialogComponent {
  @Output() imageCropped = new EventEmitter<string>();
  @Output() dialogClosed = new EventEmitter<void>();

  visible: boolean = false;
  imageChangedEvent: any = '';
  croppedImage: SafeUrl = '';

  constructor(private sanitizer: DomSanitizer) {}

  openDialog(event: any) {
    this.imageChangedEvent = event;
    this.visible = true;
  }

  imageCroppedEvent(event: ImageCroppedEvent) {
    if (event.objectUrl) {
      this.croppedImage = this.sanitizer.bypassSecurityTrustUrl(event.objectUrl);
    }
  }

  imageLoaded(image: LoadedImage) {
    console.log('Image loaded');
  }

  cropperReady() {
    console.log('Cropper ready');
  }

  loadImageFailed() {
    console.log('Load failed');
  }

  saveCroppedImage() {
    if (this.croppedImage) {
      this.imageCropped.emit(this.croppedImage as string);
      this.closeDialog();
    }
  }

  closeDialog() {
    this.visible = false;
    this.imageChangedEvent = '';
    this.croppedImage = '';
    this.dialogClosed.emit();
  }
}
