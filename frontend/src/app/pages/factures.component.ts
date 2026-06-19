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
  templateUrl: './factures.component.html',
  styleUrl: './factures.component.css',
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
