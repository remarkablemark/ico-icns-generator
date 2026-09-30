/** Test fixtures shared across suites. */

/**
 * Builds byte sequences that carry a valid PNG signature.
 *
 * The encoders only verify the signature, so no real image data is required.
 *
 * @param payloadBytes - Number of filler bytes after the 8-byte signature.
 * @returns PNG-looking bytes.
 */
export function fakePng(payloadBytes = 8): Uint8Array<ArrayBuffer> {
  const data = new Uint8Array(8 + payloadBytes);
  data.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return data;
}
