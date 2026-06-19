import { Component, inject, signal } from '@angular/core';
import { CardComponent, KpiCardComponent, BtnComponent, AvatarComponent, SectionTitleComponent } from '../shared/ui';
import { AreaChartComponent } from '../shared/area-chart.component';
import { ApiService } from '../core/api.service';
import { euro, frDate, daysOverdue, DashboardData } from '../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardComponent, KpiCardComponent, BtnComponent, AvatarComponent, SectionTitleComponent, AreaChartComponent],
  template: `
    <div>
      <div class="head">
        <div class="month">{{ monthLabel() }}</div>
        <h1 class="page-h1">Bonjour{{ greeting() }}</h1>
      </div>

      <div class="grid-3" style="margin-bottom:18px">
        <v-kpi-card icon="euro" label="Encaissé" [value]="m('encaisse')" [accent]="true" foot="Total des factures payées" />
        <v-kpi-card icon="clock" label="En attente de paiement" [value]="m('enAttente')" [foot]="attenteFoot()" />
        <v-kpi-card icon="receipt" label="TVA collectée" [value]="m('tvaCollectee')" foot="Sur les factures payées" />
      </div>

      <div class="grid-main" style="margin-bottom:18px">
        <v-card>
          <div class="rev-head">
            <div>
              <h3>Chiffre d'affaires encaissé</h3>
              <div class="rev-amount">
                <span class="mono-num big">{{ m('caAnnee') }}</span>
                <span class="vs">cette année</span>
              </div>
            </div>
            <span class="legend"><span class="legend-line"></span>Encaissé</span>
          </div>
          @if (hasSeries()) {
            <v-area-chart [data]="caEncaisse()" [labels]="months()" [height]="230" />
          } @else {
            <div class="chart-empty">Aucun encaissement à afficher pour l'instant.</div>
          }
        </v-card>

        <v-card>
          <v-section-title>Encaissements à venir
            <v-btn action variant="ghost" size="sm" iconRight="arrowRight">Tout voir</v-btn>
          </v-section-title>
          <div class="up-list">
            @for (iv of data()?.upcoming || []; track iv.id; let idx = $index) {
              <div class="up-row" [class.bordered]="idx > 0">
                <v-avatar [name]="iv.client_name" [size]="36" />
                <div class="up-main">
                  <div class="up-name">{{ iv.client_name }}</div>
                  <div class="up-due">échéance {{ frDate(iv.due_on) }}</div>
                </div>
                <div class="up-amt">
                  <div class="mono-num">{{ euro(ttc(iv.ht)) }}</div>
                  @if (iv.statut === 'overdue') { <div class="late">En retard · {{ daysOverdue(iv.due_on) }} j</div> }
                </div>
              </div>
            }
            @if (!(data()?.upcoming || []).length) {
              <div class="empty">Aucune facture en attente d'encaissement.</div>
            }
          </div>
        </v-card>
      </div>
    </div>
  `,
  styles: [`
    .head { margin-bottom: 24px; }
    .month { font-size: 13px; color: var(--text-3); font-weight: 600; margin-bottom: 4px; text-transform: capitalize; }
    .rev-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .rev-head h3 { font-size: 16px; font-weight: 600; }
    .rev-amount { display: flex; align-items: baseline; gap: 10px; margin-top: 8px; }
    .big { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    .vs { font-size: 12.5px; color: var(--text-3); }
    .legend { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--text-2); }
    .legend-line { width: 16px; height: 0; border-top: 2.5px solid var(--primary); }
    .chart-empty { height: 230px; display: grid; place-items: center; color: var(--text-3); font-size: 13.5px; }
    .up-list { display: flex; flex-direction: column; gap: 2px; }
    .up-row { display: flex; align-items: center; gap: 12px; padding: 11px 4px; }
    .up-row.bordered { border-top: 1px solid var(--border-soft); }
    .up-main { flex: 1; min-width: 0; }
    .up-name { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .up-due { font-size: 12px; color: var(--text-3); }
    .up-amt { text-align: right; }
    .up-amt .mono-num { font-size: 14px; font-weight: 600; }
    .late { font-size: 11.5px; color: var(--danger); font-weight: 600; margin-top: 2px; }
    .empty { font-size: 13.5px; color: var(--text-3); padding: 16px 4px; }
  `],
})
export class DashboardComponent {
  private api = inject(ApiService);
  data = signal<DashboardData | null>(null);
  ownerName = signal('');

  euro = euro;
  frDate = frDate;
  daysOverdue = daysOverdue;

  constructor() {
    this.api.dashboard().subscribe((d) => this.data.set(d));
    this.api.profile().subscribe((p) => this.ownerName.set(p?.['ownerName'] || ''));
  }

  private kpis() { return this.data()?.kpis || {}; }
  num(k: string): number { return Number(this.kpis()[k]) || 0; }
  m(k: string): string { return euro(this.num(k)); }
  months(): string[] { return this.kpis()['months'] || []; }
  caEncaisse(): number[] { return this.kpis()['caEncaisse'] || []; }
  hasSeries(): boolean { return this.caEncaisse().some((v) => v > 0); }
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
