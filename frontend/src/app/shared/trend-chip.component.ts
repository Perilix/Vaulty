import { Component, Input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'v-trend-chip',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './trend-chip.component.html',
  styleUrl: './trend-chip.component.css',
})
export class TrendChipComponent {
  @Input() value = 0;
  @Input() invert = false;
  @Input() suffix = '%';
  good() { const up = this.value >= 0; return this.invert ? !up : up; }
}
