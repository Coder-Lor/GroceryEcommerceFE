import { inject, Injectable } from '@angular/core';
import { CategoryClient, CategoryDto, ResultOfListOfCategoryDto } from './system-admin.service';
import { map, Observable, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private catelogyClient: CategoryClient = inject(CategoryClient);

  getCategoryTree(): Observable<CategoryDto[]> {
    return this.catelogyClient.getCategoryTree().pipe(
      map((res: ResultOfListOfCategoryDto) => {
        if (res.isSuccess && res.data) {
          return res.data;
        } else {
          console.log('Lỗi: ', res.errorMessage);
          return [];
        }
      }),
      catchError((error) => {
        console.error('❌ CategoryService - Lỗi khi gọi API getCategoryTree:', error);
        // Trả về mảng rỗng thay vì throw error
        return of([]);
      })
    );
  }
}
