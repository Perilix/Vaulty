import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, BadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, Client } from '../core/models';

interface Line { id: number; description: string; qty: number; unit_price: number; }

@Component({
  selector: 'app-new-invoice',
  standalone: true,
  imports: [FormsModule, CardComponent, BtnComponent, BadgeComponent, IconComponent],
  template: `
    <div class="wrap">
      <button class="back" (click)="router.navigateByUrl('/factures')">
        <v-icon name="arrowRight" [size]="16" style="transform:rotate(180deg)" /> Annuler
      </button>
      <div class="head">
        <div>
          <h1 class="page-h1">Nouvelle facture</h1>
          <div class="sub">Prochain numéro · <span class="next">{{ nextId() }}</span></div>
        </div>
        <v-badge tone="muted">Brouillon</v-badge>
      </div>

      <v-card style="margin-bottom:18px">
        <div class="info-grid">
          <div>
            <label class="v-label">Client</label>
            <div class="sel-wrap">
              <select class="v-select" [(ngModel)]="clientName">
                @for (c of clients(); track c.id) { <option [value]="c.name">{{ c.name }}</option> }
              </select>
              <v-icon name="chevronDown" [size]="16" class="chev" />
            </div>
          </div>
          <div><label class="v-label">Date d'émission</label><input class="v-input" [(ngModel)]="issued" /></div>
          <div><label class="v-label">Échéance</label><input class="v-input" [(ngModel)]="due" /></div>
        </div>
      </v-card>

      <v-card [pad]="0" style="margin-bottom:18px">
        <div class="lines-head">
          <h3>Lignes de la facture</h3>
          <v-btn variant="secondary" size="sm" icon="plus" (click)="addLine()">Ajouter une ligne</v-btn>
        </div>
        <div class="lines-body">
          <div class="line-grid head-row">
            <span>Description</span><span class="r">Qté</span><span class="r">Prix unit.</span><span class="r">Total HT</span><span></span>
          </div>
          @for (l of lines(); track l.id) {
            <div class="line-grid row">
              <input class="line-input" [ngModel]="l.description" (ngModelChange)="setLine(l.id, 'description', $event)" placeholder="Description de la prestation" />
              <input class="line-input r" type="number" [ngModel]="l.qty" (ngModelChange)="setLine(l.id, 'qty', $event)" />
              <input class="line-input r" type="number" [ngModel]="l.unit_price" (ngModelChange)="setLine(l.id, 'unit_price', $event)" />
              <span class="mono-num line-total">{{ euro((+l.qty || 0) * (+l.unit_price || 0)) }}</span>
              <button class="del" [disabled]="lines().length === 1" (click)="delLine(l.id)"><v-icon name="trash" [size]="15" /></button>
            </div>
          }
        </div>
      </v-card>

      <div class="bottom-grid">
        <v-card>
          <h3 class="st">Notes / mentions</h3>
          <textarea class="v-textarea" rows="4" [(ngModel)]="notes" placeholder="Conditions, RIB, mentions légales…"></textarea>
        </v-card>
        <v-card>
          <div class="totals">
            <div class="tl"><span>Total HT</span><span class="mono-num">{{ euro(ht()) }}</span></div>
            <div class="tl"><span>TVA 20 %</span><span class="mono-num dim">{{ euro(tva()) }}</span></div>
            <div class="ttc"><span>Total TTC</span><span class="mono-num">{{ euro(ht() + tva()) }}</span></div>
          </div>
        </v-card>
      </div>

      <div class="foot">
        <v-btn variant="ghost" (click)="router.navigateByUrl('/factures')">Annuler</v-btn>
        <v-btn variant="secondary" icon="fileText" (click)="save('draft')">Enregistrer en brouillon</v-btn>
        <v-btn variant="primary" icon="send" (click)="save('pending')">Créer et envoyer</v-btn>
      </div>
    </div>
  `,
  styleUrl: './new-invoice.component.css',
})
export class NewInvoiceComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  euro = euro;

  clients = signal<Client[]>([]);
  nextId = signal('F-2026-083');
  clientName = '';
  issued = '18 juin 2026';
  due = '18 juil. 2026';
  notes = 'Paiement par virement — IBAN FR76 3000 4000 0500 0012 3456 789';

  private seq = 2;
  lines = signal<Line[]>([{ id: 1, description: 'Prestation de conseil', qty: 1, unit_price: 650 }]);

  ht = computed(() => this.lines().reduce((a, l) => a + (+l.qty || 0) * (+l.unit_price || 0), 0));
  tva = computed(() => this.ht() * 0.2);

  constructor() {
    const presetId = this.route.snapshot.queryParamMap.get('client');
    this.api.clients().subscribe((rows) => {
      this.clients.set(rows);
      const preset = presetId ? rows.find((c) => c.id === presetId) : null;
      this.clientName = preset?.name || rows[0]?.name || '';
    });
    this.api.nextInvoiceNumber().subscribe((r) => this.nextId.set(r.id));
  }

  addLine() { this.lines.update((ls) => [...ls, { id: this.seq++, description: '', qty: 1, unit_price: 0 }]); }
  delLine(id: number) { if (this.lines().length > 1) this.lines.update((ls) => ls.filter((l) => l.id !== id)); }
  setLine(id: number, k: keyof Line, v: any) {
    this.lines.update((ls) => ls.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  }

  save(statut: 'draft' | 'pending') {
    const client = this.clients().find((c) => c.name === this.clientName);
    this.api.createInvoice({
      client_id: client?.id || null,
      client_name: this.clientName,
      statut,
      tva_rate: 20,
      notes: this.notes,
      lines: this.lines().map((l) => ({ description: l.description, qty: +l.qty || 0, unit_price: +l.unit_price || 0 })),
    }).subscribe(() => this.router.navigateByUrl('/factures'));
  }
}
