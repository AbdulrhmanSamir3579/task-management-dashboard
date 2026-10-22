import { TestBed } from '@angular/core/testing';
import { NGX_ECHARTS_CONFIG } from 'ngx-echarts';
import { provideCharts } from './provide-charts';

describe('provideCharts', () => {
  it('loads ECharts only when a chart asks for it', async () => {
    TestBed.configureTestingModule({ providers: [provideCharts()] });
    const { echarts } = TestBed.inject(NGX_ECHARTS_CONFIG);

    expect(echarts).toBeTypeOf('function');
    const module = await (echarts as () => Promise<{ init: unknown }>)();
    expect(module.init).toBeTypeOf('function');
  });
});
