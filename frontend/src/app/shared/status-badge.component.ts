import { Component, Input, computed, signal } from '@angular/core';
import { BadgeComponent } from './badge.component';
import { InvoiceStatus, STATUS_LABELS } from '../core/models';

@Component({
  selector: 'v-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  private _s = signal<InvoiceStatus>('draft');
  @Input({ required: true }) set status(v: InvoiceStatus) { this._s.set(v); }
  @Input() retard?: number;
  meta = computed(() => STATUS_LABELS[this._s()]);
  retardLabel() { return this.retard ? ` · ${this.retard}j` : ''; }
}
