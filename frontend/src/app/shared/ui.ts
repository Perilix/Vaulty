import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { IconComponent } from './icon.component';
import { euro, InvoiceStatus, STATUS_LABELS, Tone, toneVar } from '../core/models';

/* ---------------- Card ---------------- */
@Component({
  selector: 'v-card',
  standalone: true,
  template: `<div class="card" [class.hoverable]="hoverable" [class.accent]="accent" [style.padding.px]="pad"><ng-content /></div>`,
  styles: [`
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
      box-shadow: var(--shadow-sm); transition: box-shadow .2s, transform .2s, border-color .2s; }
    .hoverable:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .accent { background: linear-gradient(150deg, #394054 0%, #2A2F3D 60%, #232733 100%);
      border-color: rgba(93,165,179,0.32);
      box-shadow: 0 0 0 1px rgba(93,165,179,0.08), 0 14px 36px rgba(0,0,0,0.40); }
  `],
})
export class CardComponent {
  @Input() pad = 22;
  @Input() hoverable = false;
  @Input() accent = false;
}

/* ---------------- Button ---------------- */
@Component({
  selector: 'v-btn',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button class="btn" [class]="variant + ' s-' + size">
      @if (icon) { <v-icon [name]="icon" [size]="16" /> }
      <ng-content />
      @if (iconRight) { <v-icon [name]="iconRight" [size]="16" /> }
    </button>
  `,
  styles: [`
    .btn { display: inline-flex; align-items: center; gap: 8px; border-radius: 11px; font-size: 13.5px;
      font-weight: 600; transition: all .15s; white-space: nowrap; width: 100%; justify-content: center; }
    :host { display: inline-flex; }
    :host(.block) { display: flex; }
    :host(.block) .btn { width: 100%; }
    .s-sm { padding: 7px 12px; } .s-md { padding: 10px 16px; } .s-lg { padding: 12px 20px; }
    .primary { background: var(--primary); color: #fff; border: 1px solid transparent; }
    .primary:hover { background: var(--primary-strong); }
    .secondary { background: var(--surface); color: var(--text); border: 1px solid var(--border); }
    .secondary:hover { background: var(--surface-inset); }
    .ghost { background: transparent; color: var(--text-2); border: 1px solid transparent; }
    .ghost:hover { background: var(--surface-inset); }
    .dark { background: var(--sage-900); color: #fff; border: 1px solid transparent; }
  `],
})
export class BtnComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'dark' = 'primary';
  @Input() icon?: string;
  @Input() iconRight?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}

/* ---------------- Badge ---------------- */
@Component({
  selector: 'v-badge',
  standalone: true,
  template: `
    <span class="badge" [style.background]="c().bg" [style.color]="c().fg">
      @if (dot) { <span class="dot" [style.background]="c().fg"></span> }
      <ng-content />
    </span>
  `,
  styles: [`
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px;
      font-size: 12px; font-weight: 600; line-height: 1; white-space: nowrap; }
    .dot { width: 6px; height: 6px; border-radius: 999px; }
  `],
})
export class BadgeComponent {
  private _tone = signal<Tone>('muted');
  @Input() set tone(v: Tone) { this._tone.set(v); }
  @Input() dot = false;
  c = computed(() => toneVar(this._tone()));
}

/* ---------------- Status badge (facture) ---------------- */
@Component({
  selector: 'v-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  template: `<v-badge [tone]="meta().tone" [dot]="true">{{ meta().label }}{{ retardLabel() }}</v-badge>`,
})
export class StatusBadgeComponent {
  private _s = signal<InvoiceStatus>('draft');
  @Input({ required: true }) set status(v: InvoiceStatus) { this._s.set(v); }
  @Input() retard?: number;
  meta = computed(() => STATUS_LABELS[this._s()]);
  retardLabel() { return this.retard ? ` · ${this.retard}j` : ''; }
}

/* ---------------- Avatar ---------------- */
@Component({
  selector: 'v-avatar',
  standalone: true,
  template: `
    <div class="av" [style.width.px]="size" [style.height.px]="size"
      [style.background]="bg()" [style.font-size.px]="size * 0.38">{{ initials() }}</div>
  `,
  styles: [`
    .av { border-radius: 999px; color: #fff; display: grid; place-items: center; font-weight: 700;
      flex-shrink: 0; font-family: 'Space Grotesk', sans-serif; }
  `],
})
export class AvatarComponent {
  private _name = signal('');
  @Input({ required: true }) set name(v: string) { this._name.set(v || ''); }
  @Input() size = 34;
  @Input() color?: string;
  private palette = ['var(--sage-500)', 'var(--sage-300)', 'var(--sage-700)', 'var(--accent)'];
  initials = computed(() => this._name().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase());
  bg = computed(() => this.color || this.palette[(this._name().charCodeAt(0) || 0) % this.palette.length]);
}

/* ---------------- TrendChip ---------------- */
@Component({
  selector: 'v-trend-chip',
  standalone: true,
  imports: [IconComponent],
  template: `
    <span class="chip" [style.color]="good() ? 'var(--pos)' : 'var(--danger)'">
      <v-icon [name]="value >= 0 ? 'trending' : 'trendingDown'" [size]="14" [stroke]="2.2" />
      {{ value >= 0 ? '+' : '' }}{{ value }}{{ suffix }}
    </span>
  `,
  styles: [`.chip { display: inline-flex; align-items: center; gap: 3px; font-size: 12.5px; font-weight: 600; }`],
})
export class TrendChipComponent {
  @Input() value = 0;
  @Input() invert = false;
  @Input() suffix = '%';
  good() { const up = this.value >= 0; return this.invert ? !up : up; }
}

/* ---------------- KpiCard ---------------- */
@Component({
  selector: 'v-kpi-card',
  standalone: true,
  imports: [CardComponent, IconComponent, TrendChipComponent],
  template: `
    <v-card [pad]="20" [hoverable]="true" [accent]="accent">
      <div class="acc" [class.accent]="accent">
        <div class="top">
          <div class="lead">
            <div class="ic"><v-icon [name]="icon" [size]="18" /></div>
            <span class="label">{{ label }}</span>
          </div>
          @if (trend != null) { <v-trend-chip [value]="trend" [invert]="trendInvert" /> }
        </div>
        <div class="val mono-num">{{ value }}</div>
        @if (foot) { <div class="foot">{{ foot }}</div> }
      </div>
    </v-card>
  `,
  styles: [`
    .top { display: flex; align-items: center; justify-content: space-between; }
    .lead { display: flex; align-items: center; gap: 10px; }
    .ic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
      background: var(--primary-soft); color: var(--primary); }
    .label { font-size: 12.5px; font-weight: 600; color: var(--text-2); }
    .val { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 1; color: var(--text); margin-top: 14px; }
    .foot { font-size: 12px; color: var(--text-3); margin-top: 10px; }
    /* variante accent (carte ardoise dégradée) */
    .accent .ic { background: rgba(93,165,179,0.20); color: #7FC2CF; }
    .accent .label { color: rgba(224,226,232,0.80); }
    .accent .val { color: #fff; }
    .accent .foot { color: rgba(224,226,232,0.68); }
  `],
})
export class KpiCardComponent {
  @Input({ required: true }) icon!: string;
  @Input() label = '';
  @Input() value = '';
  @Input() trend: number | null = null;
  @Input() trendInvert = false;
  @Input() foot = '';
  @Input() accent = false;
}

/* ---------------- SectionTitle ---------------- */
@Component({
  selector: 'v-section-title',
  standalone: true,
  template: `
    <div class="st">
      <h3><ng-content /></h3>
      <ng-content select="[action]" />
    </div>
  `,
  styles: [`
    .st { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    h3 { font-size: 16px; font-weight: 600; color: var(--text); }
  `],
})
export class SectionTitleComponent {}

/* ---------------- Segmented ---------------- */
export interface SegOption { value: string; label: string; icon?: string; }
@Component({
  selector: 'v-segmented',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="seg">
      @for (o of options; track o.value) {
        <button [class.active]="o.value === value" [class.small]="small" (click)="valueChange.emit(o.value)">
          @if (o.icon) { <v-icon [name]="o.icon" [size]="15" /> }
          {{ o.label }}
        </button>
      }
    </div>
  `,
  styles: [`
    .seg { display: inline-flex; gap: 3px; background: var(--surface-inset); padding: 3px; border-radius: 12px;
      border: 1px solid var(--border-soft); }
    button { display: inline-flex; align-items: center; gap: 6px; padding: 8px 15px; border-radius: 9px;
      font-size: 13px; font-weight: 600; color: var(--text-3); background: transparent; transition: all .15s; }
    button.small { padding: 6px 12px; }
    button.active { color: var(--text); background: var(--surface); box-shadow: var(--shadow-sm); }
  `],
})
export class SegmentedComponent {
  @Input() options: SegOption[] = [];
  @Input() value = '';
  @Input() small = false;
  @Output() valueChange = new EventEmitter<string>();
}

export { euro };
