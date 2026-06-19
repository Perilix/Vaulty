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
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="brand">
          <img src="vaulty_logo.png" class="brand-logo" alt="Vaulty" />
        </div>
        <nav>
          @for (it of navItems; track it.key) {
            <button class="nav-item" [class.active]="isActive(it.key)" (click)="go(it.path)">
              <v-icon [name]="it.icon" [size]="19" />
              <span class="lbl">{{ it.label }}</span>
              @if (it.key === 'factures' && retardNb() > 0) { <span class="nav-badge">{{ retardNb() }}</span> }
            </button>
          }
        </nav>
        <div class="bottom">
          <div class="treso">
            <div class="treso-l">Encaissé</div>
            <div class="treso-v mono-num">{{ encaisse() }}</div>
            <div class="treso-t">Total des factures payées</div>
          </div>
          <div class="profile">
            <v-avatar [name]="ownerName() || 'Mon compte'" [size]="36" color="var(--sage-500)" />
            <div class="profile-txt">
              <div class="pn">{{ ownerName() || 'Mon compte' }}</div>
              <div class="pc">{{ company() || 'Vaulty' }}</div>
            </div>
            <button class="logout" (click)="logout()"><v-icon name="logout" [size]="17" /></button>
          </div>
        </div>
      </aside>

      <!-- Colonne principale -->
      <div class="col">
        <header class="topbar">
          <div class="search">
            <v-icon name="search" [size]="17" />
            <input placeholder="Rechercher facture, client…" />
          </div>
          <div class="spacer"></div>
          <button class="icon-btn" (click)="theme.toggle()">
            <v-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="19" />
          </button>
          <button class="icon-btn bell" (click)="notifOpen.set(true)">
            <v-icon name="bell" [size]="19" />
          </button>
          <v-btn variant="primary" icon="plus" (click)="go('/factures/nouvelle')">Nouvelle facture</v-btn>
        </header>
        <main>
          <div class="content">
            <router-outlet />
          </div>
        </main>
      </div>

      <!-- Panneau notifications -->
      <div class="overlay" [class.open]="notifOpen()" (click)="notifOpen.set(false)"></div>
      <aside class="notif" [class.open]="notifOpen()">
        <div class="notif-head">
          <div class="notif-title"><h2>Notifications</h2></div>
          <button class="icon-btn-sm" (click)="notifOpen.set(false)"><v-icon name="x" [size]="19" /></button>
        </div>
        <div class="notif-list">
          <div class="notif-empty">Aucune notification pour l'instant.</div>
        </div>
      </aside>
    </div>
  `,
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
