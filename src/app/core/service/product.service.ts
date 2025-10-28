import { inject, Injectable } from '@angular/core';
import {
  PagedResultOfProductBaseResponse,
  ProductClient,
  ResultOfPagedResultOfProductBaseResponse,
  SortDirection,
} from './system-admin.service';
import { map, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private productClient: ProductClient = inject(ProductClient);

  constructor() {}

  getProductByPaging(
    page: number = 1,
    pageSize: number = 10
  ): Observable<PagedResultOfProductBaseResponse> {
    return this.productClient
      .getProductsPaging(
        page,
        pageSize,
        undefined, // search
        undefined, // sortBy
        SortDirection.Ascending, // sortDirection
        [], // filters
        undefined, // entityType
        undefined, // availableFields
        false, // hasFilters
        false, // hasSearch
        false // hasSorting)
      )
      .pipe(
        map((result: ResultOfPagedResultOfProductBaseResponse) => {
          if (!result.isSuccess || !result.data) {
            throw new Error(result.errorMessage || 'Có lỗi trong quá trình lấy dữ liệu');
          }
          const data = result.data;
          return data;
        })
      );
  }
}
