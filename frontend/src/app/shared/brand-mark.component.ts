import { Component, Input } from '@angular/core';

@Component({
  selector: 'v-brand-mark',
  standalone: true,
  templateUrl: './brand-mark.component.html',
})
export class BrandMarkComponent {
  @Input() size = 24;
  @Input() light = false;
}
