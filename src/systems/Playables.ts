import Phaser from 'phaser';
// YouTube Playables SDK bridge. The SDK script is loaded in index.html before any game code;
// outside YouTube (local dev, or SDK unreachable) every call falls back to a harmless default.
const sdk = typeof ytgame !== 'undefined' ? ytgame : undefined;
export const inPlayables = !!sdk?.IN_PLAYABLES_ENV;
let readySent = false;
export const Playables = {
  firstFrameReady(): void { try { sdk?.game.firstFrameReady(); } catch { /* not in Playables */ } },
  gameReady(): void { if (readySent) return; readySent = true; try { sdk?.game.gameReady(); } catch { /* not in Playables */ } },
  loadData(): Promise<string> { return sdk!.game.loadData(); },
  saveData(data: string): Promise<void> { return sdk!.game.saveData(data); },
  sendScore(value: number): void { if (inPlayables) sdk!.engagement.sendScore({ value }).catch(() => {}); },
  audioEnabled(): boolean { return inPlayables ? sdk!.system.isAudioEnabled() : true; },
  onAudioEnabledChange(cb: (enabled: boolean) => void): void { if (inPlayables) sdk!.system.onAudioEnabledChange(cb); },
  onPause(cb: () => void): void { if (inPlayables) sdk!.system.onPause(cb); },
  onResume(cb: () => void): void { if (inPlayables) sdk!.system.onResume(cb); },
};
// Phaser normally pauses itself through the Page Visibility API and window blur/focus, which Playables
// forbids. Call from the game's postBoot callback: Phaser installs those listeners synchronously right
// after postBoot returns, so we filter that one registration and unhook the handlers afterwards.
export function detachPhaserVisibility(game: Phaser.Game): void {
  const add = document.addEventListener;
  document.addEventListener = function (this: Document, type: string, ...rest: unknown[]) {
    if (!/visibilitychange$/.test(type)) return (add as (...a: unknown[]) => void).call(this, type, ...rest);
  } as typeof document.addEventListener;
  queueMicrotask(() => {
    document.addEventListener = add;
    window.onblur = null; window.onfocus = null;
    // Drop every listener (Game's own pause/resume and the sound manager's) for these events.
    const E = Phaser.Core.Events;
    for (const e of [E.HIDDEN, E.VISIBLE, E.BLUR, E.FOCUS]) game.events.off(e);
    game.sound.pauseOnBlur = false;
  });
}
// Pause everything (loop, rendering, tweens, timers, input, audio) only on the SDK's signals.
export function bindLifecycle(game: Phaser.Game, onPause: () => void): void {
  const setInput = (on: boolean) => { game.input.enabled = on; if (game.input.keyboard) game.input.keyboard.enabled = on; };
  const setAudio = (on: boolean) => {
    const audio = game.sound;
    if (audio instanceof Phaser.Sound.WebAudioSoundManager) void (on ? audio.context.resume() : audio.context.suspend());
    else if (on) audio.resumeAll(); else audio.pauseAll();
  };
  Playables.onPause(() => { onPause(); game.pause(); setInput(false); setAudio(false); });
  Playables.onResume(() => { setAudio(true); setInput(true); game.resume(); });
}
