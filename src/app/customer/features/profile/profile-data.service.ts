import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

interface UserInfoData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  status: number;
  emailVerified: boolean;
  phoneVerified: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileDataService {
  private userInfoCache$ = new BehaviorSubject<UserInfoData | null>(null);
  private isLoading$ = new BehaviorSubject<boolean>(false);

  getUserInfo(): Observable<UserInfoData | null> {
    return this.userInfoCache$.asObservable();
  }

  setUserInfo(data: UserInfoData): void {
    console.log('💾 Setting user info cache:', data);
    this.userInfoCache$.next(data);
  }

  clearUserInfo(): void {
    console.log('🗑️ Clearing user info cache');
    this.userInfoCache$.next(null);
  }

  hasCache(): boolean {
    return this.userInfoCache$.value !== null;
  }

  getLoadingState(): Observable<boolean> {
    return this.isLoading$.asObservable();
  }

  setLoading(loading: boolean): void {
    this.isLoading$.next(loading);
  }
}
