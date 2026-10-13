import Phaser from 'phaser';
import { CENTER_X, FONT, HEIGHT } from '../config/gameConfig';
import { Playables } from '../systems/Playables';
import { SOUND_KEYS, sound } from '../systems/Sound';
import { Store } from '../systems/Store';
import { View, fitCamera, onResize } from '../systems/View';
const IMAGES = ['bg_sunset','bg_night','bg_space','bg_sunset_wide','bg_night_wide','bg_space_wide','logo','button','panel','foundation','icon_home','icon_crown','sparkle'];
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload(): void {
    this.cameras.main.setBackgroundColor('#10152c');
    fitCamera(this, 'center'); onResize(this, () => fitCamera(this, 'center'));
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => Playables.firstFrameReady());
    const barW = 240;
    this.add.rectangle(CENTER_X, HEIGHT / 2, barW + 8, 18, 0x0b1127).setStrokeStyle(2, 0x8be6dd, .6);
    const bar = this.add.rectangle(CENTER_X - barW / 2, HEIGHT / 2, 1, 10, 0x8be6dd).setOrigin(0, .5);
    this.load.on('progress', (p: number) => { bar.width = Math.max(1, barW * p); });
    this.load.setPath('assets/');
    for (const key of IMAGES) this.load.image(key, `img/${key}.webp`);
    this.load.image('block', 'img/block.png');
    this.load.image('block_shine', 'img/block_shine.png');
    for (const key of SOUND_KEYS) this.load.audio(key, [`audio/${key}.ogg`, `audio/${key}.mp3`]);
  }
  create(): void {
    sound.attach(this.sound);
    // Cloud save must be loaded before anything can be saved; also wait for the bundled font
    // so the first text render isn't the fallback face.
    const font = document.fonts?.load(`40px ${FONT}`).catch(() => {});
    Promise.all([Store.init(), font]).then(() => this.scene.start('Menu'));
  }
}
export function label(scene: Phaser.Scene, x: number, y: number, text: string, size: number, color = '#ffffff', stroke = 5): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, { fontFamily: FONT, fontSize: `${size}px`, color, stroke: '#141a3a', strokeThickness: stroke, align: 'center', resolution: View.zoom })
    .setOrigin(.5).setShadow(0, 3, '#0a0f24', 0, true, false);
}
export function textButton(scene: Phaser.Scene, x: number, y: number, text: string, action: () => void, width = 240): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, 'button'); bg.setScale(width / bg.width);
  const tx = scene.add.text(0, -3, text, { fontFamily: FONT, fontSize: '26px', color: '#ffffff', stroke: '#0d4d4a', strokeThickness: 5, resolution: View.zoom }).setOrigin(.5);
  c.add([bg, tx]); c.setSize(width, bg.displayHeight).setInteractive({ useHandCursor: true });
  c.on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation(); sound.play('click');
    scene.tweens.add({ targets: c, scale: .93, duration: 70, yoyo: true, onComplete: action });
  });
  return c;
}
export function iconButton(scene: Phaser.Scene, x: number, y: number, key: string, size: number, action: (img: Phaser.GameObjects.Image) => void): Phaser.GameObjects.Image {
  const img = scene.add.image(x, y, key).setDisplaySize(size, size * scene.textures.getFrame(key).height / scene.textures.getFrame(key).width);
  const base = img.scale;
  img.setInteractive({ useHandCursor: true }).on('pointerdown', (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
    e.stopPropagation(); sound.play('click');
    scene.tweens.add({ targets: img, scale: base * .88, duration: 70, yoyo: true });
    action(img);
  });
  return img;
}
