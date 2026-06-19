import { Component, Input } from '@angular/core';
import { CardComponent } from './card.component';
import { IconComponent } from './icon.component';
import { TrendChipComponent } from './trend-chip.component';

@Component({
  selector: 'v-kpi-card',
  standalone: true,
  imports: [CardComponent, IconComponent, TrendChipComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.css',
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
