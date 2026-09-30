/**
 * Loads images and renders them to PNG frames using the browser canvas.
 */

/** A decoded source image with its pre-rendered icon frames. */
export interface LoadedImage {
  /** Native width of the source image in pixels. */
  width: number;
  /** Native height of the source image in pixels. */
  height: number;
  /** PNG frames keyed by square edge length in pixels. */
  frames: ReadonlyMap<number, Uint8Array<ArrayBuffer>>;
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve(image);
    };

    image.onerror = () => {
      reject(new Error('The image could not be decoded.'));
    };

    image.src = url;
  });
}

function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext('2d');

  if (context === null) {
    throw new Error('Canvas 2D is not supported by this browser.');
  }

  return context;
}

function encodePng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        reject(new Error('Failed to encode the image as PNG.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

function prepare(context: CanvasRenderingContext2D): void {
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
}

async function renderFrame(
  source: CanvasImageSource,
  size: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = getContext(canvas);
  prepare(context);
  context.drawImage(source, 0, 0, size, size);

  const blob = await encodePng(canvas);
  return new Uint8Array(await blob.arrayBuffer());
}

function createMaster(
  image: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const edge = Math.max(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = edge;
  canvas.height = edge;

  const context = getContext(canvas);
  prepare(context);
  context.drawImage(image, (edge - width) / 2, (edge - height) / 2);

  return canvas;
}

/**
 * Loads an image file and renders it to PNG frames at the requested sizes.
 *
 * Non-square images are padded onto a transparent square, centered, before
 * scaling so aspect ratio is preserved.
 *
 * @param file - Source image in any browser-decodable format.
 * @param sizes - Square edge lengths in pixels to render.
 * @returns The decoded image dimensions and its PNG frames.
 * @throws If the file cannot be decoded, has no intrinsic size, or rendering
 * fails.
 */
export async function loadImage(
  file: File,
  sizes: readonly number[],
): Promise<LoadedImage> {
  const url = URL.createObjectURL(file);
  let image: HTMLImageElement;

  try {
    image = await decodeImage(url);
  } finally {
    URL.revokeObjectURL(url);
  }

  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width === 0) {
    throw new Error('The image has no intrinsic width.');
  }

  if (height === 0) {
    throw new Error('The image has no intrinsic height.');
  }

  const master = createMaster(image, width, height);
  const frames = new Map<number, Uint8Array<ArrayBuffer>>();

  await Promise.all(
    [...new Set(sizes)].map(async (size) => {
      frames.set(size, await renderFrame(master, size));
    }),
  );

  return { width, height, frames };
}
