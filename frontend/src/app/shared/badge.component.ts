import { Component, Input, computed, signal } from '@angular/core';
import { Tone, toneVar } from '../core/models';

@Component({
  selector: 'v-badge',
  standalone: true,
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.css',
})
export class BadgeComponent {
  private _tone = signal<Tone>('muted');
  @Input() set tone(v: Tone) { this._tone.set(v); }
  @Input() dot = false;
  c = computed(() => toneVar(this._tone()));
}
