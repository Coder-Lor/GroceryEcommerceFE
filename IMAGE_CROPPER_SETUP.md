# Hướng dẫn cài đặt Image Cropper

## 1. Cài đặt thư viện ngx-image-cropper

Chạy lệnh sau trong terminal:

```bash
npm install ngx-image-cropper
```

## 2. Cấu trúc đã tạo

```
profile/
├── profile.ts
├── profile.html
├── profile.scss
└── image-cropper-dialog/
    ├── image-cropper-dialog.component.ts
    ├── image-cropper-dialog.component.html
    └── image-cropper-dialog.component.scss
```

## 3. Tính năng

### ✅ Crop ảnh theo hình vuông (1:1)
- `aspectRatio="1/1"` - Tỷ lệ khung hình vuông
- `roundCropper="true"` - Khung crop hình tròn
- `maintainAspectRatio="true"` - Giữ tỷ lệ khi resize

### ✅ Người dùng có thể chỉnh sửa
- Di chuyển vùng crop
- Phóng to/thu nhỏ ảnh
- Xoay, điều chỉnh vị trí

### ✅ UI đẹp với PrimeNG Dialog
- Dialog responsive
- Nút Lưu/Hủy
- Hiệu ứng hover trên avatar

## 4. Cách sử dụng

1. **Click vào avatar** trong profile → Hiện overlay "Thay đổi"
2. **Chọn ảnh** từ máy tính
3. **Dialog crop** mở ra với:
   - Khung crop hình tròn
   - Có thể kéo, zoom ảnh
   - Preview theo tỷ lệ 1:1
4. **Click "Lưu"** → Ảnh được crop và cập nhật avatar
5. **Click "Hủy"** → Đóng dialog

## 5. Tùy chỉnh

### Thay đổi kích thước output:
```typescript
[resizeToWidth]="400"  // Độ rộng ảnh output (px)
```

### Thay đổi kích thước tối thiểu:
```typescript
[cropperMinWidth]="200"  // Kích thước crop tối thiểu
```

### Không dùng khung tròn (dùng khung vuông):
```typescript
[roundCropper]="false"
```

### Thay đổi format output:
```typescript
format="jpeg"  // hoặc "png", "webp"
```

## 6. Upload lên server (tùy chọn)

Trong `profile.ts`, hàm `onImageCropped()`:

```typescript
onImageCropped(croppedImage: string) {
  this.user.avatar = croppedImage;
  
  // Upload lên server
  this.uploadService.uploadAvatar(croppedImage).subscribe({
    next: (response) => {
      console.log('Upload success:', response);
    },
    error: (error) => {
      console.error('Upload failed:', error);
    }
  });
}
```

## 7. Lưu ý

- ⚠️ Cần cài đặt `ngx-image-cropper` trước khi chạy
- ⚠️ Component sử dụng standalone mode (Angular 14+)
- ⚠️ Cần import ButtonModule từ PrimeNG nếu chưa có
- ✅ Ảnh được crop với tỷ lệ 1:1 (hình vuông)
- ✅ Người dùng có thể tùy chỉnh vị trí crop

## 8. Demo

**Trước khi crop:** Ảnh 6:4 (rectangle)
**Sau khi crop:** Ảnh 1:1 (square) - người dùng chọn vùng muốn giữ lại
