import { inject, Injectable } from '@angular/core';
import { CategoryClient, CategoryDto, ResultOfListOfCategoryDto } from './system-admin.service';
import { map, Observable } from 'rxjs';

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
      })
    );
  }
}
