import { Component, inject, signal } from '@angular/core';
import { CardComponent, KpiCardComponent, BtnComponent, AvatarComponent, SectionTitleComponent } from '../shared/ui';
import { AreaChartComponent } from '../shared/area-chart.component';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { euro, frDate, daysOverdue, DashboardData } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent, KpiCardComponent, BtnComponent, AvatarComponent, SectionTitleComponent, AreaChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  data = signal<DashboardData | null>(null);
  ownerName = signal('');

  euro = euro;
  frDate = frDate;
  daysOverdue = daysOverdue;

  constructor() {
    this.ownerName.set(this.auth.user()?.name || '');
    this.api.dashboard().subscribe((d) => this.data.set(d));
    this.api.profile().subscribe((p) => this.ownerName.set(p?.['ownerName'] || this.auth.user()?.name || ''));
  }

  private kpis() { return this.data()?.kpis || {}; }
  num(k: string): number { return Number(this.kpis()[k]) || 0; }
  m(k: string): string { return euro(this.num(k)); }
  months(): string[] { return this.kpis()['months'] || []; }
  caEncaisse(): number[] { return this.kpis()['caEncaisse'] || []; }
  marge(): number[] { return this.kpis()['marge'] || []; }
  hasSeries(): boolean { return this.marge().some((v) => v > 0); }
  ttc(ht: number) { return ht * 1.2; }

  greeting(): string {
    const n = this.ownerName().trim().split(' ')[0];
    return n ? ` ${n}` : '';
  }

  monthLabel(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  attenteFoot(): string {
    return `${this.num('impayesNb')} factures · dont ${this.num('retardNb')} en retard`;
  }
}
