import { Component, Input } from '@angular/core';

@Component({
  selector: 'v-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class CardComponent {
  @Input() pad = 22;
  @Input() hoverable = false;
  @Input() accent = false;
}
