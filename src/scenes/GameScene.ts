import Phaser from 'phaser';
import { iconButton, label, textButton } from './BootScene';
import { Backdrop } from '../objects/Backdrop';
import { Block } from '../objects/Block';
import { BASE_Y,BLOCK_HEIGHT,CENTER_X,COLORS,INITIAL_WIDTH,MIN_OVERLAP,PERFECT_TOLERANCE } from '../config/gameConfig';
import { Store } from '../systems/Store';
import { sound } from '../systems/Sound';
import { fitCamera, onResize, type ViewRect } from '../systems/View';
// Half-width of the moving block's travel lane: the full 420 design width on phones, capped on
// wide screens so a pass takes the same time everywhere.
const MAX_LANE = 330;
// The tower scrolls once its top block climbs this far below the top of the screen.
const TOWER_TOP = 279;
export class GameScene extends Phaser.Scene {
  private blocks:Block[]=[]; private moving!:Block; private score=0; private combo=0;
  private velocity=145; private direction=1; private active=false; private ending=false;
  private scoreLabel!:Phaser.GameObjects.Text; private hint!:Phaser.GameObjects.Text; private flashText?:Phaser.GameObjects.Text; private comboLabel!:Phaser.GameObjects.Text;
  private bestLabel!:Phaser.GameObjects.Text; private bestCrown!:Phaser.GameObjects.Image;
  private overlay?:Phaser.GameObjects.Container; private dim?:Phaser.GameObjects.Rectangle;
  private floaters:Phaser.GameObjects.GameObject[]=[]; private cameraShift=0;
  private scenery:Phaser.GameObjects.Image[]=[]; private backdrop!:Backdrop; private bestAtStart=0; private view!:ViewRect;
  constructor(){super('Game');}
  create():void {
    this.blocks=[];this.score=0;this.combo=0;this.velocity=145;this.direction=1;this.active=true;this.ending=false;this.cameraShift=0;this.floaters=[];this.scenery=[];this.overlay=undefined;this.dim=undefined;
    this.bestAtStart=Store.best();
    this.backdrop=new Backdrop(this);
    this.view=fitCamera(this,'bottom');
    this.bestLabel=label(this,0,0,String(this.bestAtStart),20,'#ffe08a',4).setOrigin(0,.5).setDepth(50);
    this.bestCrown=this.add.image(0,0,'icon_crown').setDepth(50); this.bestCrown.setScale(30/this.bestCrown.width);
    this.scoreLabel=label(this,CENTER_X,0,'0',72,'#ffffff',8).setDepth(50);
    this.comboLabel=label(this,CENTER_X,0,'',18,'#ffe08a',4).setDepth(50);
    this.hint=label(this,CENTER_X,742,'TAP ANYWHERE TO STACK',15,'#ffffff',4).setDepth(40);
    this.tweens.add({targets:this.hint,alpha:.45,duration:700,yoyo:true,repeat:-1});
    const foot=this.add.image(CENTER_X,BASE_Y+BLOCK_HEIGHT-2,'foundation').setOrigin(.5,0); foot.setScale((INITIAL_WIDTH+80)/foot.width); this.scenery.push(foot);
    this.blocks.push(new Block(this,CENTER_X,BASE_Y,INITIAL_WIDTH,COLORS[0])); this.spawnBlock();
    this.layout(); onResize(this,()=>this.layout());
    this.input.on('pointerdown',()=>this.place());
    this.input.keyboard?.on('keydown-SPACE',this.place,this);
    this.input.keyboard?.on('keydown-ENTER',this.place,this);
    this.events.once('shutdown',()=>{this.input.keyboard?.off('keydown-SPACE',this.place,this);this.input.keyboard?.off('keydown-ENTER',this.place,this);});
  }
  // Re-anchor everything that depends on the screen shape; gameplay state is untouched.
  private layout():void {
    const v=this.view=fitCamera(this,'bottom');
    this.backdrop.layout(v);
    this.bestLabel.setPosition(v.left+48,v.top+40); this.bestCrown.setPosition(v.left+28,v.top+38);
    this.scoreLabel.y=v.top+96; this.comboLabel.y=v.top+152;
    if(this.overlay&&this.dim){
      this.overlay.setPosition(v.cx,v.cy);
      this.dim.setSize(v.width,v.height);
      (this.dim.input!.hitArea as Phaser.Geom.Rectangle).setTo(0,0,v.width,v.height);
    }
  }
  private lane():number { return Phaser.Math.Clamp(this.view.width/2,CENTER_X,MAX_LANE); }
  private spawnBlock():void {
    const previous=this.blocks[this.blocks.length-1];
    const y=BASE_Y-this.blocks.length*BLOCK_HEIGHT+this.cameraShift;
    this.direction=this.blocks.length%2===0?-1:1;
    const reach=this.lane()+previous.widthPixels/2;
    const x=CENTER_X-this.direction*reach;
    this.moving=new Block(this,x,y,previous.widthPixels,COLORS[this.blocks.length%COLORS.length]);
    // on wide screens the lane ends on-screen, so fade the block in rather than popping it
    this.moving.setAlpha(0); this.tweens.add({targets:this.moving,alpha:1,duration:150});
    this.velocity=Math.min(390,145+this.score*9);
  }
  update(_time:number,delta:number):void {
    if(!this.active || !this.moving?.active)return;
    const dt=Math.min(delta,40)/1000;
    this.moving.x+=this.direction*this.velocity*dt;
    const reach=this.lane()+this.moving.widthPixels/2;
    if(this.moving.x>CENTER_X+reach){this.moving.x=CENTER_X+reach;this.direction=-1;}
    if(this.moving.x<CENTER_X-reach){this.moving.x=CENTER_X-reach;this.direction=1;}
  }
  private place():void {
    if(!this.active||this.ending)return;
    this.active=false;
    const previous=this.blocks[this.blocks.length-1]; const current=this.moving;
    this.tweens.killTweensOf(current); current.setAlpha(1);
    const distance=current.x-previous.x;
    const isPerfect=Math.abs(distance)<=PERFECT_TOLERANCE;
    let left=Math.max(current.x-current.widthPixels/2,previous.x-previous.widthPixels/2);
    let right=Math.min(current.x+current.widthPixels/2,previous.x+previous.widthPixels/2);
    if(isPerfect){left=previous.x-previous.widthPixels/2;right=previous.x+previous.widthPixels/2;}
    const overlap=right-left;
    if(overlap<MIN_OVERLAP){this.fail();return;}
    if(isPerfect){this.combo++; current.x=previous.x;this.flash('PERFECT!'+(this.combo>1?` ×${this.combo}`:''),'#ffe08a',0xffdf89);sound.play('perfect',1+Math.min(this.combo,10)*.07);}
    else {this.combo=0;this.flash('NICE!','#8ef5e4',0x8ee9dc);sound.play('place',.95+Math.random()*.1);}
    const originalW=current.widthPixels;
    current.x=(left+right)/2;current.setWidthPixels(overlap);
    if(!isPerfect){
      const lost=originalW-overlap;
      if(lost>1){const offX=distance>0?right+lost/2:left-lost/2;
        sound.play('slice',1,.45);
        const piece=new Block(this,offX,current.y,lost,current.color); this.floaters.push(piece);
        this.tweens.add({targets:piece,x:offX+Math.sign(distance)*65,y:this.view.bottom+80,angle:Math.sign(distance)*35,alpha:0,duration:800,ease:'Quad.in',onComplete:()=>piece.destroy()});}
    }
    this.blocks.push(current);this.score++;Store.save(this.score);this.scoreLabel.setText(String(this.score));
    this.backdrop.setAltitude(this.score);
    if(this.score===1){this.tweens.killTweensOf(this.hint);this.tweens.add({targets:this.hint,alpha:0,duration:300});}
    this.tweens.add({targets:this.scoreLabel,scale:1.15,duration:80,yoyo:true});
    this.comboLabel.setText(this.combo>=2?`${this.combo} PERFECT STREAK`: '');
    if(current.y<=this.view.top+TOWER_TOP+.5){const shift=BLOCK_HEIGHT;this.cameraShift+=shift;
      for(const obj of [...this.blocks,...this.scenery])this.tweens.add({targets:obj,y:obj.y+shift,duration:140,ease:'Sine.out'});
    }
    this.time.delayedCall(155,()=>{if(this.scene.isActive()){this.spawnBlock();this.active=true;}});
  }
  private flash(text:string,color:string,tint:number):void {
    this.flashText?.destroy();
    const y=this.view.top+213;
    const txt=this.flashText=label(this,CENTER_X,y,text,28,color,6).setDepth(60).setScale(.6);
    this.tweens.add({targets:txt,scale:1,duration:140,ease:'Back.out'});
    this.tweens.add({targets:txt,y:y-33,alpha:0,delay:250,duration:500,onComplete:()=>txt.destroy()});
    const count=this.combo>0?10:6;
    for(let i=0;i<count;i++){const a=i*Math.PI*2/count;
      const spark=this.add.image(this.moving.x+Math.cos(a)*this.moving.widthPixels*.3,this.moving.y+BLOCK_HEIGHT/2,'sparkle').setTint(tint).setDepth(55).setScale(.23).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({targets:spark,x:spark.x+Math.cos(a)*55,y:spark.y+Math.sin(a)*40,alpha:0,scale:.07,angle:90,duration:450,ease:'Quad.out',onComplete:()=>spark.destroy()});}
  }
  private fail():void {
    this.ending=true; sound.play('fall');
    this.tweens.add({targets:this.moving,y:this.view.bottom+140,angle:38,alpha:0,duration:660,ease:'Quad.in'});
    this.time.delayedCall(650,()=>this.showGameOver());
  }
  private showGameOver():void {
    const newBest=this.score>this.bestAtStart, v=this.view;
    this.comboLabel.setText('');
    Store.flush();
    sound.play(newBest?'newbest':'gameover');
    // One container centred on the screen so a resize only has to move it and stretch the dim.
    const overlay=this.overlay=this.add.container(v.cx,v.cy).setDepth(100);
    const dim=this.dim=this.add.rectangle(0,0,v.width,v.height,0x070b1c,.6).setAlpha(0);
    dim.setInteractive();
    this.tweens.add({targets:dim,alpha:1,duration:200});
    const box=this.add.container(0,-10);
    const panel=this.add.image(0,0,'panel'); panel.setScale(330/panel.width);
    const title=label(this,0,-158,newBest?'NEW BEST!':'GAME OVER',newBest?40:42,newBest?'#ffe08a':'#ffffff',7);
    const sub=label(this,0,-98,'SCORE',18,'#a8b8e0',0);
    const scoreText=label(this,0,-42,String(this.score),76,'#8ef5e4',8);
    const bestText=label(this,14,28,`BEST  ${Store.best()}`,24,'#ffe08a',5);
    const crown=this.add.image(bestText.x-bestText.width/2-16,26,'icon_crown'); crown.setScale(35/crown.width);
    box.add([panel,title,sub,scoreText,bestText,crown]);
    box.setScale(.7).setAlpha(0);
    this.tweens.add({targets:box,scale:1,alpha:1,duration:320,ease:'Back.out'});
    const again=textButton(this,0,100,'PLAY AGAIN',()=>this.scene.restart(),236);
    const home=iconButton(this,0,172,'icon_home',54,()=>this.scene.start('Menu'));
    overlay.add([dim,box,again,home]);
    if(newBest){for(let i=0;i<16;i++){const s=this.add.image(v.cx,v.cy-180,'sparkle').setDepth(103).setScale(.33).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffdf89);
      const a=i*Math.PI/8;this.tweens.add({targets:s,x:s.x+Math.cos(a)*170,y:s.y+Math.sin(a)*110,alpha:0,scale:.07,duration:900,delay:200,ease:'Quad.out',onComplete:()=>s.destroy()});}}
    this.input.keyboard?.once('keydown-R',()=>this.scene.restart());
    this.input.keyboard?.once('keydown-SPACE',()=>this.scene.restart());
  }
}
