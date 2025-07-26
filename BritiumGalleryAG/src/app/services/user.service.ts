import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../user.model';
import { People } from '../People';
import { Router } from '@angular/router';

export interface CustomerGrowthDTO {
  period: string;
  count: number;
  cumulativeCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userBase = 'http://localhost:8080/gallery/users';
  private otpBase = 'http://localhost:8080/api/otp';

  private userSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  

  constructor(private http: HttpClient, private router: Router, private ngZone: NgZone) { 
    const user = localStorage.getItem('loggedInUser');
    this.userSubject = new BehaviorSubject<User | null>(user ? JSON.parse(user) : null);
    this.currentUser = this.userSubject.asObservable();
  }

  public get userValue(): User | null {
    return this.userSubject.value;
  }

  registerUser(user: User): Observable<any> {
    console.log("📤 [Frontend] Sending user:", user);
    return this.http.post(`${this.userBase}/register`, user, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  verifyOtp(identifier: string, otp: string): Observable<string> {
    const params = new HttpParams()
      .set('identifier', identifier)
      .set('otp', otp);
    return this.http.post(`${this.otpBase}/verify`, null, {
      params,
      responseType: 'text' as const
    });
  }

  resendEmailOtp(email: string): Observable<string> {
    const params = new HttpParams().set('identifier', email);
    return this.http.post(`${this.otpBase}/resend`, null, {
      params,
      responseType: 'text' as const
    });
  }

  resendSmsOtp(phone: string): Observable<string> {
    const params = new HttpParams()
      .set('identifier', phone)
      .set('useSms', true);
    return this.http.post(`${this.otpBase}/resend`, null, {
      params,
      responseType: 'text' as const
    });
  }

  login(email: string, password: string): Observable<string> {
    return this.http.post(`${this.userBase}/login`, { email, password }, {
      responseType: 'text' as const
    });
  }

  setLoggedInUser(user: User): void {
    localStorage.setItem('loggedInUser', JSON.stringify(user));
    this.userSubject.next(user);
  }

  logout(): void {
    const user = this.userSubject.value;
    // Fire and forget backend logout
    if (user && user.id) {
      this.http.post(`${this.userBase}/logout`, { userId: user.id }).subscribe({
        // Optionally handle response, but not required
      });
    }
    // Immediately clear local state and navigate
          localStorage.removeItem('loggedInUser');
          this.userSubject.next(null);
    this.ngZone.run(() => {
      this.router.navigate(['/login']).then(() => {
        window.location.reload();
      });
    });
  }

  updateUserProfile(user: User, imageFile?: File): Observable<User> {
    const formData = new FormData();

    formData.append(
      'user',
      new Blob([JSON.stringify(user)], { type: 'application/json' })
    );

    if (imageFile) {
      formData.append('images', imageFile);
    }

    return this.http.put<User>(`${this.userBase}/profile/${user.id}`, formData);
  }

  changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<any> {
    const payload = { currentPassword, newPassword, confirmPassword };
    console.log('Sending change password request:', payload);
    return this.http.put(
      `${this.userBase}/profile/${id}/change-password`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  getUserProfileById(id: number): Observable<User> {
    return this.http.get<User>(`${this.userBase}/profile/${id}`);
  }

  getUserProfileByIdentifier(identifier: string): Observable<User> {
    // Try to fetch by email or phone (backend should support this endpoint)
    return this.http.get<User>(`${this.userBase}/profile/by-identifier?identifier=${encodeURIComponent(identifier)}`);
  }

  getCustomerGrowth(from: string, to: string, groupBy: string = 'day'): Observable<CustomerGrowthDTO[]> {
    return this.http.get<CustomerGrowthDTO[]>(`${this.userBase}/admin/customer-growth?from=${from}&to=${to}&groupBy=${groupBy}`);
  }

  getPeopleById(id: number): Observable<People> {
    return this.http.get<People>(`${this.userBase}/people/${id}`);
  }

  startHeartbeat() {
    const user = this.userSubject.value;
    if (!user) return;
    setInterval(() => {
      this.http.post('http://localhost:8080/gallery/users/heartbeat', { userId: user.id }).subscribe();
    }, 30000);
  }
}
