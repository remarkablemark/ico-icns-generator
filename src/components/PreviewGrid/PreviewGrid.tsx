import { useEffect } from 'react';

/** Properties for the {@link PreviewGrid} component. */
export interface PreviewGridProps {
  /** Generated PNG frames by size, or null before an image is loaded. */
  frames: ReadonlyMap<number, Uint8Array<ArrayBuffer>> | null;
  /** Sizes to display, in display order. */
  sizes: readonly number[];
}

interface SizeThumbProps {
  /** Square edge length of the frame in pixels. */
  size: number;
  /** PNG bytes for the frame. */
  bytes: Uint8Array<ArrayBuffer>;
}

const urlCache = new WeakMap<Uint8Array<ArrayBuffer>, string>();

function urlFor(bytes: Uint8Array<ArrayBuffer>): string {
  let url = urlCache.get(bytes);

  if (url === undefined) {
    url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
    urlCache.set(bytes, url);
  }

  return url;
}

function SizeThumb({ size, bytes }: SizeThumbProps) {
  const url = urlFor(bytes);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
      urlCache.delete(bytes);
    };
  }, [bytes, url]);

  return (
    <figure className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 p-2 dark:border-slate-700">
      <div className="checkerboard flex size-20 items-center justify-center overflow-hidden rounded">
        <img
          alt={`Icon at ${String(size)} pixels`}
          className="size-16 object-contain"
          src={url}
        />
      </div>
      <figcaption className="text-xs text-slate-500 dark:text-slate-400">
        {size}px
      </figcaption>
    </figure>
  );
}

/**
 * Grid of rendered icon previews on a checkerboard background.
 *
 * @param props - Component properties.
 * @returns The preview grid or a status message.
 */
export function PreviewGrid({ frames, sizes }: PreviewGridProps) {
  if (frames === null) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
        Upload an image to preview the icon sizes.
      </p>
    );
  }

  const visible: { size: number; bytes: Uint8Array<ArrayBuffer> }[] = [];

  for (const size of sizes) {
    const bytes = frames.get(size);

    if (bytes !== undefined) {
      visible.push({ size, bytes });
    }
  }

  if (visible.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
        Select at least one size to preview.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {visible.map(({ size, bytes }) => (
        <li key={size}>
          <SizeThumb bytes={bytes} size={size} />
        </li>
      ))}
    </ul>
  );
}
