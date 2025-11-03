import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface UploadResult {
  url: string;
  fileName: string;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  
  /**
   * Upload image to server
   * TODO: Replace with actual API endpoint
   */
  uploadImage(file: File): Observable<UploadResult> {
    return from(this.uploadToServer(file));
  }

  /**
   * Validate image file
   */
  validateImage(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return {
        valid: false,
        error: 'Vui lòng chọn file ảnh (jpg, png, gif, webp,...)'
      };
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Kích thước file không được vượt quá 5MB'
      };
    }

    return { valid: true };
  }

  /**
   * Create image preview URL
   */
  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = () => {
        reject('Không thể đọc file ảnh');
      };
      reader.readAsDataURL(file);
    });
  }

  private async uploadToServer(file: File): Promise<UploadResult> {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, return base64 as placeholder
    // In production, replace this with actual upload to server/cloud
    const base64 = await this.createPreviewUrl(file);
    
    return {
      url: base64,
      fileName: file.name,
      size: file.size
    };
  }
}
