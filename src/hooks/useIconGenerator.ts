import { useRef, useState } from 'react';
import type { LoadedImage } from 'src/services/imageService';
import { loadImage } from 'src/services/imageService';
import type { OutputFormat } from 'src/types/icons';
import { downloadBlob } from 'src/utils/download';
import { encodeIcns, ICNS_SIZES } from 'src/utils/icns';
import { encodeIco, ICO_SIZES } from 'src/utils/ico';

/** State and actions for the icon generation workflow. */
export interface IconGeneratorState {
  /** Decoded image with rendered frames, or null before a successful load. */
  source: LoadedImage | null;
  /** Name of the file currently being loaded or loaded. */
  fileName: string | null;
  /** Whether an image is being processed. */
  loading: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Sizes selected for the ICO output. */
  icoSizes: number[];
  /** Sizes selected for the ICNS output. */
  icnsSizes: number[];
  /**
   * Loads an image file and renders every supported icon size for it.
   *
   * @param file - Image file chosen by the user.
   */
  loadFile: (file: File) => void;
  /** Clears the current image and restores the default size selections. */
  reset: () => void;
  /**
   * Toggles a size for the given output format.
   *
   * @param format - Output format the size belongs to.
   * @param size - Square edge length in pixels.
   */
  toggleSize: (format: OutputFormat, size: number) => void;
  /**
   * Encodes the selected sizes and downloads the file.
   *
   * @param format - Output format to generate.
   */
  download: (format: OutputFormat) => void;
}

const RENDER_SIZES: readonly number[] = [
  ...new Set([...ICO_SIZES, ...ICNS_SIZES]),
].sort((left, right) => left - right);

function toggleIn(sizes: number[], size: number): number[] {
  return sizes.includes(size)
    ? sizes.filter((value) => value !== size)
    : [...sizes, size];
}

/**
 * Manages uploading an image and generating ICO/ICNS files from it.
 *
 * @returns The current generator state and actions.
 */
export function useIconGenerator(): IconGeneratorState {
  const [source, setSource] = useState<LoadedImage | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [icoSizes, setIcoSizes] = useState<number[]>(() => [...ICO_SIZES]);
  const [icnsSizes, setIcnsSizes] = useState<number[]>(() => [...ICNS_SIZES]);

  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const requestIdRef = useRef(0);

  async function runLoad(file: File, requestId: number): Promise<void> {
    if (requestId !== requestIdRef.current) {
      return;
    }

    setError(null);
    setLoading(true);
    setSource(null);
    setFileName(file.name);

    try {
      const loaded = await loadImage(file, RENDER_SIZES);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setSource(loaded);
    } catch (cause) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setSource(null);
      setFileName(null);
      setError(
        cause instanceof Error ? cause.message : 'Failed to load the image.',
      );
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }

  function loadFile(file: File): void {
    if (file.type !== '' && !file.type.startsWith('image/')) {
      setError(`"${file.name}" is not a supported image file.`);
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    const run = (): Promise<void> => runLoad(file, requestId);

    chainRef.current = chainRef.current.then(run, run);
  }

  function reset(): void {
    requestIdRef.current += 1;
    setSource(null);
    setFileName(null);
    setError(null);
    setLoading(false);
    setIcoSizes([...ICO_SIZES]);
    setIcnsSizes([...ICNS_SIZES]);
  }

  function toggleSize(format: OutputFormat, size: number): void {
    if (format === 'ico') {
      setIcoSizes((sizes) => toggleIn(sizes, size));
    } else {
      setIcnsSizes((sizes) => toggleIn(sizes, size));
    }
  }

  function download(format: OutputFormat): void {
    if (source === null || fileName === null) {
      return;
    }

    const selected = format === 'ico' ? icoSizes : icnsSizes;

    if (selected.length === 0) {
      return;
    }

    try {
      const images = [...source.frames.entries()]
        .filter(([size]) => selected.includes(size))
        .sort(([left], [right]) => left - right)
        .map(([size, data]) => ({ size, data }));

      const bytes = format === 'ico' ? encodeIco(images) : encodeIcns(images);
      const baseName = fileName.replace(/\.[^.]+$/, '');

      downloadBlob(bytes, `${baseName || 'icon'}.${format}`);
    } catch {
      setError('Failed to generate the file.');
    }
  }

  return {
    source,
    fileName,
    loading,
    error,
    icoSizes,
    icnsSizes,
    loadFile,
    reset,
    toggleSize,
    download,
  };
}
