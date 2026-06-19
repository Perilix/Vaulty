import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from './icon.component';

export interface SegOption { value: string; label: string; icon?: string; }

@Component({
  selector: 'v-segmented',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './segmented.component.html',
  styleUrl: './segmented.component.css',
})
export class SegmentedComponent {
  @Input() options: SegOption[] = [];
  @Input() value = '';
  @Input() small = false;
  @Output() valueChange = new EventEmitter<string>();
}
