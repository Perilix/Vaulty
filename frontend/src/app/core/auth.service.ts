import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService, AuthResponse, AuthUser } from './api.service';

const TOKEN_KEY = 'vaulty-token';
const USER_KEY = 'vaulty-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly user = signal<AuthUser | null>(this.readUser());

  isLoggedIn(): boolean {
    return !!this.token();
  }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(tap((r) => this.persist(r)));
  }

  register(email: string, password: string, name: string) {
    return this.api.register(email, password, name).pipe(tap((r) => this.persist(r)));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }

  private persist(r: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, r.token);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    this.token.set(r.token);
    this.user.set(r.user);
  }

  private readUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
