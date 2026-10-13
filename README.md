# Stack Tower — HTML5 playable

An independent Phaser 3 + TypeScript + Vite port inspired by the supplied Flutter mini-game. Requires WebGL (blocks are tinted 3-slice sprites).

## Screen sizes
The canvas fills the whole page at device resolution (`devicePixelRatio`, capped at 3), so the game renders sharply on any screen. Gameplay is authored in a 420×760 design area that each scene's camera fits to the screen (`src/systems/View.ts`). Extra width (desktop, ultrawide) or height (tall phones) shows more background, and the HUD anchors to the screen edges. Wide screens use the `*_wide` landscape backgrounds. The moving block's lane is capped at ±330 design px so wide screens don't make a pass slower. Resizing mid-game keeps the run.

`vite.config.ts` replaces Phaser's `new Function("return this")()` global-object fallback with `globalThis` in the build output, so the bundle contains no dynamic code evaluation.

## Run
```sh
npm install
npm run dev
```

## Production build
```sh
npm run build
```

Zip **contents of dist/** for a web deployment.

## YouTube Playables integration
The Playables SDK (`https://www.youtube.com/game_api/v1`) loads in `index.html` before the game code. All SDK use goes through `src/systems/Playables.ts`:

- **Loading:** `firstFrameReady()` fires on the first rendered frame of the loading bar. `gameReady()` fires once, when the menu is interactive, after the cloud save has loaded.
- **Saves:** the best score is saved with `loadData`/`saveData` as `{"v":1,"best":N}`, at game over and on pause, and only when it improved. `sendScore` sends the same value. Outside YouTube the game falls back to `localStorage`.
- **Audio:** sound follows `isAudioEnabled`/`onAudioEnabledChange` only. There is no in-game mute button.
- **Pause/resume:** Phaser's built-in Page Visibility and blur/focus handling is switched off. `onPause`/`onResume` stop and restart the game loop, rendering, input and audio.

The SDK does nothing when served locally. Before submitting, validate with YouTube's Playables test suite.


Controls: touch, mouse, and keyboard.

## Assets
All game assets live in `public/assets/` (about 1 MB in total).

| Folder | Contents | Source / license |
|---|---|---|
| `img/` | Backgrounds (sunset, night, space; portrait and `_wide` landscape), logo, button, panel, foundation, icons, sparkle, block textures | Generated with OpenAI image generation via Codex CLI, then keyed, trimmed and resized |
| `audio/` | place, slice, perfect, fall, click, gameover, newbest (`.ogg` + `.mp3`) | [Kenney](https://kenney.nl) Impact Sounds, Interface Sounds, Music Jingles. CC0 |
| `fonts/` | Lilita One | [Google Fonts](https://fonts.google.com/specimen/Lilita+One). SIL Open Font License (`fonts/OFL.txt`) |

`block.png` is a greyscale 3-slice texture at 3× resolution (84px tall, 42px caps) that is tinted per colour in code. `block_shine.png` is an untinted gloss overlay drawn on top of it.
The sky cross-fades from sunset to night to space as the score passes the thresholds in `SKY_STAGES` (`src/config/gameConfig.ts`).
