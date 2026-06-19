import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardComponent, BtnComponent, SegmentedComponent, SectionTitleComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-new-client',
  standalone: true,
  imports: [FormsModule, CardComponent, BtnComponent, SegmentedComponent, SectionTitleComponent, IconComponent],
  template: `
    <div class="wrap">
      <button class="back" (click)="router.navigateByUrl('/clients')">
        <v-icon name="arrowRight" [size]="16" style="transform:rotate(180deg)" /> Retour aux clients
      </button>
      <h1 class="page-h1" style="margin-bottom:4px">Nouveau client</h1>
      <div class="sub" style="margin-bottom:24px">Ajoute un client à ton carnet pour le facturer et suivre ses paiements.</div>

      <v-card style="margin-bottom:18px">
        <v-section-title>Type de client</v-section-title>
        <v-segmented [value]="type()" (valueChange)="type.set($event)" [options]="typeOpts" />
      </v-card>

      <v-card style="margin-bottom:18px">
        <v-section-title>{{ type() === 'entreprise' ? 'Informations entreprise' : 'Informations' }}</v-section-title>
        <div class="form-grid">
          <div class="full">
            <label class="v-label">{{ type() === 'entreprise' ? 'Raison sociale' : 'Nom complet' }}</label>
            <input class="v-input" [(ngModel)]="f.name" [placeholder]="type() === 'entreprise' ? 'Atelier Moreau' : 'Camille Rousseau'" />
          </div>
          <div><label class="v-label">Personne de contact</label><input class="v-input" [(ngModel)]="f.contact" placeholder="Léa Moreau" /></div>
          <div><label class="v-label">Email</label><input class="v-input" type="email" [(ngModel)]="f.email" placeholder="contact@exemple.fr" /></div>
          <div><label class="v-label">Téléphone</label><input class="v-input" [(ngModel)]="f.phone" placeholder="01 23 45 67 89" /></div>
          @if (type() === 'entreprise') {
            <div><label class="v-label">SIRET</label><input class="v-input" [(ngModel)]="f.siret" placeholder="000 000 000 00000" /></div>
          }
          <div class="full"><label class="v-label">Adresse</label><input class="v-input" [(ngModel)]="f.address" placeholder="12 rue des Lilas" /></div>
          <div><label class="v-label">Ville</label><input class="v-input" [(ngModel)]="f.city" placeholder="Lyon" /></div>
          <div>
            <label class="v-label">Conditions de paiement</label>
            <div class="sel-wrap">
              <select class="v-select" [(ngModel)]="f.conditions">
                @for (o of conditions; track o) { <option [value]="o">{{ o }}</option> }
              </select>
              <v-icon name="chevronDown" [size]="16" class="chev" />
            </div>
          </div>
        </div>
      </v-card>

      <div class="foot">
        <v-btn variant="ghost" (click)="router.navigateByUrl('/clients')">Annuler</v-btn>
        <span [class.disabled]="!valid()"><v-btn variant="primary" icon="check" (click)="save()">Enregistrer le client</v-btn></span>
      </div>
    </div>
  `,
  styles: [`
    .wrap { max-width: 720px; margin: 0 auto; }
    .back { display: inline-flex; align-items: center; gap: 7px; font-size: 13.5px; font-weight: 600; color: var(--text-2); margin-bottom: 18px; }
    .back:hover { color: var(--text); }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .full { grid-column: 1 / -1; }
    .sel-wrap { position: relative; }
    .chev { position: absolute; right: 13px; top: 13px; color: var(--text-3); pointer-events: none; }
    .v-select { appearance: none; cursor: pointer; }
    .foot { display: flex; justify-content: flex-end; gap: 10px; }
    .disabled { opacity: 0.5; pointer-events: none; }
  `],
})
export class NewClientComponent {
  private api = inject(ApiService);
  router = inject(Router);

  type = signal('entreprise');
  typeOpts = [
    { value: 'entreprise', label: 'Entreprise', icon: 'building' },
    { value: 'particulier', label: 'Particulier', icon: 'clients' },
  ];
  conditions = ['À réception', 'Net 15 jours', 'Net 30 jours', 'Net 45 jours', 'Net 60 jours'];
  f = { name: '', contact: '', email: '', phone: '', address: '', city: '', siret: '', conditions: 'Net 30 jours' };

  valid() { return this.f.name.trim() && this.f.email.trim(); }
  save() {
    if (!this.valid()) return;
    this.api.createClient({ ...this.f, type: this.type() as any }).subscribe(() => this.router.navigateByUrl('/clients'));
  }
}
