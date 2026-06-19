import { Injectable, signal } from '@angular/core';

type Theme = 'dark' | 'light';
const KEY = 'vaulty-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>((localStorage.getItem(KEY) as Theme) || 'dark');

  constructor() {
    this.apply();
  }

  set(t: Theme) {
    this.theme.set(t);
    localStorage.setItem(KEY, t);
    this.apply();
  }

  toggle() {
    this.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private apply() {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
