import type { OutputFormat } from 'src/types/icons';

/** Properties for the {@link DownloadBar} component. */
export interface DownloadBarProps {
  /** Whether downloads are unavailable, e.g. while loading. */
  disabled: boolean;
  /** Number of sizes selected for the ICO output. */
  icoCount: number;
  /** Number of sizes selected for the ICNS output. */
  icnsCount: number;
  /** Starts a download for the given format. */
  onDownload: (format: OutputFormat) => void;
}

const buttonClass =
  'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:pointer-events-none disabled:opacity-50';

/**
 * Download buttons for the generated ICO and ICNS files.
 *
 * @param props - Component properties.
 * @returns The download bar element.
 */
export function DownloadBar({
  disabled,
  icoCount,
  icnsCount,
  onDownload,
}: DownloadBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <button
        className={buttonClass}
        disabled={disabled || icoCount === 0}
        onClick={() => {
          onDownload('ico');
        }}
        type="button"
      >
        Download .ico{' '}
        <span className="text-indigo-200">({icoCount} sizes)</span>
      </button>

      <button
        className={buttonClass}
        disabled={disabled || icnsCount === 0}
        onClick={() => {
          onDownload('icns');
        }}
        type="button"
      >
        Download .icns{' '}
        <span className="text-indigo-200">({icnsCount} sizes)</span>
      </button>
    </div>
  );
}
