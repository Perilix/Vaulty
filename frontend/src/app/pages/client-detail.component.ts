import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, BtnComponent, AvatarComponent, BadgeComponent, SectionTitleComponent, StatusBadgeComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';
import { euro, frDate, toneVar, Client, STATUT_TONE } from '../core/models';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CardComponent, BtnComponent, AvatarComponent, BadgeComponent, SectionTitleComponent, StatusBadgeComponent, IconComponent],
  templateUrl: './client-detail.component.html',
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
  edit(c: Client) { this.router.navigateByUrl(`/clients/${c.id}/modifier`); }
  remove(c: Client) {
    if (!confirm(`Supprimer le client « ${c.name} » ? Cette action est irréversible.`)) return;
    this.api.deleteClient(c.id).subscribe(() => this.router.navigateByUrl('/clients'));
  }
}
