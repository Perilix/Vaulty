import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BtnComponent } from '../shared/ui';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, BtnComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    if (!this.email || !this.password || this.loading()) return;
    this.loading.set(true);
    this.auth.register(this.email, this.password, this.name).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => {
        this.error.set(e?.error?.error || 'Inscription impossible.');
        this.loading.set(false);
      },
    });
  }
}
