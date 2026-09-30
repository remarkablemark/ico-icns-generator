import type { ChangeEvent, DragEvent } from 'react';
import { useState } from 'react';

/** Properties for the {@link Dropzone} component. */
export interface DropzoneProps {
  /** Whether the image is currently being processed. */
  loading: boolean;
  /** Name of the selected file, if any. */
  fileName: string | null;
  /** Intrinsic dimensions of the selected image, if any. */
  dimensions: { width: number; height: number } | null;
  /** Called with the file picked or dropped by the user. */
  onFile: (file: File) => void;
  /** Called when the user clears the selection. */
  onReset: () => void;
}

/**
 * File picker and drag-and-drop area for choosing a source image.
 *
 * @param props - Component properties.
 * @returns The dropzone element.
 */
export function Dropzone({
  loading,
  fileName,
  dimensions,
  onFile,
  onReset,
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const loaded = fileName !== null;

  function handleDrop(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setDragging(false);

    const { files } = event.dataTransfer;

    if (files.length > 0) {
      onFile(files[0]);
    }
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>): void {
    event.preventDefault();
    setDragging(true);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;

    if (files !== null && files.length > 0) {
      onFile(files[0]);
      event.target.value = '';
    }
  }

  const border = dragging
    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40'
    : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900';

  return (
    <>
      <label
        aria-busy={loading}
        className={`flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${border}`}
        data-testid="dropzone"
        onDragLeave={() => {
          setDragging(false);
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept="image/*"
          aria-label="Choose an image file"
          className="sr-only"
          onChange={handleChange}
          type="file"
        />

        {loaded ? (
          <>
            <span className="max-w-full truncate font-medium text-slate-800 dark:text-slate-100">
              {fileName}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {loading
                ? 'Processing…'
                : dimensions !== null
                  ? `${String(dimensions.width)} × ${String(dimensions.height)} px`
                  : ''}
            </span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400">
              Click to replace or drop another image
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Drag &amp; drop your image here
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              or click to browse
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              PNG, JPEG, WebP, GIF, AVIF, BMP or SVG · nothing is uploaded
            </span>
          </>
        )}
      </label>

      {loaded && (
        <button
          className="mt-3 cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-slate-800 hover:text-slate-900 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-300 dark:hover:text-slate-100"
          onClick={onReset}
          type="button"
        >
          Clear image
        </button>
      )}
    </>
  );
}
