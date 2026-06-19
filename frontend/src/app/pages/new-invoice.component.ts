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
  templateUrl: './new-invoice.component.html',
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
