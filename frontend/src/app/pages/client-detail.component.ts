import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, AvatarComponent, BadgeComponent, SectionTitleComponent, StatusBadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, frDate, toneVar, Client, STATUT_TONE } from '../core/models';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CardComponent, BtnComponent, AvatarComponent, BadgeComponent, SectionTitleComponent, StatusBadgeComponent, IconComponent],
  template: `
    <div>
      <button class="back" (click)="router.navigateByUrl('/clients')">
        <v-icon name="arrowRight" [size]="16" style="transform:rotate(180deg)" /> Retour aux clients
      </button>

      @if (client(); as c) {
        <v-card style="margin-bottom:18px">
          <div class="hdr">
            <v-avatar [name]="c.name" [size]="62" />
            <div class="hdr-main">
              <div class="hdr-top"><h1>{{ c.name }}</h1><v-badge [tone]="tone(c)" [dot]="true">{{ c.statut }}</v-badge></div>
              <div class="hdr-meta">
                <span><v-icon name="building" [size]="14" />{{ c.contact }}</span>
                <span><v-icon name="pin" [size]="14" />{{ c.city }}</span>
                <span><v-icon name="mail" [size]="14" />{{ c.email }}</span>
              </div>
            </div>
            <div class="hdr-actions">
              <v-btn variant="secondary" icon="mail">Relancer</v-btn>
              <v-btn variant="primary" icon="plus" (click)="newInvoice(c)">Nouvelle facture</v-btn>
            </div>
          </div>
        </v-card>

        <div class="grid-main">
          <div class="left">
            <div class="stats">
              <div class="stat"><div class="s-l">CA total</div><div class="s-v mono-num">{{ euro(c.ca) }}</div></div>
              <div class="stat"><div class="s-l">Encours</div><div class="s-v mono-num" [style.color]="c.encours > 0 ? toneVar('warn').fg : ''">{{ euro(c.encours) }}</div></div>
              <div class="stat"><div class="s-l">Factures</div><div class="s-v mono-num">{{ c.factures }}</div></div>
              <div class="stat"><div class="s-l">Délai moyen</div><div class="s-v mono-num">{{ c.delai }} j</div></div>
            </div>

            <v-card [pad]="0">
              <div class="ci-head"><h3>Factures de ce client</h3></div>
              <table>
                <tbody>
                  @for (iv of c.invoices || []; track iv.id; let idx = $index) {
                    <tr [class.bordered]="idx > 0" (click)="router.navigateByUrl('/factures/' + iv.id)">
                      <td class="id sg">{{ iv.id }}</td>
                      <td class="dim">{{ frDate(iv.issued_on) }}</td>
                      <td class="r mono-num amt">{{ euro((iv.ht || 0) * 1.2) }}</td>
                      <td class="r"><v-status-badge [status]="iv.statut" /></td>
                    </tr>
                  }
                  @if (!(c.invoices || []).length) {
                    <tr><td class="empty">Aucune facture pour ce client.</td></tr>
                  }
                </tbody>
              </table>
            </v-card>
          </div>

          <div class="right">
            <v-card>
              <v-section-title>Coordonnées</v-section-title>
              <div class="info">
                <div class="ir"><v-icon name="mail" [size]="16" /><span class="ir-l">Email</span><span class="ir-v">{{ c.email }}</span></div>
                <div class="ir"><v-icon name="phone" [size]="16" /><span class="ir-l">Téléphone</span><span class="ir-v">{{ c.phone || '01 42 88 19 03' }}</span></div>
                <div class="ir"><v-icon name="pin" [size]="16" /><span class="ir-l">Ville</span><span class="ir-v">{{ c.city }}</span></div>
                <div class="ir"><v-icon name="fileText" [size]="16" /><span class="ir-l">SIRET</span><span class="ir-v">{{ c.siret }}</span></div>
                <div class="ir"><v-icon name="creditCard" [size]="16" /><span class="ir-l">Conditions</span><span class="ir-v">{{ c.conditions || 'Net 30 jours' }}</span></div>
              </div>
            </v-card>
            <v-card>
              <v-section-title>Activité récente</v-section-title>
              <div class="activity">
                @for (a of activity(); track $index; let idx = $index) {
                  <div class="act" [class.bordered]="idx > 0">
                    <div class="act-ic" [style.background]="toneVar(a.tone).bg" [style.color]="toneVar(a.tone).fg"><v-icon [name]="a.icon" [size]="16" /></div>
                    <div class="act-body"><div class="act-txt">{{ a.txt }}</div><div class="act-date">{{ a.date }}</div></div>
                  </div>
                }
              </div>
            </v-card>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './client-detail.component.css',
})
export class ClientDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  euro = euro; frDate = frDate; toneVar = toneVar;
  client = signal<Client | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.client(id).subscribe((c) => this.client.set(c));
  }

  tone(c: Client) { return STATUT_TONE[c.statut] || 'muted'; }
  newInvoice(c: Client) { this.router.navigate(['/factures/nouvelle'], { queryParams: { client: c.id } }); }

  activity = computed(() => {
    const inv = this.client()?.invoices?.[0];
    return [
      { icon: 'check', tone: 'pos' as const, txt: `Paiement reçu — ${inv ? inv.id : 'F-2026-076'}`, date: 'Il y a 3 jours' },
      { icon: 'send', tone: 'primary' as const, txt: 'Facture envoyée par email', date: 'Il y a 8 jours' },
      { icon: 'mail', tone: 'warn' as const, txt: 'Relance automatique envoyée', date: 'Il y a 12 jours' },
      { icon: 'edit', tone: 'muted' as const, txt: 'Fiche client mise à jour', date: 'Il y a 1 mois' },
    ];
  });
}
