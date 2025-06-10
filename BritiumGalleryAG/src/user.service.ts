import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from './user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userBase = 'http://localhost:8080/gallery/users';
  private otpBase = 'http://localhost:8080/api/otp';

  constructor(private http: HttpClient) {}

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
}
