import { inPlayables, Playables } from './Playables';
// Best score lives in memory during play and is persisted with flush(): YouTube cloud save inside
// Playables (the only save mechanism allowed there), localStorage when running outside YouTube.
const LOCAL_KEY = 'stack-tower-high-score';
let best = 0, saved = 0, loaded = false;
function parse(raw: string | null): number {
  if (!raw) return 0;
  try { const v = JSON.parse(raw); const n = typeof v === 'number' ? v : Number(v?.best); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
  catch { return 0; }
}
export const Store = {
  // Must complete before any save; a failed or stalled load disables saving so cloud data is never overwritten.
  async init(): Promise<void> {
    try {
      const raw = inPlayables
        ? await Promise.race([Playables.loadData(), new Promise<never>((_, reject) => setTimeout(reject, 5000))])
        : localStorage.getItem(LOCAL_KEY);
      best = saved = parse(raw); loaded = true;
    } catch { /* play on without persistence */ }
  },
  best(): number { return best; },
  save(score: number): void { if (score > best) best = score; },
  flush(): void {
    if (!loaded || best === saved) return;
    saved = best;
    const data = JSON.stringify({ v: 1, best });
    if (inPlayables) { Playables.saveData(data).catch(() => { saved = -1; }); Playables.sendScore(best); }
    else { try { localStorage.setItem(LOCAL_KEY, data); } catch { /* restricted storage */ } }
  },
};
