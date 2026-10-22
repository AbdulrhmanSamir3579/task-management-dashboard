import type { Provider } from '@angular/core';
import { provideEchartsCore } from 'ngx-echarts';

/** A stand-in for ECharts in unit tests (jsdom cannot draw), with the chart it creates. */
export function provideChartsForTesting() {
  const chart = {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    isDisposed: () => false,
  };
  const init = vi.fn(() => chart);
  const provider: Provider = provideEchartsCore({ echarts: { init } });
  return { provider, init, chart };
}
