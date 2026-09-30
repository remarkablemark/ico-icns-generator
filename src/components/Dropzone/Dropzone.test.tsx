import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Dropzone } from './Dropzone';

function renderDropzone(
  overrides: Partial<Parameters<typeof Dropzone>[0]> = {},
) {
  return render(
    <Dropzone
      dimensions={null}
      fileName={null}
      loading={false}
      onFile={vi.fn()}
      onReset={vi.fn()}
      {...overrides}
    />,
  );
}

describe('Dropzone', () => {
  it('shows the empty state prompt', () => {
    renderDropzone();

    expect(
      screen.getByText(/drag & drop your image here/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/png, jpeg, webp/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /clear image/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onFile when a file is picked', async () => {
    const user = userEvent.setup();
    const onFile = vi.fn();
    renderDropzone({ onFile });

    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Choose an image file'), file);

    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'logo.png' }),
    );
  });

  it('ignores change events without files', () => {
    const onFile = vi.fn();
    renderDropzone({ onFile });

    fireEvent.change(screen.getByLabelText('Choose an image file'), {
      target: { files: null },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('calls onFile when a file is dropped', () => {
    const onFile = vi.fn();
    renderDropzone({ onFile });

    const file = new File(['x'], 'dropped.png', { type: 'image/png' });
    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [file] },
    });

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('ignores drops without files', () => {
    const onFile = vi.fn();
    renderDropzone({ onFile });

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [] },
    });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('highlights the area while dragging', () => {
    renderDropzone();

    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone.className).toContain('border-slate-300');

    fireEvent.dragOver(dropzone);
    expect(dropzone.className).toContain('border-indigo-500');

    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).toContain('border-slate-300');
    expect(dropzone.className).not.toContain('border-indigo-500');
  });

  it('shows file details once loaded', () => {
    renderDropzone({
      fileName: 'logo.png',
      dimensions: { width: 1024, height: 768 },
    });

    expect(screen.getByText('logo.png')).toBeInTheDocument();
    expect(screen.getByText('1024 × 768 px')).toBeInTheDocument();
    expect(screen.getByText(/click to replace/i)).toBeInTheDocument();
  });

  it('shows a processing message while loading', () => {
    renderDropzone({ loading: true, fileName: 'logo.png' });

    expect(screen.getByText('Processing…')).toBeInTheDocument();
  });

  it('shows no dimensions when they are unknown', () => {
    renderDropzone({ fileName: 'logo.png', dimensions: null });

    expect(screen.queryByText(/px/)).not.toBeInTheDocument();
  });

  it('calls onReset when cleared', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    renderDropzone({ fileName: 'logo.png', onReset });

    await user.click(screen.getByRole('button', { name: 'Clear image' }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
