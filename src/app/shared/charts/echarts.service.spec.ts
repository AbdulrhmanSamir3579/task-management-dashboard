import { TestBed } from '@angular/core/testing';
import { EchartsService } from './echarts.service';

describe('EchartsService', () => {
  const service = () => TestBed.inject(EchartsService);

  afterEach(() => {
    document.documentElement.style.removeProperty('--app-primary');
    vi.restoreAllMocks();
  });

  it('takes colours from the design tokens, with defaults when a token is missing', () => {
    document.documentElement.style.setProperty('--app-primary', '#123456');

    const theme = service().theme();

    expect(theme.tones.primary).toBe('#123456');
    expect(theme.tones.danger).toBe('#d32f2f');
    expect(theme.palette[0]).toBe('#123456');
  });

  it('uses the tone colour, or the palette in order when there is none', () => {
    const theme = service().theme();

    expect(service().color(theme, 'success', 0)).toBe(theme.tones.success);
    expect(service().color(theme, undefined, 1)).toBe(theme.palette[1]);
    expect(service().color(theme, undefined, theme.palette.length)).toBe(theme.palette[0]);
  });

  it('turns animation off for users who prefer reduced motion', () => {
    const theme = service().theme();
    expect(service().base(theme)).toMatchObject({ animation: true });

    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

    expect(service().base(theme)).toMatchObject({ animation: false });
  });

  it('points at the whole category in axis tooltips only', () => {
    const theme = service().theme();

    expect(service().tooltip(theme, 'axis').axisPointer).toEqual({ type: 'shadow' });
    expect(service().tooltip(theme, 'item').axisPointer).toBeUndefined();
  });

  it('builds category and value axes', () => {
    const theme = service().theme();

    expect(service().categoryAxis(theme, ['High', 'Low'])).toMatchObject({
      type: 'category',
      data: ['High', 'Low'],
    });
    expect(service().valueAxis(theme)).toMatchObject({ type: 'value', minInterval: 1 });
  });
});
