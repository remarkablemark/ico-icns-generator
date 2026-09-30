import { fakePng } from './fixtures';

/**
 * Stand-in for the browser `Image` element that tests resolve manually.
 */
export class ControlledImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  src = '';

  /**
   * Completes the image load with the given intrinsic dimensions.
   *
   * @param width - Intrinsic width in pixels.
   * @param height - Intrinsic height in pixels.
   */
  succeed(width: number, height: number): void {
    this.naturalWidth = width;
    this.naturalHeight = height;
    this.onload?.();
  }

  /** Fails the image load, triggering the error handler. */
  fail(): void {
    this.onerror?.();
  }
}

/**
 * Replaces the global `Image` constructor with a controllable queue.
 *
 * @returns Images in the order they were constructed.
 */
export function installImageMock(): ControlledImage[] {
  const queue: ControlledImage[] = [];

  class QueuedImage extends ControlledImage {
    constructor() {
      super();
      queue.push(this);
    }
  }

  vi.stubGlobal('Image', QueuedImage);
  return queue;
}

/** A recording `CanvasRenderingContext2D` used by the canvas mock. */
export interface FakeContext {
  /** Recorded `drawImage` calls. */
  drawImage: ReturnType<typeof vi.fn>;
  /** Whether smoothing was requested. */
  imageSmoothingEnabled: boolean;
  /** Smoothing quality requested by the code under test. */
  imageSmoothingQuality: ImageSmoothingQuality;
}

/** Handle on the installed canvas mock. */
export interface CanvasMock {
  /** One fake context per `getContext('2d')` call, in order. */
  contexts: FakeContext[];
  /** Canvas elements in creation order. */
  canvases: HTMLCanvasElement[];
  /** Queued `toBlob` results; `null` entries simulate encoding failure. */
  blobs: (Blob | null)[];
  /** MIME types passed to `toBlob`, in call order. */
  toBlobTypes: (string | undefined)[];
}

/**
 * Replaces `getContext` and `toBlob` with recording implementations.
 *
 * By default `toBlob` yields valid PNG bytes. Push `null` onto
 * {@link CanvasMock.blobs} to simulate an encoding failure.
 *
 * @returns A handle for asserting on canvas interactions.
 */
export function installCanvasMock(): CanvasMock {
  const contexts: FakeContext[] = [];
  const canvases: HTMLCanvasElement[] = [];
  const blobs: (Blob | null)[] = [];
  const toBlobTypes: (string | undefined)[] = [];

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement) {
      canvases.push(this);

      const context: FakeContext = {
        drawImage: vi.fn(),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
      };
      contexts.push(context);
      return context as unknown as CanvasRenderingContext2D;
    },
  );

  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
    function (callback, type) {
      const blob: Blob | null =
        blobs.length > 0
          ? (blobs.shift() ?? null)
          : new Blob([fakePng()], { type: 'image/png' });

      toBlobTypes.push(type);
      callback(blob);
    },
  );

  return { contexts, canvases, blobs, toBlobTypes };
}

/** Handle on the installed object URL mock. */
export interface ObjectUrlMock {
  /** URLs handed out by `createObjectURL`. */
  created: string[];
  /** URLs passed to `revokeObjectURL`. */
  revoked: string[];
}

/**
 * Replaces the object URL functions with recording implementations.
 *
 * @returns A handle for asserting on object URL usage.
 */
export function installObjectUrlMock(): ObjectUrlMock {
  const created: string[] = [];
  const revoked: string[] = [];
  let counter = 0;

  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
    const url = `blob:mock-${String(counter)}`;
    counter += 1;
    created.push(url);
    return url;
  });

  vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url: string) => {
    revoked.push(url);
  });

  return { created, revoked };
}
