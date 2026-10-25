import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildTask } from '../../../../../testing/builders';
import { provideArabicForTesting } from '../../../../../testing/i18n';
import { monthGrid, weekdayLabels } from '../../data-access/calendar-grid';
import { MonthView } from './month-view';
import { DESKTOP_WIDTH, applyScreenWidth } from '../../../../../testing/viewport';

const today = '2026-10-22';

describe('MonthView', () => {
  async function setup() {
    const handlers = { taskOpen: vi.fn(), dayAdd: vi.fn(), dayShow: vi.fn() };
    const weeks = monthGrid(
      today,
      [
        buildTask({ id: 'a', title: 'Prepare budget', dueDate: today, priority: 'high' }),
        buildTask({ id: 'b', title: 'Write docs', dueDate: today }),
        buildTask({ id: 'c', title: 'Plan sprint', dueDate: today }),
        buildTask({ id: 'd', title: 'Fix login', dueDate: today, priority: 'low' }),
        buildTask({ id: 'f', title: 'Release notes', dueDate: '2026-10-23', status: 'done' }),
        buildTask({ id: 'e', title: 'Security audit', dueDate: '2026-10-20' }),
      ],
      today,
    );
    await render(MonthView, { inputs: { weeks, weekdays: weekdayLabels('en') }, on: handlers });
    return handlers;
  }

  const cell = (name: string) =>
    screen.getAllByRole('cell').find((td) => td.textContent?.includes(name))!;

  it('lays out the month as a table of weeks under weekday headings', async () => {
    await setup();

    const table = screen.getByRole('table', { name: 'Tasks due each day' });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(within(table).getAllByRole('row')).toHaveLength(6);
  });

  it('marks today and shows its first tasks with the rest behind "+N more"', async () => {
    const { dayShow, taskOpen } = await setup();
    applyScreenWidth(DESKTOP_WIDTH);

    const todayCell = cell('Thursday, October 22');
    expect(todayCell).toHaveAttribute('aria-current', 'date');
    expect(within(todayCell).getAllByRole('listitem')).toHaveLength(3);

    await userEvent.click(within(todayCell).getByRole('button', { name: 'Prepare budget' }));
    expect(taskOpen).toHaveBeenCalledWith('a');

    await userEvent.click(
      within(todayCell).getByRole('button', { name: '+1 more on Thursday, October 22' }),
    );
    expect(dayShow).toHaveBeenCalledWith(today);
  });

  it('offers to add a task from today on, not on past days', async () => {
    const { dayAdd } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add task on Friday, October 23' }));
    expect(dayAdd).toHaveBeenCalledWith('2026-10-23');
    expect(
      screen.queryByRole('button', { name: 'Add task on Tuesday, October 20' }),
    ).not.toBeInTheDocument();
  });

  it('names done tasks as done', async () => {
    await setup();
    applyScreenWidth(DESKTOP_WIDTH);

    expect(
      within(cell('Friday, October 23')).getByRole('button', { name: 'Release notes, done' }),
    ).toBeInTheDocument();
    expect(cell('Tuesday, October 20')).toHaveTextContent('Security audit');
  });

  it('offers a count that opens the day where chips do not fit', async () => {
    const { dayShow } = await setup();

    // Hidden on wide screens, where the chips are shown instead; hidden elements have no
    // computed name, so it is found by its label.
    const count = screen
      .getAllByRole('button', { hidden: true })
      .find((button) => button.getAttribute('aria-label') === '4 tasks on Thursday, October 22');
    await userEvent.click(count!);

    expect(dayShow).toHaveBeenCalledWith(today);
  });

  it('shows Arabic weekday names, dates and labels', async () => {
    const locale = 'ar-u-nu-latn';
    await render(MonthView, {
      inputs: { weeks: monthGrid(today, [], today), weekdays: weekdayLabels(locale), locale },
      providers: [provideArabicForTesting()],
    });
    const friday = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(new Date(2026, 9, 23));

    expect(screen.getByRole('table', { name: 'المهام المستحقة في كل يوم' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent(weekdayLabels(locale)[0]!);
    expect(screen.getByRole('button', { name: `إضافة مهمة في ${friday}` })).toBeInTheDocument();
  });
});
