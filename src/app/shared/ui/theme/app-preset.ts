import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const PALETTE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Aura with a blue primary colour, matching the design's brand blue. */
export const AppPreset = definePreset(Aura, {
  semantic: {
    primary: Object.fromEntries(PALETTE_SHADES.map((shade) => [shade, `{blue.${shade}}`])),
  },
});
