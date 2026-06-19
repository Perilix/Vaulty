import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent, BtnComponent, AvatarComponent, SegmentedComponent, StatusBadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, frDate, toneVar, daysOverdue, Invoice, Tone } from '../core/models';

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [FormsModule, CardComponent, BtnComponent, AvatarComponent, SegmentedComponent, StatusBadgeComponent, IconComponent],
  template: `
    <div>
      <div class="head">
        <div>
          <h1 class="page-h1">Factures</h1>
          <div class="sub">{{ all().length }} factures · {{ euro(totals().attente + totals().retard) }} en attente d'encaissement</div>
        </div>
        <div class="actions">
          <v-btn variant="secondary" icon="download">Exporter</v-btn>
          <v-btn variant="primary" icon="plus" (click)="router.navigateByUrl('/factures/nouvelle')">Nouvelle facture</v-btn>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom:18px">
        <div class="tile">
          <div class="t-ic" [style.background]="tv('pos').bg" [style.color]="tv('pos').fg"><v-icon name="check" [size]="21" /></div>
          <div class="t-main"><div class="t-l">Encaissé</div><div class="t-v mono-num">{{ euro(totals().encaisse) }}</div></div>
          <div class="t-sub">{{ counts().paid }} factures</div>
        </div>
        <div class="tile">
          <div class="t-ic" [style.background]="tv('warn').bg" [style.color]="tv('warn').fg"><v-icon name="clock" [size]="21" /></div>
          <div class="t-main"><div class="t-l">En attente</div><div class="t-v mono-num">{{ euro(totals().attente) }}</div></div>
          <div class="t-sub">{{ counts().pending }} factures</div>
        </div>
        <div class="tile">
          <div class="t-ic" [style.background]="tv('danger').bg" [style.color]="tv('danger').fg"><v-icon name="alert" [size]="21" /></div>
          <div class="t-main"><div class="t-l">En retard</div><div class="t-v mono-num">{{ euro(totals().retard) }}</div></div>
          <div class="t-sub">{{ counts().overdue }} factures</div>
        </div>
      </div>

      <div class="filters">
        <v-segmented [value]="statut()" (valueChange)="statut.set($event)" [options]="segs" />
        <div class="filters-r">
          <div class="search">
            <v-icon name="search" [size]="17" />
            <input [ngModel]="q()" (ngModelChange)="q.set($event)" placeholder="Rechercher une facture…" />
          </div>
          <v-btn variant="secondary" icon="filter">Filtres</v-btn>
        </div>
      </div>

      <v-card [pad]="0">
        <table>
          <thead>
            <tr>
              <th>Facture</th><th>Client</th><th>Date</th><th>Échéance</th>
              <th class="r">Montant TTC</th><th>Statut</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (iv of filtered(); track iv.id) {
              <tr (click)="open(iv)">
                <td class="id sg">{{ iv.id }}</td>
                <td><div class="cli"><v-avatar [name]="iv.client_name" [size]="28" /><span>{{ iv.client_name }}</span></div></td>
                <td class="dim">{{ frDate(iv.issued_on) }}</td>
                <td class="dim">{{ frDate(iv.due_on) }}</td>
                <td class="r mono-num amt">{{ euro(iv.ttc) }}</td>
                <td><v-status-badge [status]="iv.statut" [retard]="iv.statut === 'overdue' ? daysOverdue(iv.due_on) : 0" /></td>
                <td class="r"><v-icon name="chevronRight" [size]="16" /></td>
              </tr>
            }
            @if (!filtered().length) {
              <tr><td colspan="7" class="empty">Aucune facture.</td></tr>
            }
          </tbody>
        </table>
      </v-card>
    </div>
  `,
  styles: [`
    .head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 14px; }
    .actions { display: flex; gap: 10px; }
    .tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      box-shadow: var(--shadow-sm); padding: 18px; display: flex; align-items: center; gap: 15px; }
    .t-ic { width: 46px; height: 46px; border-radius: 13px; display: grid; place-items: center; flex-shrink: 0; }
    .t-main { flex: 1; }
    .t-l { font-size: 12.5px; color: var(--text-3); font-weight: 600; }
    .t-v { font-size: 23px; font-weight: 700; margin-top: 2px; }
    .t-sub { font-size: 12px; color: var(--text-3); align-self: flex-start; }
    .filters { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
    .filters-r { display: flex; gap: 10px; }
    .search { display: flex; align-items: center; gap: 9px; padding: 0 14px; background: var(--surface);
      border: 1px solid var(--border); border-radius: 11px; min-width: 240px; height: 40px; color: var(--text-3); }
    .search input { border: none; outline: none; background: transparent; font-size: 13.5px; color: var(--text); width: 100%; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: var(--surface-2); }
    th { text-align: left; padding: 11px 22px; font-size: 11.5px; font-weight: 600; color: var(--text-3);
      text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
    th.r { text-align: right; }
    tbody tr { border-top: 1px solid var(--border-soft); cursor: pointer; transition: background .12s; }
    tbody tr:hover { background: var(--surface-2); }
    td { padding: 14px 22px; font-size: 13.5px; white-space: nowrap; }
    td.r { text-align: right; }
    td.dim { font-size: 13px; color: var(--text-2); }
    td.id { font-weight: 600; }
    td.amt { font-size: 14px; font-weight: 600; }
    .cli { display: flex; align-items: center; gap: 10px; }
    .cli span { font-size: 13.5px; font-weight: 500; }
    .empty { color: var(--text-3); }
  `],
})
export class FacturesComponent {
  private api = inject(ApiService);
  router = inject(Router);

  euro = euro; frDate = frDate; daysOverdue = daysOverdue;
  all = signal<Invoice[]>([]);
  statut = signal('all');
  q = signal('');

  segs = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'overdue', label: 'En retard' },
    { value: 'paid', label: 'Payées' },
  ];

  constructor() {
    this.api.invoices('all').subscribe((rows) => this.all.set(rows));
  }

  tv(t: Tone) { return toneVar(t); }

  filtered = computed(() => {
    let rows = this.all();
    if (this.statut() !== 'all') rows = rows.filter((r) => r.statut === this.statut());
    const query = this.q().toLowerCase();
    if (query) rows = rows.filter((r) => (r.client_name + r.id).toLowerCase().includes(query));
    return rows;
  });

  counts = computed(() => ({
    paid: this.all().filter((i) => i.statut === 'paid').length,
    pending: this.all().filter((i) => i.statut === 'pending').length,
    overdue: this.all().filter((i) => i.statut === 'overdue').length,
  }));

  totals = computed(() => ({
    encaisse: this.sum('paid'),
    attente: this.sum('pending'),
    retard: this.sum('overdue'),
  }));

  private sum(s: string) { return this.all().filter((i) => i.statut === s).reduce((a, b) => a + b.ttc, 0); }
  open(iv: Invoice) { this.router.navigateByUrl(`/factures/${iv.id}`); }
}
