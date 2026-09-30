import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  installCanvasMock,
  installImageMock,
  installObjectUrlMock,
} from 'src/testUtils/mocks';
import { downloadBlob } from 'src/utils/download';

import { App } from '.';

vi.mock('src/utils/download', () => ({ downloadBlob: vi.fn() }));

const mockDownloadBlob = vi.mocked(downloadBlob);

function testImage(name = 'logo.png', type = 'image/png'): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('App', () => {
  beforeEach(() => {
    mockDownloadBlob.mockReset();
    installCanvasMock();
    installImageMock();
    installObjectUrlMock();
  });

  it('renders the generator with disabled downloads', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: /image to ico/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'ICO' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'ICNS' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download \.ico/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /download \.icns/i }),
    ).toBeDisabled();
    expect(screen.getByText(/upload an image to preview/i)).toBeInTheDocument();
  });

  it('shows an error when a non-image is dropped', () => {
    render(<App />);

    fireEvent.drop(screen.getByTestId('dropzone'), {
      dataTransfer: { files: [testImage('notes.txt', 'text/plain')] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      '"notes.txt" is not a supported image file.',
    );
  });

  it('disables controls while the image is processing', async () => {
    const user = userEvent.setup();
    const images = installImageMock();
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image file'),
      testImage(),
    );

    await waitFor(() => {
      expect(images).toHaveLength(1);
    });
    expect(screen.getByText('Processing…')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download \.ico/i }),
    ).toBeDisabled();

    await act(async () => {
      images[0].succeed(512, 512);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(9);
    });
  });

  it('uploads an image, previews sizes, and downloads an ICO', async () => {
    const user = userEvent.setup();
    const images = installImageMock();
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image file'),
      testImage(),
    );

    await waitFor(() => {
      expect(images).toHaveLength(1);
    });
    await act(async () => {
      images[0].succeed(512, 512);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(9);
    });
    expect(screen.getByText('logo.png')).toBeInTheDocument();
    expect(screen.getByText('512 × 512 px')).toBeInTheDocument();

    const download = screen.getByRole('button', { name: /download \.ico/i });
    expect(download).toBeEnabled();

    await user.click(download);

    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
    expect(mockDownloadBlob).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'logo.ico',
    );
  });

  it('downloads an ICNS file with the source file name', async () => {
    const user = userEvent.setup();
    const images = installImageMock();
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image file'),
      testImage('app-icon.png'),
    );

    await waitFor(() => {
      expect(images).toHaveLength(1);
    });
    await act(async () => {
      images[0].succeed(256, 256);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(9);
    });
    await user.click(screen.getByRole('button', { name: /download \.icns/i }));

    expect(mockDownloadBlob).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      'app-icon.icns',
    );
  });

  it('updates previews when sizes are deselected', async () => {
    const user = userEvent.setup();
    const images = installImageMock();
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image file'),
      testImage(),
    );

    await waitFor(() => {
      expect(images).toHaveLength(1);
    });
    await act(async () => {
      images[0].succeed(512, 512);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(9);
    });

    const icoGroup = screen.getByRole('group', { name: 'ICO' });
    const checkbox = within(icoGroup).getByRole('checkbox', {
      name: '24px',
    });
    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(8);
    });

    const icnsGroup = screen.getByRole('group', { name: 'ICNS' });
    await user.click(
      within(icnsGroup).getByRole('checkbox', { name: '1024px' }),
    );

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(7);
    });
  });

  it('clears the image back to the empty state', async () => {
    const user = userEvent.setup();
    const images = installImageMock();
    render(<App />);

    await user.upload(
      screen.getByLabelText('Choose an image file'),
      testImage(),
    );

    await waitFor(() => {
      expect(images).toHaveLength(1);
    });
    await act(async () => {
      images[0].succeed(512, 512);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByRole('img')).toHaveLength(9);
    });

    await user.click(screen.getByRole('button', { name: 'Clear image' }));

    expect(screen.queryByText('logo.png')).not.toBeInTheDocument();
    expect(screen.getByText(/upload an image to preview/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /download \.ico/i }),
    ).toBeDisabled();
    expect(mockDownloadBlob).not.toHaveBeenCalled();
  });
});
