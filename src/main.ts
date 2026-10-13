import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { bindLifecycle, detachPhaserVisibility } from './systems/Playables';
import { Store } from './systems/Store';
import { sound } from './systems/Sound';
// The canvas fills the parent at device resolution (CSS size x devicePixelRatio, shown at zoom 1/dpr)
// so everything renders sharply at any size; scenes fit their own cameras to it (see systems/View.ts).
const parent = document.getElementById('game')!;
const dpr = () => Math.min(window.devicePixelRatio || 1, 3);
const cssSize = () => ({ w: Math.max(1, parent.clientWidth), h: Math.max(1, parent.clientHeight) });
const start = cssSize(), startDpr = dpr();
const game = new Phaser.Game({
  type:Phaser.WEBGL,parent,backgroundColor:'#10152c',
  scale:{mode:Phaser.Scale.NONE,width:start.w*startDpr,height:start.h*startDpr,zoom:1/startDpr},
  render:{antialias:true,pixelArt:false},
  input:{activePointers:2},
  callbacks:{postBoot:detachPhaserVisibility},
  scene:[BootScene,MenuScene,GameScene]
});
let last = '';
function fit(): void {
  const { w, h } = cssSize(), r = dpr(), key = `${w}x${h}@${r}`;
  if (key === last || !game.canvas) return;
  last = key;
  game.scale.setZoom(1 / r);
  game.scale.resize(w * r, h * r);
  game.canvas.style.width = `${w}px`; game.canvas.style.height = `${h}px`;
}
new ResizeObserver(fit).observe(parent);
window.addEventListener('resize', fit);
bindLifecycle(game,()=>Store.flush());
// Handle for scripted testing in dev; stripped from production builds.
if (import.meta.env.DEV) Object.assign(window as object, { game, sound });
