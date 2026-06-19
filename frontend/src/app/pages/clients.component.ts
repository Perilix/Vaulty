import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CardComponent, BtnComponent, AvatarComponent, BadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, toneVar, Client, STATUT_TONE } from '../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CardComponent, BtnComponent, AvatarComponent, BadgeComponent, IconComponent],
  template: `
    <div>
      <div class="head">
        <div>
          <h1 class="page-h1">Clients</h1>
          <div class="sub">{{ clients().length }} clients actifs</div>
        </div>
        <v-btn variant="primary" icon="plus" (click)="router.navigateByUrl('/clients/nouveau')">Nouveau client</v-btn>
      </div>

      <div class="grid-3">
        @for (c of clients(); track c.id) {
          <v-card [hoverable]="true" [pad]="20">
            <div class="c-top" (click)="open(c)">
              <v-avatar [name]="c.name" [size]="44" />
              <div class="c-main">
                <div class="c-name">{{ c.name }}</div>
                <div class="c-city"><v-icon name="pin" [size]="12" />{{ c.city }}</div>
              </div>
              <v-badge [tone]="tone(c)" [dot]="true">{{ c.statut }}</v-badge>
            </div>
            <div class="metrics">
              <div class="metric"><div class="m-l">CA total</div><div class="m-v mono-num">{{ euro(c.ca) }}</div></div>
              <div class="metric"><div class="m-l">Encours</div><div class="m-v mono-num" [style.color]="c.encours > 0 ? toneVar('warn').fg : ''">{{ euro(c.encours) }}</div></div>
              <div class="metric"><div class="m-l">Factures</div><div class="m-v mono-num">{{ c.factures }}</div></div>
              <div class="metric"><div class="m-l">Payées</div><div class="m-v mono-num">{{ c.payees }}</div></div>
            </div>
            <div class="c-actions">
              <v-btn class="block" variant="secondary" size="sm" icon="mail">Relancer</v-btn>
              <v-btn variant="ghost" size="sm" iconRight="arrowRight" (click)="open(c)">Fiche</v-btn>
            </div>
          </v-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 22px; }
    .c-top { display: flex; align-items: center; gap: 13px; margin-bottom: 16px; cursor: pointer; }
    .c-main { flex: 1; min-width: 0; }
    .c-name { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .c-city { font-size: 12.5px; color: var(--text-3); display: flex; align-items: center; gap: 4px; }
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 15px 0;
      border-top: 1px solid var(--border-soft); border-bottom: 1px solid var(--border-soft); }
    .m-l { font-size: 11.5px; color: var(--text-3); margin-bottom: 3px; }
    .m-v { font-size: 16px; font-weight: 700; }
    .c-actions { display: flex; gap: 8px; margin-top: 14px; }
  `],
})
export class ClientsComponent {
  private api = inject(ApiService);
  router = inject(Router);
  euro = euro; toneVar = toneVar;
  clients = signal<Client[]>([]);

  constructor() {
    this.api.clients().subscribe((rows) => this.clients.set(rows));
  }

  tone(c: Client) { return STATUT_TONE[c.statut] || 'muted'; }
  open(c: Client) { this.router.navigateByUrl(`/clients/${c.id}`); }
}
