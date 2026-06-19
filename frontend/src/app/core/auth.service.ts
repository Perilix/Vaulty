import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';

const KEY = 'vaulty-token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(KEY));

  isLoggedIn(): boolean {
    return !!this.token();
  }

  login(password: string) {
    return this.api.login(password).pipe(
      tap(({ token }) => {
        localStorage.setItem(KEY, token);
        this.token.set(token);
      }),
    );
  }

  logout() {
    localStorage.removeItem(KEY);
    this.token.set(null);
    this.router.navigateByUrl('/login');
  }
}
