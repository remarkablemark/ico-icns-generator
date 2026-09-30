import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DownloadBar } from './DownloadBar';

function renderBar(overrides: Partial<Parameters<typeof DownloadBar>[0]> = {}) {
  return render(
    <DownloadBar
      disabled={false}
      icnsCount={7}
      icoCount={7}
      onDownload={vi.fn()}
      {...overrides}
    />,
  );
}

describe('DownloadBar', () => {
  it('renders a button for each format with its size count', () => {
    renderBar();

    expect(
      screen.getByRole('button', { name: /download \.ico \(7 sizes\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download \.icns \(7 sizes\)/i }),
    ).toBeInTheDocument();
  });

  it('starts a download for the clicked format', async () => {
    const user = userEvent.setup();
    const onDownload = vi.fn();
    renderBar({ onDownload });

    await user.click(screen.getByRole('button', { name: /download \.ico/i }));
    expect(onDownload).toHaveBeenCalledWith('ico');

    await user.click(screen.getByRole('button', { name: /download \.icns/i }));
    expect(onDownload).toHaveBeenCalledWith('icns');
  });

  it('is disabled while loading', () => {
    renderBar({ disabled: true });

    expect(
      screen.getByRole('button', { name: /download \.ico/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /download \.icns/i }),
    ).toBeDisabled();
  });

  it('disables a format when no sizes are selected', () => {
    renderBar({ icoCount: 0, icnsCount: 7 });

    expect(
      screen.getByRole('button', { name: /download \.ico/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /download \.icns/i }),
    ).toBeEnabled();
  });
});
