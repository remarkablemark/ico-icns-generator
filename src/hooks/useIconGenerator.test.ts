import { act, renderHook, waitFor } from '@testing-library/react';
import type { LoadedImage } from 'src/services/imageService';
import { loadImage } from 'src/services/imageService';
import { fakePng } from 'src/testUtils/fixtures';
import { downloadBlob } from 'src/utils/download';
import { ICNS_SIZES } from 'src/utils/icns';
import { ICO_SIZES } from 'src/utils/ico';

import { useIconGenerator } from './useIconGenerator';

vi.mock('src/services/imageService', () => ({ loadImage: vi.fn() }));
vi.mock('src/utils/download', () => ({ downloadBlob: vi.fn() }));

const ALL_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

const mockLoadImage = vi.mocked(loadImage);
const mockDownloadBlob = vi.mocked(downloadBlob);

interface DeferredImage {
  resolve: (value: LoadedImage) => void;
  reject: (reason?: unknown) => void;
}

function imageFile(name = 'logo.png', type = 'image/png'): File {
  return new File([new Uint8Array([1])], name, { type });
}

function loadedImage(): LoadedImage {
  return {
    width: 1024,
    height: 768,
    frames: new Map(ALL_SIZES.map((size) => [size, fakePng()])),
  };
}

function mockPending(): DeferredImage[] {
  const pending: DeferredImage[] = [];

  mockLoadImage.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        pending.push({ resolve, reject });
      }),
  );

  return pending;
}

