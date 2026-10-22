import type { Provider } from '@angular/core';
import { provideEchartsCore } from 'ngx-echarts';

/** Registers ECharts for `ui-chart`; the library itself loads with the first chart. */
export function provideCharts(): Provider {
  return provideEchartsCore({ echarts: () => import('./echarts.setup') });
}
