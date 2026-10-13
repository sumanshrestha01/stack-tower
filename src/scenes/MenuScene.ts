import Phaser from 'phaser';
import { label, textButton } from './BootScene';
import { BLOCK_HEIGHT, CENTER_X, COLORS } from '../config/gameConfig';
import { Backdrop } from '../objects/Backdrop';
import { Block } from '../objects/Block';
import { Playables } from '../systems/Playables';
import { Store } from '../systems/Store';
import { fitCamera, onResize } from '../systems/View';
export class MenuScene extends Phaser.Scene {
  constructor(){super('Menu');}
  create():void {
    const backdrop=new Backdrop(this);
    const layout=()=>backdrop.layout(fitCamera(this,'center'));
    layout(); onResize(this,layout);
    const logo=this.add.image(CENTER_X,150,'logo'); logo.setScale(350/logo.width);
    this.tweens.add({targets:logo,y:160,duration:1400,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    label(this,CENTER_X,258,'ONE TAP. ENDLESS HEIGHTS.',16,'#ffe9c2',4);
    const foot=this.add.image(CENTER_X,560,'foundation').setOrigin(.5,0); foot.setScale(250/foot.width);
    for(let i=0;i<7;i++) new Block(this,CENTER_X+(i%2?6:-6),560-(i+1)*BLOCK_HEIGHT,196-i*10,COLORS[i%COLORS.length]);
    const moving=new Block(this,170,560-8*BLOCK_HEIGHT,128,COLORS[0]); this.tweens.add({targets:moving,x:250,duration:840,yoyo:true,repeat:-1,ease:'Sine.inOut'});
    textButton(this,CENTER_X,648,'PLAY',()=>this.scene.start('Game'));
    const best=label(this,CENTER_X+14,700,`BEST  ${Store.best()}`,20,'#ffe08a',4);
    const crown=this.add.image(best.x-best.width/2-14,698,'icon_crown'); crown.setScale(30/crown.width);
    label(this,CENTER_X,736,'TAP  •  CLICK  •  SPACE',13,'#c8d3f0',3);
    this.input.keyboard?.once('keydown-SPACE',()=>this.scene.start('Game'));
    this.input.keyboard?.once('keydown-ENTER',()=>this.scene.start('Game'));
    Playables.gameReady();
  }
}
