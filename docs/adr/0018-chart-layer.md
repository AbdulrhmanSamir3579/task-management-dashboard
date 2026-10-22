# 0018. Chart layer

- Status: Accepted
- Date: 2026-10-22
- Amends: [0011](0011-lazy-loading-and-bundle-budget.md)

## Context

The assignment asks for charts of task distribution by priority and status ("Chart.js or similar"). Charts need a library, which is large, and the same rules as the UI kit apply: features should not depend on the library's API directly ([0006](0006-ui-library-behind-wrapper-components.md)). The design has no charts on the Dashboard (stat cards over the board) and an Analytics item in the sidebar.

## Decision

- **ECharts 6 with `ngx-echarts`**, used only inside `src/app/shared/charts`. ESLint blocks `echarts` and `ngx-echarts` imports everywhere else (shared test helpers in `src/testing` excepted).
- **Three layers**:
  - `EchartsService`, the package service: the one place that knows how our charts look in ECharts. It reads colours and font from the design tokens when a chart is built, turns animation off for `prefers-reduced-motion`, and provides the shared tooltip, legend, grid and axes.
  - One service per chart kind (`DonutChartService`, `BarChartService` with a stacked variant, `LineChartService`). Each takes plain data (`ChartDatum`, `ChartSeries`) and returns a `ChartConfig`: the ECharts options, the same numbers as a table, and whether there is anything to draw.
  - `ui-chart`, the wrapper around the `ngx-echarts` directive. Features only pass a `ChartConfig` and a label.
- Features describe colour by intent (`tone: 'danger'`), never by hex value; the package service maps tones to tokens, so charts match the board (blue to do, orange in progress, green done; red, orange and green for priority).
- `ChartOptions` is a typed `ComposeOption` of the series and components we register, so a kind service cannot use a part that is not loaded.
- **Lazy loading**: `provideCharts()` gives `ngx-echarts` a function that imports `echarts.setup.ts`, which registers only the bar, line and pie charts, the components we use and the SVG renderer. It is provided by the Analytics page, so ECharts (about 165 kB transferred) is a separate chunk fetched with the first chart, and the initial bundle does not grow. This replaces the `@defer` blocks expected in [0011](0011-lazy-loading-and-bundle-budget.md); the page itself is already lazy.
- **SVG renderer**: text stays sharp at any zoom, and a handful of small charts does not need canvas performance.
- **Accessibility**: the drawing is `aria-hidden`; each chart is a `figure` named by its label, with the same numbers in a visually hidden table (caption, column and row headers). Empty data shows a message instead of an empty chart.
- **Charts live on the Analytics page**: tasks by status (donut), by priority (bar), workload by assignee (stacked bars, busiest first) and tasks created vs completed over the last 14 days (lines). The Dashboard keeps the design's stat cards and board.
- Chart data is computed from `TasksStore` in `computed()`, so the charts follow every change made on the board without another request.

## Consequences

- Swapping ECharts for another library means rewriting the package service, the kind services and the wrapper. Features and their data functions stay the same.
- Colours are read when a chart is built. When dark mode is added, the charts must be rebuilt on a theme change (for example by making the theme a signal the kind services read).
- Unit tests cannot draw in jsdom: `provideChartsForTesting()` in `src/testing/charts.ts` provides a stand-in for ECharts, and tests check the options and the accessible tables instead.
