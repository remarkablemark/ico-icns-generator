import { render, screen } from '@testing-library/react';
import { fakePng } from 'src/testUtils/fixtures';
import { installObjectUrlMock } from 'src/testUtils/mocks';

import { PreviewGrid } from './PreviewGrid';

function framesFor(...sizes: number[]): Map<number, Uint8Array<ArrayBuffer>> {
  return new Map(sizes.map((size) => [size, fakePng()]));
}

describe('PreviewGrid', () => {
  it('asks for an upload before an image is loaded', () => {
    render(<PreviewGrid frames={null} sizes={[16]} />);

    expect(screen.getByText(/upload an image to preview/i)).toBeInTheDocument();
  });

  it('asks for a selection when no visible size remains', () => {
    render(<PreviewGrid frames={framesFor(16)} sizes={[]} />);

    expect(
      screen.getByText(/select at least one size to preview/i),
    ).toBeInTheDocument();
  });

  it('renders a thumbnail for each available size', () => {
    installObjectUrlMock();
    render(<PreviewGrid frames={framesFor(16, 32)} sizes={[16, 32, 64]} />);

    expect(screen.getAllByRole('img')).toHaveLength(2);
    expect(screen.getByAltText('Icon at 16 pixels')).toBeInTheDocument();
    expect(screen.getByAltText('Icon at 32 pixels')).toBeInTheDocument();
    expect(screen.getByText('16px')).toBeInTheDocument();
  });

  it('reuses a single object URL for identical frame bytes', () => {
    const urls = installObjectUrlMock();
    const shared = fakePng();

    render(
      <PreviewGrid
        frames={
          new Map([
            [16, shared],
            [32, shared],
          ])
        }
        sizes={[16, 32]}
      />,
    );

    expect(urls.created).toHaveLength(1);
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('revokes preview object URLs on unmount', () => {
    const urls = installObjectUrlMock();
    const { unmount } = render(
      <PreviewGrid frames={framesFor(16)} sizes={[16]} />,
    );

    expect(urls.created).toHaveLength(1);

    unmount();
    expect(urls.revoked).toEqual(urls.created);
  });
});
