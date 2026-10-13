import Phaser from 'phaser';
import { BLOCK_HEIGHT } from '../config/gameConfig';
// Block textures are authored at 3x so they stay sharp under camera zoom. Caps are 42px (3x of 14),
// so a 3-slice can't be narrower than MIN_SLICE texture pixels; thinner blocks are scaled instead.
const RES = 3, CAP = 42, MIN_SLICE = CAP * 2 + 6;
export class Block extends Phaser.GameObjects.Container {
  private body3: Phaser.GameObjects.NineSlice;
  private shine: Phaser.GameObjects.NineSlice;
  widthPixels: number;
  color: number;
  constructor(scene: Phaser.Scene, x: number, top: number, width: number, color: number) {
    super(scene, x, top);
    this.widthPixels = width; this.color = color;
    this.body3 = scene.add.nineslice(0, BLOCK_HEIGHT / 2, 'block', undefined, MIN_SLICE, 0, CAP, CAP).setTint(color);
    this.shine = scene.add.nineslice(0, BLOCK_HEIGHT / 2, 'block_shine', undefined, MIN_SLICE, 0, CAP, CAP);
    this.add([this.body3, this.shine]);
    scene.add.existing(this); this.redraw();
  }
  redraw(): void {
    const texW = this.widthPixels * RES, sliceW = Math.max(MIN_SLICE, texW);
    for (const part of [this.body3, this.shine]) { part.setSize(sliceW, BLOCK_HEIGHT * RES); part.setScale(texW / sliceW / RES, 1 / RES); }
  }
  setWidthPixels(width: number): void { this.widthPixels = width; this.redraw(); }
}
