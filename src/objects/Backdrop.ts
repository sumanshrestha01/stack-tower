import Phaser from 'phaser';
import { SKY_STAGES } from '../config/gameConfig';
import type { ViewRect } from '../systems/View';
const KEYS = ['bg_sunset', 'bg_night', 'bg_space'];
const MAX_SINK = (SKY_STAGES[1] + 4) * 4;
// Stacked skies covering the whole visible area that cross-fade as the tower climbs; the city sinks
// away with a little parallax. Portrait art on tall screens, landscape art on wide ones.
export class Backdrop {
  private layers: Phaser.GameObjects.Image[];
  private sink = 0;
  private view?: ViewRect;
  constructor(private scene: Phaser.Scene) {
    this.layers = KEYS.map((key, i) => scene.add.image(0, 0, key).setDepth(-100 + i).setAlpha(i === 0 ? 1 : 0));
  }
  layout(view: ViewRect): void {
    this.view = view;
    const wide = view.width > view.height;
    this.layers.forEach((img, i) => {
      const key = KEYS[i] + (wide ? '_wide' : '');
      if (img.texture.key !== key) img.setTexture(key);
      // the sunset needs spare height above so it can sink without exposing its top edge
      const needH = view.height + (i === 0 ? MAX_SINK : 0);
      img.setScale(Math.max(view.width / img.width, needH / img.height) * 1.01);
      img.x = view.cx;
      img.y = i === 0 ? view.bottom - img.displayHeight / 2 + 2 + this.sink : view.cy;
    });
  }
  setAltitude(score: number): void {
    const [, night, space] = SKY_STAGES;
    const fade = (from: number) => Phaser.Math.Clamp((score - from + 6) / 10, 0, 1);
    const targets = [1, fade(night), fade(space)];
    this.layers.forEach((layer, i) => this.scene.tweens.add({ targets: layer, alpha: targets[i], duration: 600 }));
    const sink = Math.min(score * 4, MAX_SINK), dy = sink - this.sink;
    this.sink = sink;
    if (dy && this.view) this.scene.tweens.add({ targets: this.layers[0], y: this.layers[0].y + dy, duration: 300, ease: 'Sine.out' });
  }
}
