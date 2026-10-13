import { defineConfig, type Plugin } from 'vite';
// Phaser's bundled webpack runtime finds the global object with `new Function("return this")()` as a
// fallback for very old browsers. It never runs where globalThis exists, but Playables review flags
// dynamic code evaluation, so swap it for globalThis in the final output.
const stripNewFunction = (): Plugin => ({
  name: 'strip-new-function',
  apply: 'build',
  generateBundle(_options, bundle) {
    for (const file of Object.values(bundle))
      if (file.type === 'chunk') file.code = file.code.replace(/new Function\(\s*(["'])return this\1\s*\)\(\)/g, 'globalThis');
  },
});
export default defineConfig({base:'./',build:{target:'es2020'},plugins:[stripNewFunction()]});
