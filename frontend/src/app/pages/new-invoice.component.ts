import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, BadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, Client, InvoiceStatus } from '../core/models';

interface Line { id: number; description: string; qty: number; unit_price: number; }

@Component({
  selector: 'app-new-invoice',
  standalone: true,
  imports: [FormsModule, CardComponent, BtnComponent, BadgeComponent, IconComponent],
  template: `
    <div class="wrap">
      <button class="back" (click)="back()">
        <v-icon name="arrowRight" [size]="16" style="transform:rotate(180deg)" /> Annuler
      </button>
      <div class="head">
        <div>
          <h1 class="page-h1">{{ editId() ? 'Modifier la facture' : 'Nouvelle facture' }}</h1>
          <div class="sub">
            @if (editId()) { <span class="next">{{ editId() }}</span> }
            @else { Prochain numéro · <span class="next">{{ nextId() }}</span> }
          </div>
        </div>
        <v-badge tone="muted">{{ editId() ? statutLabel() : 'Brouillon' }}</v-badge>
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
          <div><label class="v-label">Date d'émission</label><input class="v-input" type="date" [(ngModel)]="issued" /></div>
          <div><label class="v-label">Échéance</label><input class="v-input" type="date" [(ngModel)]="due" /></div>
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
          <label class="tva-toggle">
            <input type="checkbox" [(ngModel)]="applyTva" />
            <span>Appliquer la TVA (20 %)</span>
          </label>
          <div class="totals">
            <div class="tl"><span>Total HT</span><span class="mono-num">{{ euro(ht()) }}</span></div>
            @if (applyTva) {
              <div class="tl"><span>TVA 20 %</span><span class="mono-num dim">{{ euro(tva()) }}</span></div>
            } @else {
              <div class="tl"><span>TVA</span><span class="dim">Non applicable</span></div>
            }
            <div class="ttc"><span>Total {{ applyTva ? 'TTC' : 'à payer' }}</span><span class="mono-num">{{ euro(ht() + tva()) }}</span></div>
          </div>
        </v-card>
      </div>

      <div class="foot">
        <v-btn variant="ghost" (click)="back()">Annuler</v-btn>
        @if (editId()) {
          <v-btn variant="primary" icon="check" (click)="save(statut())">Enregistrer les modifications</v-btn>
        } @else {
          <v-btn variant="secondary" icon="fileText" (click)="save('draft')">Enregistrer en brouillon</v-btn>
          <v-btn variant="primary" icon="send" (click)="save('pending')">Créer et envoyer</v-btn>
        }
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

  editId = signal<string | null>(null);
  statut = signal<InvoiceStatus>('draft');
  clients = signal<Client[]>([]);
  nextId = signal('');
  clientName = '';
  issued = isoToday(0);
  due = isoToday(30);
  notes = '';
  applyTva = true;

  private seq = 2;
  lines = signal<Line[]>([{ id: 1, description: '', qty: 1, unit_price: 0 }]);

  ht = computed(() => this.lines().reduce((a, l) => a + (+l.qty || 0) * (+l.unit_price || 0), 0));
  tva = computed(() => (this.applyTva ? this.ht() * 0.2 : 0));

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    const presetId = this.route.snapshot.queryParamMap.get('client');

    this.api.clients().subscribe((rows) => {
      this.clients.set(rows);
      if (!id) {
        const preset = presetId ? rows.find((c) => c.id === presetId) : null;
        this.clientName = preset?.name || rows[0]?.name || '';
      }
    });

    if (id) {
      this.editId.set(id);
      this.api.invoice(id).subscribe((iv) => {
        this.statut.set(iv.statut);
        this.clientName = iv.client_name;
        this.issued = iv.issued_on || isoToday(0);
        this.due = iv.due_on || isoToday(30);
        this.notes = iv.notes || '';
        this.applyTva = Number(iv.tva_rate) > 0;
        let s = 1;
        this.lines.set((iv.lines || []).map((l) => ({
          id: s++, description: l.description, qty: Number(l.qty), unit_price: Number(l.unit_price),
        })));
        this.seq = s;
        if (!this.lines().length) this.lines.set([{ id: 1, description: '', qty: 1, unit_price: 0 }]);
      });
    } else {
      this.api.nextInvoiceNumber().subscribe((r) => this.nextId.set(r.id));
    }
  }

  statutLabel() {
    return { paid: 'Payée', pending: 'En attente', overdue: 'En retard', draft: 'Brouillon' }[this.statut()];
  }

  addLine() { this.lines.update((ls) => [...ls, { id: this.seq++, description: '', qty: 1, unit_price: 0 }]); }
  delLine(id: number) { if (this.lines().length > 1) this.lines.update((ls) => ls.filter((l) => l.id !== id)); }
  setLine(id: number, k: keyof Line, v: any) {
    this.lines.update((ls) => ls.map((l) => (l.id === id ? { ...l, [k]: v } : l)));
  }

  back() {
    this.router.navigateByUrl(this.editId() ? `/factures/${this.editId()}` : '/factures');
  }

  save(statut: InvoiceStatus) {
    const client = this.clients().find((c) => c.name === this.clientName);
    const body = {
      client_id: client?.id || null,
      client_name: this.clientName,
      issued_on: this.issued || null,
      due_on: this.due || null,
      statut,
      tva_rate: this.applyTva ? 20 : 0,
      notes: this.notes,
      lines: this.lines().map((l) => ({ description: l.description, qty: +l.qty || 0, unit_price: +l.unit_price || 0 })),
    };
    const id = this.editId();
    const req$ = id ? this.api.updateInvoice(id, body) : this.api.createInvoice(body);
    req$.subscribe(() => this.router.navigateByUrl(id ? `/factures/${id}` : '/factures'));
  }
}

/** Date ISO (YYYY-MM-DD) décalée de `offsetDays` à partir d'aujourd'hui */
function isoToday(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
