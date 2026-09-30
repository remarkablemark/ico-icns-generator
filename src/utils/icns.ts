/**
 * macOS ICNS container encoder.
 */

/** A PNG frame to embed in an ICNS file. */
export interface IcnsImage {
  /** Square edge length in pixels, must be a supported ICNS size. */
  size: number;
  /** Raw PNG bytes for the frame. */
  data: Uint8Array;
}

/** Default sizes embedded in generated ICNS files. */
export const ICNS_SIZES: readonly number[] = [16, 32, 64, 128, 256, 512, 1024];

const ICNS_HEADER_BYTES = 8;
const ICNS_ELEMENT_HEADER_BYTES = 8;
const PNG_SIGNATURE_LENGTH = 8;

/**
 * Maps a pixel size to the ICNS OS type that accepts PNG data at that size.
 */
const ICNS_TYPE_BY_SIZE = new Map<number, string>([
  [16, 'icp4'],
  [32, 'icp5'],
  [64, 'icp6'],
  [128, 'ic07'],
  [256, 'ic08'],
  [512, 'ic09'],
  [1024, 'ic10'],
]);

function isPng(data: Uint8Array): boolean {
  if (data.length < PNG_SIGNATURE_LENGTH) {
    return false;
  }

  return (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  );
}

function writeAscii(bytes: Uint8Array, offset: number, text: string): void {
  for (let index = 0; index < text.length; index += 1) {
    bytes[offset + index] = text.charCodeAt(index);
  }
}

function typeForSize(size: number): string {
  const type = ICNS_TYPE_BY_SIZE.get(size);

  if (type === undefined) {
    throw new Error(`encodeIcns: unsupported size ${String(size)}`);
  }

  return type;
}

function assertValidImage(image: IcnsImage): void {
  typeForSize(image.size);

  if (image.data.length === 0) {
    throw new Error('encodeIcns: image data is empty');
  }

  if (!isPng(image.data)) {
    throw new Error('encodeIcns: image data is not a PNG');
  }
}

/**
 * Encodes PNG frames into a macOS `.icns` file.
 *
 * @param images - Frames to embed. Sizes must be one of {@link ICNS_SIZES}.
 * @returns The complete ICNS file bytes.
 * @throws If the frame list is empty or contains invalid frames.
 */
export function encodeIcns(images: IcnsImage[]): Uint8Array<ArrayBuffer> {
  if (images.length === 0) {
    throw new Error('encodeIcns: at least one image is required');
  }

  for (const image of images) {
    assertValidImage(image);
  }

  const totalBytes = images.reduce(
    (sum, image) => sum + ICNS_ELEMENT_HEADER_BYTES + image.data.length,
    ICNS_HEADER_BYTES,
  );

  const output = new Uint8Array(totalBytes);
  const view = new DataView(output.buffer);

  writeAscii(output, 0, 'icns');
  view.setUint32(4, totalBytes, false);

  let offset = ICNS_HEADER_BYTES;

  for (const image of images) {
    const length = ICNS_ELEMENT_HEADER_BYTES + image.data.length;

    writeAscii(output, offset, typeForSize(image.size));
    view.setUint32(offset + 4, length, false);
    output.set(image.data, offset + ICNS_ELEMENT_HEADER_BYTES);
    offset += length;
  }

  return output;
}
