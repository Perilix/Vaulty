import { Component, Input, computed, signal } from '@angular/core';
import { euro } from '../core/models';

@Component({
  selector: 'v-area-chart',
  standalone: true,
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.css',
})
export class AreaChartComponent {
  private _data = signal<number[]>([]);
  @Input({ required: true }) set data(v: number[]) { this._data.set(v || []); }
  get data() { return this._data(); }
  @Input() caData: number[] = [];
  @Input() labels: string[] = [];
  @Input() height = 220;

  active = signal<number | null>(null);

  readonly W = 760;
  readonly padL = 8;
  readonly padR = 8;
  readonly padT = 18;
  readonly padB = 26;

  private iw = this.W - this.padL - this.padR;
  private ih = () => this.height - this.padT - this.padB;
  private max = computed(() => Math.max(...this._data(), 1) * 1.12);

  px(i: number) { return this.padL + (this.iw * i) / Math.max(1, this._data().length - 1); }
  private yOf(v: number) { return this.padT + this.ih() - (v / this.max()) * this.ih(); }

  leftPct(i: number) { return (this.px(i) / this.W) * 100; }
  topPx(i: number) { return this.yOf(this._data()[i] || 0); }

  bandX(i: number) {
    return i === 0 ? 0 : (this.px(i - 1) + this.px(i)) / 2;
  }
  bandW(i: number) {
    const n = this._data().length;
    const left = this.bandX(i);
    const right = i === n - 1 ? this.W : (this.px(i) + this.px(i + 1)) / 2;
    return Math.max(0, right - left);
  }

  fmt(v: number) { return euro(v); }

  private encPts = computed<[number, number][]>(() =>
    this._data().map((v, i) => [this.px(i), this.yOf(v)]),
  );

  private smooth(pts: [number, number][]) {
    if (!pts.length) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
    }
    return d;
  }

  line = computed(() => this.smooth(this.encPts()));
  area = computed(() => {
    const pts = this.encPts();
    if (!pts.length) return '';
    const base = this.padT + this.ih();
    return this.line() + ` L ${pts[pts.length - 1][0]} ${base} L ${pts[0][0]} ${base} Z`;
  });
  gridY = computed(() => [0.25, 0.5, 0.75, 1].map((p) => this.padT + this.ih() - p * this.ih()));
}
