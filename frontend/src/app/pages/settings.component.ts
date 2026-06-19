import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CardComponent, SectionTitleComponent } from '../shared/ui';
import { IconComponent } from '../shared/icon.component';
import { ThemeService } from '../core/theme.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, CardComponent, SectionTitleComponent, IconComponent],
  template: `
    <div>
      <h1 class="page-h1" style="margin-bottom:22px">Paramètres</h1>
      <div class="layout">
        <div class="nav">
          @for (t of tabs; track t.key) {
            <button [class.active]="tab() === t.key" (click)="tab.set(t.key)">
              <v-icon [name]="t.icon" [size]="17" />{{ t.label }}
            </button>
          }
        </div>

        <div class="content">
          <v-card>
            <v-section-title>Apparence</v-section-title>
            <div class="appearance">
              @for (m of modes; track m.key) {
                <button class="mode" [class.active]="theme.theme() === m.key" (click)="theme.set(m.key)">
                  <v-icon [name]="m.icon" [size]="20" [class.on]="theme.theme() === m.key" />
                  <span>{{ m.label }}</span>
                </button>
              }
            </div>
          </v-card>

          <v-card>
            <v-section-title>Profil entreprise</v-section-title>
            <div class="fields">
              <div><label class="v-label">Raison sociale</label><input class="v-input" [(ngModel)]="p.raisonSociale" /></div>
              <div><label class="v-label">SIRET</label><input class="v-input" [(ngModel)]="p.siret" /></div>
              <div><label class="v-label">Email de facturation</label><input class="v-input" [(ngModel)]="p.email" /></div>
              <div class="row2">
                <div><label class="v-label">Régime TVA</label><input class="v-input" [(ngModel)]="p.regimeTva" /></div>
                <div><label class="v-label">Devise</label><input class="v-input" [(ngModel)]="p.devise" /></div>
              </div>
              <div class="save-row"><button class="save" (click)="saveProfile()">{{ saved() ? 'Enregistré ✓' : 'Enregistrer' }}</button></div>
            </div>
          </v-card>

          <v-card>
            <v-section-title>Préférences de relance</v-section-title>
            <div class="toggles">
              @for (t of toggles(); track t.label; let idx = $index) {
                <div class="toggle-row" [class.bordered]="idx > 0">
                  <div class="t-info"><div class="t-l">{{ t.label }}</div><div class="t-s">{{ t.sub }}</div></div>
                  <button class="switch" [class.on]="t.on" (click)="flip(idx)"><div class="knob"></div></button>
                </div>
              }
            </div>
          </v-card>
        </div>
      </div>
    </div>
  `,
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  theme = inject(ThemeService);
  private api = inject(ApiService);

  tab = signal('general');
  tabs = [
    { key: 'general', label: 'Général', icon: 'settings' },
    { key: 'entreprise', label: 'Entreprise', icon: 'building' },
    { key: 'facturation', label: 'Facturation', icon: 'invoice' },
    { key: 'notifications', label: 'Notifications', icon: 'bell' },
  ];
  modes: { key: 'light' | 'dark'; label: string; icon: string }[] = [
    { key: 'light', label: 'Clair', icon: 'sun' },
    { key: 'dark', label: 'Sombre', icon: 'moon' },
  ];

  p = { raisonSociale: 'Studio Vaulty', siret: '902 118 334 00018', email: 'compta@studio-vaulty.fr', regimeTva: 'Réel normal', devise: 'EUR (€)' };
  saved = signal(false);

  toggles = signal([
    { label: 'Relance automatique des impayés', sub: 'Email envoyé 3 jours après l\'échéance', on: true },
    { label: 'Rapport hebdomadaire', sub: 'Résumé de trésorerie chaque lundi', on: true },
    { label: 'Alerte TVA', sub: 'Rappel avant échéance de déclaration', on: false },
  ]);

  constructor() {
    this.api.profile().subscribe((prof) => { if (prof) this.p = { ...this.p, ...prof }; });
  }

  flip(i: number) { this.toggles.update((ts) => ts.map((t, idx) => (idx === i ? { ...t, on: !t.on } : t))); }
  saveProfile() {
    this.api.updateProfile(this.p).subscribe(() => {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }
}
