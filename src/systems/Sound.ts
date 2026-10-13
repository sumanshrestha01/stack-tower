import Phaser from 'phaser';
import { Playables } from './Playables';
export const SOUND_KEYS = ['place','slice','perfect','fall','click','gameover','newbest'] as const;
export type SoundKey = typeof SOUND_KEYS[number];
// Wrapper over Phaser's global sound manager. Muting follows YouTube's audio setting only.
export class Sound {
  private mgr?: Phaser.Sound.BaseSoundManager;
  // Own copy of YouTube's audio state: the manager's mute getter lags while the audio context is suspended.
  enabled = true;
  attach(mgr: Phaser.Sound.BaseSoundManager): void {
    const apply = (enabled: boolean) => { this.enabled = enabled; mgr.mute = !enabled; };
    this.mgr = mgr; apply(Playables.audioEnabled());
    Playables.onAudioEnabledChange(apply);
  }
  play(key: SoundKey, rate = 1, volume = 0.7): void {
    if (!this.mgr || !this.enabled) return;
    try { this.mgr.play(key, { rate, volume }); } catch { /* Audio may be disabled in embedded environments */ }
  }
}
export const sound = new Sound();
