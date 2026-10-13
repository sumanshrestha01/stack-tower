import Phaser from 'phaser';
import { HEIGHT, WIDTH } from '../config/gameConfig';
// The canvas runs at device resolution and any aspect ratio. Gameplay is authored in a 420x760
// design area; each scene's camera fits that area to the screen and the extra space on the sides
// (wide screens) or top (tall screens) is filled by the backdrop and edge-anchored HUD.
export interface ViewRect { left: number; top: number; right: number; bottom: number; width: number; height: number; cx: number; cy: number; zoom: number; }
export const View = { zoom: 1 };
// align 'bottom' pins the design area to the screen bottom (tall screens gain sky above the tower).
export function fitCamera(scene: Phaser.Scene, align: 'center' | 'bottom'): ViewRect {
  const { width: W, height: H } = scene.scale;
  const zoom = Math.min(W / WIDTH, H / HEIGHT);
  const width = W / zoom, height = H / zoom;
  const left = WIDTH / 2 - width / 2;
  const top = align === 'bottom' ? HEIGHT - height : HEIGHT / 2 - height / 2;
  const cam = scene.cameras.main;
  cam.setSize(W, H).setZoom(zoom).centerOn(left + width / 2, top + height / 2);
  View.zoom = zoom;
  sharpenTexts(scene.children.list, zoom);
  return { left, top, right: left + width, bottom: top + height, width, height, cx: left + width / 2, cy: top + height / 2, zoom };
}
// Text is rasterised at creation; render it at camera zoom so it stays crisp when scaled up.
function sharpenTexts(list: Phaser.GameObjects.GameObject[], zoom: number): void {
  for (const obj of list) {
    if (obj instanceof Phaser.GameObjects.Text) { if (obj.style.resolution !== zoom) obj.setResolution(zoom); }
    else if (obj instanceof Phaser.GameObjects.Container) sharpenTexts(obj.list, zoom);
  }
}
// Re-run a layout function whenever the canvas is resized, for the lifetime of the scene.
export function onResize(scene: Phaser.Scene, layout: () => void): void {
  scene.scale.on(Phaser.Scale.Events.RESIZE, layout);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, layout));
}
