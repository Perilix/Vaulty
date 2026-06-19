import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BtnComponent } from '../shared/ui';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, BtnComponent],
  template: `
    <div class="wrap">
      <div class="card">
        <div class="brand">
          <img src="vaulty_logo.png" class="login-logo" alt="Vaulty" />
        </div>
        <h1>Connexion</h1>
        <p class="sub">Entre ton mot de passe pour accéder à ta compta.</p>
        <form (ngSubmit)="submit()">
          <label class="v-label">Mot de passe</label>
          <input class="v-input" type="password" [(ngModel)]="password" name="password"
            autocomplete="current-password" placeholder="••••••••" (input)="error.set('')" />
          @if (error()) { <div class="err">{{ error() }}</div> }
          <div class="actions">
            <v-btn variant="primary" icon="logout">{{ loading() ? 'Connexion…' : 'Se connecter' }}</v-btn>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100vh; display: grid; place-items: center; padding: 24px;
      background: radial-gradient(120% 80% at 100% 0%, var(--bg-grad-a), var(--bg-grad-b)); }
    .card { width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 32px; }
    .brand { display: flex; align-items: center; margin-bottom: 24px; }
    .login-logo { height: 40px; width: auto; }
    [data-theme="dark"] .login-logo { filter: brightness(0) invert(1); }
    h1 { font-size: 22px; font-weight: 700; }
    .sub { font-size: 13.5px; color: var(--text-3); margin: 6px 0 22px; }
    .err { font-size: 12.5px; color: var(--danger); margin-top: 8px; }
    .actions { margin-top: 18px; display: flex; }
    .actions :global(v-btn), .actions v-btn { width: 100%; }
    form :global(button) { width: 100%; }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    if (!this.password || this.loading()) return;
    this.loading.set(true);
    this.auth.login(this.password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.error.set(e?.error?.error || 'Connexion impossible.');
        this.loading.set(false);
      },
    });
  }
}
