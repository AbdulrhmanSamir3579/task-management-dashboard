import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** Blue scale built around the design's primary colour, #1976D2 ("Denim"), at 500. */
export const BRAND_BLUE = {
  50: '#e3f2fd',
  100: '#bbdefb',
  200: '#90caf9',
  300: '#64b5f6',
  400: '#42a5f5',
  500: '#1976d2',
  600: '#1565c0',
  700: '#0d47a1',
  800: '#0b3c8a',
  900: '#093170',
  950: '#062148',
} as const;

/** Aura with the design's primary colour. */
export const AppPreset = definePreset(Aura, {
  semantic: {
    primary: BRAND_BLUE,
  },
  components: {
    avatar: {
      root: {
        background: '{primary.color}',
        color: '{primary.contrast.color}',
      },
    },
  },
});
