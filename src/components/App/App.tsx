import { useIconGenerator } from 'src/hooks/useIconGenerator';
import { ICNS_SIZES } from 'src/utils/icns';
import { ICO_SIZES } from 'src/utils/ico';

import { DownloadBar } from '../DownloadBar';
import { Dropzone } from '../Dropzone';
import { PreviewGrid } from '../PreviewGrid';
import { SizeSelector } from '../SizeSelector';

/**
 * Application root: upload an image, pick sizes, download ICO and ICNS.
 *
 * @returns The page element.
 */
export function App() {
  const {
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
  } = useIconGenerator();

  const previewSizes = [...new Set([...icoSizes, ...icnsSizes])]
    .sort((left, right) => left - right)
    .filter((size) => source?.frames.has(size) === true);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
          Image to ICO & ICNS
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
          Drop in a PNG, JPEG, WebP or SVG and download a Windows{' '}
          <code className="font-[monospace] text-sm">.ico</code> or macOS{' '}
          <code className="font-[monospace] text-sm">.icns</code> file. All
          processing happens in your browser — nothing is uploaded.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section
          aria-labelledby="preview-heading"
          className="flex flex-col gap-5"
        >
          <Dropzone
            dimensions={
              source !== null
                ? { width: source.width, height: source.height }
                : null
            }
            fileName={fileName}
            loading={loading}
            onFile={loadFile}
            onReset={reset}
          />

          {error !== null && (
            <p
              className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          )}

          <h2
            className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            id="preview-heading"
          >
            Preview
          </h2>

          <PreviewGrid frames={source?.frames ?? null} sizes={previewSizes} />
        </section>

        <section
          aria-labelledby="options-heading"
          className="flex flex-col gap-5"
        >
          <h2
            className="text-sm font-semibold text-slate-800 dark:text-slate-200"
            id="options-heading"
          >
            Icon sizes
          </h2>

          <SizeSelector
            disabled={loading}
            hint="Windows icon · 16–256 px · used for favicons and executables"
            onToggle={(size) => {
              toggleSize('ico', size);
            }}
            options={ICO_SIZES}
            selected={icoSizes}
            title="ICO"
          />

          <SizeSelector
            disabled={loading}
            hint="macOS icon · 16–1024 px · Retina-ready icon family"
            onToggle={(size) => {
              toggleSize('icns', size);
            }}
            options={ICNS_SIZES}
            selected={icnsSizes}
            title="ICNS"
          />

          <DownloadBar
            disabled={loading || source === null}
            icnsCount={icnsSizes.length}
            icoCount={icoSizes.length}
            onDownload={download}
          />
        </section>
      </div>

      <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Free and open source ·{' '}
        <a
          className="underline hover:text-slate-600 dark:hover:text-slate-300"
          href="https://github.com/remarkablemark/ico-icns-generator"
          rel="nofollow noopener"
          target="_blank"
        >
          GitHub
        </a>
      </footer>
    </main>
  );
}
