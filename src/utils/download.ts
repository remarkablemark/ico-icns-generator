/**
 * Browser download helpers.
 */

/**
 * Triggers a download of the given bytes as a file.
 *
 * @param data - File contents.
 * @param filename - Name the file is saved as.
 */
export function downloadBlob(
  data: Uint8Array<ArrayBuffer>,
  filename: string,
): void {
  const blob = new Blob([data], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
