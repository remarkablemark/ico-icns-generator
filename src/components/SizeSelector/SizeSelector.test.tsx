import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SizeSelector } from './SizeSelector';

function renderSelector(
  overrides: Partial<Parameters<typeof SizeSelector>[0]> = {},
) {
  return render(
    <SizeSelector
      disabled={false}
      hint="hint"
      onToggle={vi.fn()}
      options={[16, 32]}
      selected={[16]}
      title="Windows · ICO"
      {...overrides}
    />,
  );
}

describe('SizeSelector', () => {
  it('renders a labelled group with one checkbox per size', () => {
    renderSelector();

    const group = screen.getByRole('group', { name: 'Windows · ICO' });
    expect(within(group).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(group).getByText('hint')).toBeInTheDocument();
  });

  it('marks selected sizes as checked', () => {
    renderSelector();

    expect(screen.getByRole('checkbox', { name: '16px' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: '32px' })).not.toBeChecked();
  });

  it('toggles a size on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderSelector({ onToggle });

    await user.click(screen.getByRole('checkbox', { name: '32px' }));

    expect(onToggle).toHaveBeenCalledWith(32);
  });

  it('disables checkboxes while loading', () => {
    renderSelector({ disabled: true });

    expect(screen.getByRole('checkbox', { name: '16px' })).toBeDisabled();
  });
});
