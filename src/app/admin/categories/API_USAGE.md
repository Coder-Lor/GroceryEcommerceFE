# Category API Usage Guide - Updated

## API Methods Overview

| Method | Endpoint | Khi nào dùng | File Upload | Return Type |
|--------|----------|--------------|-------------|-------------|
| `createCategoryWithFile()` | POST `/create-with-file` | Thêm mới danh mục | ✅ Có | `ResultOfCreateCategoryResponse` |
| `updateCategory()` | PUT `/update` | Update không đổi ảnh | ❌ Không | `ResultOfUpdateCategoryResponse` |
| `updateCategoryWithFile()` | PUT `/update-with-file` | Update có ảnh mới | ✅ Có | `ResultOfBoolean` |

---

## 1. Create Category With File

**Sử dụng khi**: Thêm danh mục mới (có thể có hoặc không có ảnh)

### Signature
```typescript
createCategoryWithFile(
  name: string,                          // Required
  slug: string | null,                   // Optional
  description: string | null,            // Optional
  image: FileParameter | null,           // Optional - File ảnh
  metaTitle: string | null,              // Optional
  metaDescription: string | null,        // Optional
  parentCategoryId: string | null,       // Optional
  status: number,                        // Required (0 hoặc 1)
  displayOrder: number                   // Required (>= 0)
): Observable<ResultOfCreateCategoryResponse>
```

### Example
```typescript
// Tạo FileParameter nếu có ảnh
let imageParam: FileParameter | null = null;
if (imageFile) {
  imageParam = {
    data: imageFile,
    fileName: imageFile.name
  };
}

// Gọi API
this.categoryClient.createCategoryWithFile(
  'Trái cây',           // name
  'trai-cay',           // slug
  'Mô tả',              // description
  imageParam,           // image
  'SEO Title',          // metaTitle
  'SEO Description',    // metaDescription
  null,                 // parentCategoryId
  1,                    // status (1 = active)
  0                     // displayOrder
).subscribe({
  next: (response) => {
    if (response.isSuccess) {
      console.log('Created:', response.data);
    }
  }
});
```

---

## 2. Update Category (No Image Change)

**Sử dụng khi**: Cập nhật thông tin danh mục KHÔNG thay đổi ảnh

### Signature
```typescript
updateCategory(
  request: UpdateCategoryCommand
): Observable<ResultOfUpdateCategoryResponse>
```

### UpdateCategoryCommand Structure
```typescript
interface UpdateCategoryCommand {
  categoryId: string;        // Required
  name: string;              // Required
  slug: string;              // Required
  description?: string;
  imageUrl?: string;         // Giữ nguyên URL cũ (không thay đổi)
  metaTitle?: string;
  metaDescription?: string;
  parentCategoryId?: string;
  status: number;            // Required
  displayOrder: number;      // Required
}
```

### Example
```typescript
const updateCmd = new UpdateCategoryCommand();
updateCmd.categoryId = 'abc-123';
updateCmd.name = 'Trái cây tươi';
updateCmd.slug = 'trai-cay-tuoi';
updateCmd.imageUrl = 'https://old-image.jpg';  // Giữ nguyên
updateCmd.status = 1;
updateCmd.displayOrder = 0;

this.categoryClient.updateCategory(updateCmd)
  .subscribe({
    next: (response) => {
      if (response.isSuccess) {
        console.log('Updated:', response.data);
      }
    }
  });
```

---

## 3. Update Category With File (With Image Change)

**Sử dụng khi**: Cập nhật danh mục CÓ thay đổi ảnh

### Signature
```typescript
updateCategoryWithFile(
  categoryId: string,                    // Required
  name: string,                          // Required
  slug: string | null,                   // Optional
  description: string | null,            // Optional
  image: FileParameter | null,           // Optional - File ảnh MỚI
  metaTitle: string | null,              // Optional
  metaDescription: string | null,        // Optional
  parentCategoryId: string | null,       // Optional
  status: number,                        // Required
  displayOrder: number                   // Required
): Observable<ResultOfBoolean>
```

