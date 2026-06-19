import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'v-area-chart',
  standalone: true,
  template: `
    <svg [attr.viewBox]="'0 0 ' + W + ' ' + height" width="100%" [attr.height]="height"
      preserveAspectRatio="none" style="overflow:visible">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.26" />
          <stop offset="100%" stop-color="var(--primary)" stop-opacity="0.01" />
        </linearGradient>
      </defs>
      @for (y of gridY(); track $index) {
        <line [attr.x1]="padL" [attr.y1]="y" [attr.x2]="W - padR" [attr.y2]="y"
          stroke="var(--border-soft)" stroke-width="1" stroke-dasharray="2 5" />
      }
      <path [attr.d]="area()" fill="url(#areaFill)" />
      <path [attr.d]="encLine()" fill="none" stroke="var(--primary)" stroke-width="2.6" />
      @for (pt of encPts(); track $index) {
        <circle [attr.cx]="pt[0]" [attr.cy]="pt[1]" [attr.r]="$index === encPts().length - 1 ? 4.5 : 0"
          fill="var(--surface)" stroke="var(--primary)" stroke-width="2.6" />
      }
      @for (l of labels; track $index) {
        <text [attr.x]="xOf($index, labels.length)" [attr.y]="height - 6" text-anchor="middle"
          font-size="11" font-family="Hanken Grotesk" fill="var(--text-3)">{{ l }}</text>
      }
    </svg>
  `,
})
export class AreaChartComponent {
  private _data = signal<number[]>([]);
  @Input({ required: true }) set data(v: number[]) { this._data.set(v || []); }
  @Input() labels: string[] = [];
  @Input() height = 220;

  readonly W = 760;
  readonly padL = 8;
  readonly padR = 8;
  readonly padT = 18;
  readonly padB = 26;

  private iw = this.W - this.padL - this.padR;
  private ih = () => this.height - this.padT - this.padB;
  private max = computed(() => Math.max(...this._data(), 1) * 1.12);

  xOf(i: number, len: number) { return this.padL + (this.iw * i) / Math.max(1, len - 1); }
  private yOf(v: number) { return this.padT + this.ih() - (v / this.max()) * this.ih(); }

  encPts = computed<[number, number][]>(() =>
    this._data().map((v, i) => [this.xOf(i, this._data().length), this.yOf(v)]),
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

  encLine = computed(() => this.smooth(this.encPts()));
  area = computed(() => {
    const pts = this.encPts();
    if (!pts.length) return '';
    const base = this.padT + this.ih();
    return this.encLine() + ` L ${pts[pts.length - 1][0]} ${base} L ${pts[0][0]} ${base} Z`;
  });
  gridY = computed(() => [0.25, 0.5, 0.75, 1].map((p) => this.padT + this.ih() - p * this.ih()));
}
