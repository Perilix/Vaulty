import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../shared/icon.component';
import { AvatarComponent, BtnComponent } from '../shared/ui';
import { ThemeService } from '../core/theme.service';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';
import { euro } from '../core/models';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, IconComponent, AvatarComponent, BtnComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  theme = inject(ThemeService);
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);

  url = signal(this.router.url);
  ownerName = signal('');
  company = signal('');
  encaisse = signal(euro(0));
  retardNb = signal(0);

  navItems = [
    { key: 'dashboard', label: 'Tableau de bord', icon: 'dashboard', path: '/' },
    { key: 'factures', label: 'Factures', icon: 'invoice', path: '/factures' },
    { key: 'clients', label: 'Clients', icon: 'clients', path: '/clients' },
    { key: 'settings', label: 'Paramètres', icon: 'settings', path: '/parametres' },
  ];

  notifOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.url.set(this.router.url));
    this.api.dashboard().subscribe((d) => {
      if (d?.kpis) {
        this.encaisse.set(euro(Number(d.kpis['encaisse']) || 0));
        this.retardNb.set(Number(d.kpis['retardNb']) || 0);
      }
    });
    this.ownerName.set(this.auth.user()?.name || '');
    this.api.profile().subscribe((p) => {
      this.ownerName.set(p?.['ownerName'] || this.auth.user()?.name || '');
      this.company.set(p?.['raisonSociale'] || '');
    });
  }

  isActive(key: string): boolean {
    const u = this.url();
    if (key === 'dashboard') return u === '/' || u === '';
    if (key === 'factures') return u.startsWith('/factures');
    if (key === 'clients') return u.startsWith('/clients');
    if (key === 'settings') return u.startsWith('/parametres');
    return false;
  }

  go(path: string) { this.router.navigateByUrl(path); }
  logout() { this.auth.logout(); }
}
