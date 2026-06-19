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
  templateUrl: './settings.component.html',
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

  p = { raisonSociale: '', siret: '', email: '', regimeTva: '', devise: 'EUR (€)', ownerName: '' };
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
