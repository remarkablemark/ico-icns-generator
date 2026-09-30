import { fakePng } from 'src/testUtils/fixtures';
import type {
  CanvasMock,
  ControlledImage,
  ObjectUrlMock,
} from 'src/testUtils/mocks';
import {
  installCanvasMock,
  installImageMock,
  installObjectUrlMock,
} from 'src/testUtils/mocks';

import type { LoadedImage } from './imageService';
import { loadImage } from './imageService';

function sourceFile(): File {
  return new File([new Uint8Array([1, 2, 3])], 'logo.png', {
    type: 'image/png',
  });
}

describe('loadImage', () => {
  let images: ControlledImage[];
  let canvasMock: CanvasMock;
  let urls: ObjectUrlMock;

  beforeEach(() => {
    images = installImageMock();
    canvasMock = installCanvasMock();
    urls = installObjectUrlMock();
  });

  function startLoad(sizes: readonly number[]): Promise<LoadedImage> {
    return loadImage(sourceFile(), sizes);
  }

  async function loadSized(
    sizes: readonly number[],
    width: number,
    height: number,
  ) {
    const promise = startLoad(sizes);
    images[0].succeed(width, height);
    return promise;
  }

  it('decodes the file and reports its dimensions', async () => {
    const source = await loadSized([64], 1024, 768);

    expect(source).toMatchObject({ width: 1024, height: 768 });
    expect(urls.created).toEqual(['blob:mock-0']);
    expect(urls.revoked).toEqual(['blob:mock-0']);
  });

  it('pads a non-square image onto a square canvas, centered', async () => {
    await loadSized([64], 1000, 400);

    const master = canvasMock.canvases[0];
    expect(master.width).toBe(1000);
    expect(master.height).toBe(1000);
    expect(canvasMock.contexts[0].drawImage).toHaveBeenCalledWith(
      images[0],
      0,
      300,
    );
  });

  it('draws a square image without offsetting it', async () => {
    await loadSized([64], 512, 512);

    expect(canvasMock.contexts[0].drawImage).toHaveBeenCalledWith(
      images[0],
      0,
      0,
    );
  });

  it('enables high quality smoothing on the master canvas', async () => {
    await loadSized([64], 64, 64);

    expect(canvasMock.contexts[0].imageSmoothingEnabled).toBe(true);
    expect(canvasMock.contexts[0].imageSmoothingQuality).toBe('high');
  });

  it('renders a PNG frame at the requested size', async () => {
    const source = await loadSized([64], 1000, 400);

    expect(source.frames.size).toBe(1);
    expect(source.frames.get(64)).toEqual(fakePng());

    const frame = canvasMock.canvases[1];
    expect(frame.width).toBe(64);
    expect(frame.height).toBe(64);
    expect(canvasMock.contexts[1].drawImage).toHaveBeenCalledWith(
      canvasMock.canvases[0],
      0,
      0,
      64,
      64,
    );
    expect(canvasMock.toBlobTypes).toEqual(['image/png']);
  });

  it('renders one frame per distinct size', async () => {
    const source = await loadSized([32, 64, 32], 100, 100);

    expect([...source.frames.keys()].sort((a, b) => a - b)).toEqual([32, 64]);
    expect(canvasMock.canvases).toHaveLength(3);
  });

  it('revokes the object URL when decoding fails', async () => {
    const promise = startLoad([64]);
    images[0].fail();

    await expect(promise).rejects.toThrow('The image could not be decoded.');
    expect(urls.revoked).toEqual(['blob:mock-0']);
  });

  it('rejects an image with no intrinsic width', async () => {
    const promise = startLoad([64]);
    images[0].succeed(0, 100);

    await expect(promise).rejects.toThrow('The image has no intrinsic width.');
  });

  it('rejects an image with no intrinsic height', async () => {
    const promise = startLoad([64]);
    images[0].succeed(100, 0);

    await expect(promise).rejects.toThrow('The image has no intrinsic height.');
  });

  it('rejects when the canvas has no 2D context', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValueOnce(
      null,
    );

    const promise = startLoad([64]);
    images[0].succeed(64, 64);

    await expect(promise).rejects.toThrow(
      'Canvas 2D is not supported by this browser.',
    );
  });

  it('rejects when PNG encoding fails', async () => {
    canvasMock.blobs.push(null);

    const promise = startLoad([32]);
    images[0].succeed(64, 64);

    await expect(promise).rejects.toThrow('Failed to encode the image as PNG.');
  });
});