describe('useIconGenerator', () => {
  beforeEach(() => {
    mockLoadImage.mockReset();
    mockDownloadBlob.mockReset();
  });

  async function renderLoaded() {
    mockLoadImage.mockResolvedValue(loadedImage());
    const rendered = renderHook(() => useIconGenerator());

    act(() => {
      rendered.result.current.loadFile(imageFile());
    });

    await waitFor(() => {
      expect(rendered.result.current.source).not.toBeNull();
    });

    return rendered;
  }

  it('starts with default selections and no image', () => {
    const { result } = renderHook(() => useIconGenerator());

    expect(result.current.source).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.icoSizes).toEqual([...ICO_SIZES]);
    expect(result.current.icnsSizes).toEqual([...ICNS_SIZES]);
  });

  it('rejects files that are not images', () => {
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile('notes.txt', 'text/plain'));
    });

    expect(result.current.error).toBe(
      '"notes.txt" is not a supported image file.',
    );
    expect(result.current.loading).toBe(false);
    expect(mockLoadImage).not.toHaveBeenCalled();
  });

  it('accepts images without a MIME type', async () => {
    mockLoadImage.mockResolvedValue(loadedImage());
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile('logo', ''));
    });

    await waitFor(() => {
      expect(result.current.source).not.toBeNull();
    });
    expect(result.current.fileName).toBe('logo');
  });

  it('loads an image and renders every icon size', async () => {
    const loaded = loadedImage();
    mockLoadImage.mockResolvedValue(loaded);
    const { result } = renderHook(() => useIconGenerator());
    const file = imageFile();

    act(() => {
      result.current.loadFile(file);
    });

    await waitFor(() => {
      expect(result.current.source).not.toBeNull();
    });

    expect(result.current.source).toBe(loaded);
    expect(result.current.fileName).toBe('logo.png');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLoadImage).toHaveBeenCalledWith(file, ALL_SIZES);
  });

  it('shows the error when decoding fails', async () => {
    mockLoadImage.mockImplementation(() =>
      Promise.reject(new Error('The image could not be decoded.')),
    );
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile());
    });

    await waitFor(() => {
      expect(result.current.error).toBe('The image could not be decoded.');
    });
    expect(result.current.source).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('shows a generic message when loading fails without an error', async () => {
    mockLoadImage.mockRejectedValue('boom');
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile());
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load the image.');
    });
    expect(result.current.loading).toBe(false);
  });

  it('ignores a load superseded before it starts', async () => {
    const pending = mockPending();
    const { result } = renderHook(() => useIconGenerator());
    const first = imageFile('first.png');
    const second = imageFile('second.png');

    act(() => {
      result.current.loadFile(first);
      result.current.loadFile(second);
    });

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledTimes(1);
    });
    expect(mockLoadImage).toHaveBeenCalledWith(second, ALL_SIZES);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      pending[0].resolve(loadedImage());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.source).not.toBeNull();
    });
    expect(result.current.fileName).toBe('second.png');
  });

  it('ignores a load that completes after being superseded', async () => {
    const pending = mockPending();
    const { result } = renderHook(() => useIconGenerator());
    const second = imageFile('second.png');

    act(() => {
      result.current.loadFile(imageFile('first.png'));
    });

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.loadFile(second);
    });

    await act(async () => {
      pending[0].resolve(loadedImage());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledTimes(2);
    });
    expect(result.current.source).toBeNull();
    expect(result.current.fileName).toBe('second.png');

    await act(async () => {
      pending[1].resolve(loadedImage());
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.source).not.toBeNull();
    });
    expect(result.current.fileName).toBe('second.png');
  });

  it('ignores a load failure after reset', async () => {
    const pending = mockPending();
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile());
    });

    await waitFor(() => {
      expect(mockLoadImage).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      pending[0].reject(new Error('late failure'));
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.source).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.fileName).toBeNull();
  });

  it('toggles sizes for both formats', () => {
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.toggleSize('ico', 16);
    });
    expect(result.current.icoSizes).not.toContain(16);

    act(() => {
      result.current.toggleSize('ico', 16);
    });
    expect(result.current.icoSizes).toContain(16);

    act(() => {
      result.current.toggleSize('icns', 1024);
    });
    expect(result.current.icnsSizes).not.toContain(1024);

    act(() => {
      result.current.toggleSize('icns', 1024);
    });
    expect(result.current.icnsSizes).toContain(1024);
  });

  it('restores defaults and clears the image on reset', async () => {
    const { result } = await renderLoaded();

    act(() => {
      result.current.toggleSize('ico', 24);
      result.current.reset();
    });

    expect(result.current.source).toBeNull();
    expect(result.current.fileName).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.icoSizes).toEqual([...ICO_SIZES]);
    expect(result.current.icnsSizes).toEqual([...ICNS_SIZES]);
  });

  it('downloads the selected sizes as an ICO file', async () => {
    const { result } = await renderLoaded();

    result.current.download('ico');

    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
    const [bytes, name] = mockDownloadBlob.mock.calls[0];
    expect(name).toBe('logo.ico');
    expect([...bytes.slice(0, 4)]).toEqual([0, 0, 1, 0]);
    expect(new DataView(bytes.buffer).getUint16(4, true)).toBe(
      ICO_SIZES.length,
    );
  });

  it('downloads the selected sizes as an ICNS file', async () => {
    const { result } = await renderLoaded();

    result.current.download('icns');

    expect(mockDownloadBlob).toHaveBeenCalledTimes(1);
    const [bytes, name] = mockDownloadBlob.mock.calls[0];
    expect(name).toBe('logo.icns');
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe('icns');
    expect(new DataView(bytes.buffer).getUint32(4, false)).toBe(bytes.length);
  });

  it('uses a fallback name when the file has no base name', async () => {
    mockLoadImage.mockResolvedValue(loadedImage());
    const { result } = renderHook(() => useIconGenerator());

    act(() => {
      result.current.loadFile(imageFile('.png'));
    });

    await waitFor(() => {
      expect(result.current.source).not.toBeNull();
    });
    result.current.download('ico');

    expect(mockDownloadBlob.mock.calls[0][1]).toBe('icon.ico');
  });

  it('does nothing when downloading without an image', () => {
    const { result } = renderHook(() => useIconGenerator());

    result.current.download('ico');

    expect(mockDownloadBlob).not.toHaveBeenCalled();
  });

  it('does nothing when no sizes are selected', async () => {
    const { result } = await renderLoaded();

    for (const size of ICO_SIZES) {
      act(() => {
        result.current.toggleSize('ico', size);
      });
    }

    expect(result.current.icoSizes).toHaveLength(0);
    result.current.download('ico');
    expect(mockDownloadBlob).not.toHaveBeenCalled();
  });

  it('reports a failure while generating the file', async () => {
    const { result } = await renderLoaded();
    mockDownloadBlob.mockImplementation(() => {
      throw new Error('disk full');
    });

    act(() => {
      result.current.download('ico');
    });

    expect(result.current.error).toBe('Failed to generate the file.');
  });
});
