import { type EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { MessageService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { AppPreset } from './theme/app-preset';
import { DARK_MODE_CLASS } from './theme/dark-mode';

/** Everything the UI wrappers need at app level. The only place PrimeNG is configured. */
export function provideUi(): EnvironmentProviders {
  return makeEnvironmentProviders([
    providePrimeNG({
      theme: {
        preset: AppPreset,
        // PrimeNG styles go in a CSS layer, so app styles win without !important.
        options: { darkModeSelector: `.${DARK_MODE_CLASS}`, cssLayer: true },
      },
    }),
    MessageService,
  ]);
}
