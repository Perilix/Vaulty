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
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css',
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