### Example
```typescript
const imageParam: FileParameter = {
  data: newImageFile,
  fileName: newImageFile.name
};

this.categoryClient.updateCategoryWithFile(
  'abc-123',              // categoryId
  'Trái cây tươi',        // name
  'trai-cay-tuoi',        // slug
  'Mô tả mới',            // description
  imageParam,             // image MỚI
  'SEO Title',            // metaTitle
  'SEO Description',      // metaDescription
  null,                   // parentCategoryId
  1,                      // status
  0                       // displayOrder
).subscribe({
  next: (response) => {
    if (response.isSuccess) {
      console.log('Updated with new image');
    }
  }
});
```

---

## FileParameter Structure

```typescript
interface FileParameter {
  data: File;           // File object từ <input type="file">
  fileName: string;     // Tên file
}
```

**Cách tạo:**
```typescript
const file: File = /* from input element */;
const fileParam: FileParameter = {
  data: file,
  fileName: file.name
};
```

---

## Implementation Flow

### Flow 1: Thêm danh mục mới (Add)

```
User điền form + chọn ảnh → Modal
            ↓
    emit {category, imageFile}
            ↓
    Validate form
            ↓
    Tạo FileParameter (nếu có ảnh)
            ↓
    createCategoryWithFile(
        name, slug, description, 
        imageParam,  ← File upload
        metaTitle, metaDescription,
        parentCategoryId, status, displayOrder
    )
            ↓
    Backend upload ảnh + lưu category
            ↓
    Response với imageUrl đã được lưu
```

### Flow 2: Cập nhật KHÔNG có ảnh mới (Update - No Image)

```
User sửa thông tin (không đổi ảnh) → Modal
            ↓
    emit {category, imageFile: null}
            ↓
    Validate form
            ↓
    submitUpdateCategory(updateCmd, null)
            ↓
    imageFile === null
            ↓
    updateCategory(updateCmd)
            ↓
    updateCmd.imageUrl giữ nguyên
            ↓
    Backend cập nhật các field khác
            ↓
    Ảnh không thay đổi
```

### Flow 3: Cập nhật CÓ ảnh mới (Update - With Image)

```
User sửa thông tin + chọn ảnh mới → Modal
            ↓
    emit {category, imageFile: File}
            ↓
    Validate form
            ↓
    submitUpdateCategory(updateCmd, imageFile)
            ↓
    imageFile !== null
            ↓
    Tạo FileParameter
            ↓
    updateCategoryWithFile(
        categoryId, name, slug, description,
        imageParam,  ← File mới
        metaTitle, metaDescription,
        parentCategoryId, status, displayOrder
    )
            ↓
    Backend upload ảnh mới + cập nhật
            ↓
    Ảnh cũ bị thay thế bởi ảnh mới
```

---

## Code Implementation

### In CategoriesPageComponent

```typescript
saveCategory(data: {category: CreateCategoryCommand | UpdateCategoryCommand, imageFile: File | null}): void {
  if (!this.validateCategory()) return;
  
  this.isLoading = true;

  if (this.modalMode === 'add') {
    // ADD MODE: Dùng createCategoryWithFile
    const createCmd = data.category as CreateCategoryCommand;
    
    let imageParam: FileParameter | null = null;
    if (data.imageFile) {
      imageParam = {
        data: data.imageFile,
        fileName: data.imageFile.name
      };
    }

    this.categoryClient.createCategoryWithFile(
      createCmd.name,
      createCmd.slug,
      createCmd.description,
      imageParam,
      createCmd.metaTitle,
      createCmd.metaDescription,
      createCmd.parentCategoryId,
      createCmd.status,
      createCmd.displayOrder
    ).subscribe(...);
    
  } else {
    // EDIT MODE: Gọi submitUpdateCategory
    const updateCmd = data.category as UpdateCategoryCommand;
    this.submitUpdateCategory(updateCmd, data.imageFile);
  }
}

private submitUpdateCategory(updateCmd: UpdateCategoryCommand, imageFile: File | null): void {
  if (imageFile) {
    // CÓ ẢNH MỚI: Dùng updateCategoryWithFile
    const imageParam: FileParameter = {
      data: imageFile,
      fileName: imageFile.name
    };

    this.categoryClient.updateCategoryWithFile(
      updateCmd.categoryId,
      updateCmd.name,
      updateCmd.slug,
      updateCmd.description,
      imageParam,  // ← Ảnh mới
      updateCmd.metaTitle,
      updateCmd.metaDescription,
      updateCmd.parentCategoryId,
      updateCmd.status,
      updateCmd.displayOrder
    ).subscribe(...);
    
  } else {
    // KHÔNG CÓ ẢNH MỚI: Dùng updateCategory
    this.categoryClient.updateCategory(updateCmd)
      .subscribe(...);
  }
}
```

