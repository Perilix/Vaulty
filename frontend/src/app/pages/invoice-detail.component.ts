import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, SectionTitleComponent, StatusBadgeComponent } from '../shared/ui';
import { IconComponent, BrandMarkComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, frDate, daysOverdue, Invoice, InvoiceStatus } from '../core/models';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CardComponent, BtnComponent, SectionTitleComponent, StatusBadgeComponent, IconComponent, BrandMarkComponent],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css',
})
export class InvoiceDetailComponent {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  euro = euro; frDate = frDate; daysOverdue = daysOverdue;
  iv = signal<Invoice | null>(null);
  profile = signal<Record<string, any>>({});

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.invoice(id).subscribe((d) => this.iv.set(d));
    this.api.profile().subscribe((p) => this.profile.set(p || {}));
  }

  steps = computed(() => {
    const inv = this.iv();
    const paid = inv?.statut === 'paid';
    const sent = inv?.statut !== 'draft';
    return [
      { label: 'Facture créée', done: true, date: frDate(inv?.issued_on) },
      { label: 'Envoyée au client', done: sent, date: sent ? frDate(inv?.issued_on) : 'Brouillon' },
      { label: 'Paiement reçu', done: paid, date: paid ? 'Reçu' : 'En attente' },
    ];
  });

  markPaid() {
    const inv = this.iv();
    if (!inv) return;
    this.api.setInvoiceStatus(inv.id, 'paid' as InvoiceStatus).subscribe(() => this.iv.set({ ...inv, statut: 'paid' }));
  }

  edit() {
    const inv = this.iv();
    if (inv) this.router.navigateByUrl(`/factures/${inv.id}/modifier`);
  }

  remove() {
    const inv = this.iv();
    if (!inv) return;
    if (!confirm(`Supprimer la facture ${inv.id} ? Cette action est irréversible.`)) return;
    this.api.deleteInvoice(inv.id).subscribe(() => this.router.navigateByUrl('/factures'));
  }
}
