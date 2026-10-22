import { render, screen, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { buildUser } from '../../../../../testing/builders';
import type { TeamMember } from '../../data-access/team-summary';
import { MemberCard } from './member-card';

const member: TeamMember = {
  user: buildUser({
    id: 'user-002',
    name: 'Sarah Smith',
    avatar: 'SS',
    email: 'sarah@company.com',
  }),
  open: 3,
  inProgress: 1,
  done: 1,
  overdue: 2,
  total: 4,
  completion: 25,
};

describe('MemberCard', () => {
  async function setup() {
    const assign = vi.fn();
    const { navigate } = await render(MemberCard, {
      inputs: { member },
      on: { assign },
      routes: [{ path: '**', children: [] }],
    });
    // Router links get their href once the router has navigated.
    await navigate('/team');
    return { assign, card: screen.getByRole('article', { name: 'Sarah Smith' }) };
  }

  it('shows who the member is and how to reach them', async () => {
    const { card } = await setup();

    expect(within(card).getByRole('heading', { name: 'Sarah Smith' })).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'sarah@company.com' })).toHaveAttribute(
      'href',
      'mailto:sarah@company.com',
    );
  });

  it('shows their task counts and progress', async () => {
    const { card } = await setup();

    const value = (term: string) => within(card).getByText(term).nextElementSibling;
    expect(value('Open')).toHaveTextContent('3');
    expect(value('In progress')).toHaveTextContent('1');
    expect(value('Done')).toHaveTextContent('1');
    expect(value('Overdue')).toHaveTextContent('2');
    expect(
      within(card).getByRole('progressbar', { name: 'Tasks completed by Sarah Smith' }),
    ).toHaveAttribute('aria-valuenow', '25');
  });

  it('links to their tasks on the board', async () => {
    const { card } = await setup();

    expect(within(card).getByRole('link', { name: 'View tasks of Sarah Smith' })).toHaveAttribute(
      'href',
      '/tasks?assignee=user-002',
    );
  });

  it('asks for a new task assigned to them', async () => {
    const { assign } = await setup();

    await userEvent.click(screen.getByRole('button', { name: 'Assign task to Sarah Smith' }));

    expect(assign).toHaveBeenCalledWith('user-002');
  });
});
