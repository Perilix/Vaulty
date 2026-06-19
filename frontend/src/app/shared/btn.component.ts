import { Component, Input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'v-btn',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './btn.component.html',
  styleUrl: './btn.component.css',
})
export class BtnComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'dark' = 'primary';
  @Input() icon?: string;
  @Input() iconRight?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
