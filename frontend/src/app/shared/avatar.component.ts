import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'v-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
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