---

## Validation Rules

### Required Fields
- `name`: Tên danh mục
- `slug`: URL slug
- `status`: 0 (ẩn) hoặc 1 (hiện)
- `displayOrder`: >= 0

### Optional Fields
- `description`
- `image/imageUrl`
- `metaTitle`
- `metaDescription`
- `parentCategoryId` (null = root category)

### File Validation
- **Type**: image/* (jpg, png, gif, webp,...)
- **Size**: <= 5MB
- Validated ở client bởi `ImageUploadService`

---

## Error Handling

```typescript
this.categoryClient.createCategoryWithFile(...)
  .subscribe({
    next: (response) => {
      if (response.isSuccess) {
        // ✅ Success
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã thêm danh mục'
        });
      } else {
        // ❌ API Error
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: response.errorMessage
        });
      }
    },
    error: (error) => {
      // ❌ HTTP Error
      console.error('Error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Lỗi kết nối'
      });
    }
  });
```

---

## Response Structures

### CreateCategoryResponse
```typescript
interface ResultOfCreateCategoryResponse {
  isSuccess: boolean;
  data?: {
    categoryId: string;
    name: string;
    slug: string;
    imageUrl?: string;  // URL ảnh đã được upload
    status: number;
    // ... other fields
  };
  errorMessage?: string;
}
```

### UpdateCategoryResponse
```typescript
interface ResultOfUpdateCategoryResponse {
  isSuccess: boolean;
  data?: {
    categoryId: string;
    name: string;
    slug: string;
    imageUrl?: string;  // URL ảnh (mới hoặc cũ)
    status: number;
    // ... other fields
  };
  errorMessage?: string;
}
```

### UpdateWithFileResponse
```typescript
interface ResultOfBoolean {
  isSuccess: boolean;
  data?: boolean;      // true nếu update thành công
  errorMessage?: string;
}
```

---

## Best Practices

1. ✅ **Luôn validate trước khi gọi API**
   - Check required fields
   - Validate file type & size

2. ✅ **Hiển thị loading state**
   ```typescript
   this.isLoading = true;  // Trước khi call API
   // ... API call
   this.isLoading = false; // Trong callback
   ```

3. ✅ **Xử lý lỗi đầy đủ**
   - Check `response.isSuccess`
   - Hiển thị `errorMessage`
   - Catch HTTP errors

4. ✅ **Unsubscribe khi destroy**
   ```typescript
   .pipe(takeUntil(this.destroy$))
   ```

5. ✅ **Chọn đúng method**
   - Add → `createCategoryWithFile()`
   - Update + No image → `updateCategory()`
   - Update + Has image → `updateCategoryWithFile()`

---

## Testing Checklist

- [ ] Thêm danh mục không có ảnh
- [ ] Thêm danh mục có ảnh
- [ ] Sửa danh mục không đổi ảnh
- [ ] Sửa danh mục có ảnh mới
- [ ] Xóa ảnh khi edit (remove image)
- [ ] Validate file type
- [ ] Validate file size (> 5MB)
- [ ] Validate required fields
- [ ] Error handling
- [ ] Loading states
- [ ] Success messages
- [ ] Reload data after save
