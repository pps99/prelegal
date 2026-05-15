import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  token: string;
  user: { email: string };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  register(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', { email, password }).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem('prelegal_token');
    localStorage.removeItem('prelegal_email');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('prelegal_token');
  }

  getUserEmail(): string {
    return localStorage.getItem('prelegal_email') ?? '';
  }

  private storeSession(res: AuthResponse): void {
    localStorage.setItem('prelegal_token', res.token);
    localStorage.setItem('prelegal_email', res.user.email);
  }
}
