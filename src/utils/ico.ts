/**
 * Windows ICO container encoder.
 */

/** A PNG frame to embed in an ICO file. */
export interface IcoImage {
  /** Square edge length in pixels, 1-256. */
  size: number;
  /** Raw PNG bytes for the frame. */
  data: Uint8Array;
}

/** Default sizes embedded in generated ICO files. */
export const ICO_SIZES: readonly number[] = [16, 24, 32, 48, 64, 128, 256];

const ICO_HEADER_BYTES = 6;
const ICO_ENTRY_BYTES = 16;
const MAX_ICO_IMAGES = 0xffff;
const MAX_ICO_SIZE = 256;
const MIN_ICO_SIZE = 1;
const PNG_SIGNATURE_LENGTH = 8;
const BITS_PER_PIXEL = 32;

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

function assertValidImage(image: IcoImage): void {
  const { size, data } = image;

  if (!Number.isInteger(size) || size < MIN_ICO_SIZE || size > MAX_ICO_SIZE) {
    throw new Error(
      `encodeIco: size must be an integer between ${String(MIN_ICO_SIZE)} and ${String(MAX_ICO_SIZE)}, got ${String(size)}`,
    );
  }

  if (data.length === 0) {
    throw new Error('encodeIco: image data is empty');
  }

  if (!isPng(data)) {
    throw new Error('encodeIco: image data is not a PNG');
  }
}

/**
 * Encodes PNG frames into a Windows `.ico` file.
 *
 * @param images - Frames to embed. Each frame must be square (1-256px) PNG data.
 * @returns The complete ICO file bytes.
 * @throws If the frame list is empty, too large, or contains invalid frames.
 */
export function encodeIco(images: IcoImage[]): Uint8Array<ArrayBuffer> {
  if (images.length === 0) {
    throw new Error('encodeIco: at least one image is required');
  }

  if (images.length > MAX_ICO_IMAGES) {
    throw new Error(
      `encodeIco: at most ${String(MAX_ICO_IMAGES)} images are supported`,
    );
  }

  for (const image of images) {
    assertValidImage(image);
  }

  const offsetOfData = ICO_HEADER_BYTES + images.length * ICO_ENTRY_BYTES;
  const totalBytes = images.reduce(
    (sum, image) => sum + image.data.length,
    offsetOfData,
  );

  const output = new Uint8Array(totalBytes);
  const view = new DataView(output.buffer);

  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, images.length, true);

  let offset = offsetOfData;

  images.forEach((image, index) => {
    const entry = ICO_HEADER_BYTES + index * ICO_ENTRY_BYTES;
    const dimension = image.size === MAX_ICO_SIZE ? 0 : image.size;

    output[entry] = dimension;
    output[entry + 1] = dimension;
    output[entry + 2] = 0;
    output[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, BITS_PER_PIXEL, true);
    view.setUint32(entry + 8, image.data.length, true);
    view.setUint32(entry + 12, offset, true);

    output.set(image.data, offset);
    offset += image.data.length;
  });

  return output;
}
