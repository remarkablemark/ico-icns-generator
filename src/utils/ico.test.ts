import { fakePng } from 'src/testUtils/fixtures';

import { encodeIco, ICO_SIZES } from './ico';

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

describe('encodeIco', () => {
  it('writes the icon header', () => {
    const bytes = encodeIco([{ size: 16, data: fakePng() }]);
    const header = view(bytes);

    expect(header.getUint16(0, true)).toBe(0);
    expect(header.getUint16(2, true)).toBe(1);
    expect(header.getUint16(4, true)).toBe(1);
  });

  it('writes directory entries with offsets into the PNG data', () => {
    const png = fakePng(4);
    const bytes = encodeIco([{ size: 16, data: png }]);
    const header = view(bytes);

    expect(bytes[6]).toBe(16);
    expect(bytes[7]).toBe(16);
    expect(bytes[8]).toBe(0);
    expect(bytes[9]).toBe(0);
    expect(header.getUint16(10, true)).toBe(1);
    expect(header.getUint16(12, true)).toBe(32);
    expect(header.getUint32(14, true)).toBe(png.length);
    expect(header.getUint32(18, true)).toBe(22);
    expect(readAscii(bytes, 22, png.length)).toBe(
      readAscii(png, 0, png.length),
    );
  });

  it('encodes the 256px dimension as zero', () => {
    const bytes = encodeIco([{ size: 256, data: fakePng() }]);

    expect(bytes[6]).toBe(0);
    expect(bytes[7]).toBe(0);
  });

  it('concatenates multiple frames and updates offsets', () => {
    const first = fakePng(16);
    const second = fakePng(32);
    const bytes = encodeIco([
      { size: 16, data: first },
      { size: 32, data: second },
    ]);
    const header = view(bytes);

    expect(header.getUint16(4, true)).toBe(2);

    const firstOffset = header.getUint32(18, true);
    const secondOffset = header.getUint32(18 + 16, true);
    expect(firstOffset).toBe(38);
    expect(secondOffset).toBe(firstOffset + first.length);
    expect(header.getUint32(14 + 16, true)).toBe(second.length);
    expect(bytes.subarray(secondOffset)).toEqual(second);
    expect(bytes).toHaveLength(secondOffset + second.length);
  });

  it('exposes the default size set', () => {
    expect(ICO_SIZES).toEqual([16, 24, 32, 48, 64, 128, 256]);
  });

  it('rejects an empty frame list', () => {
    expect(() => encodeIco([])).toThrow('at least one image is required');
  });

  it('rejects more than 65535 frames', () => {
    const images = Array.from({ length: 0x10000 }, () => ({
      size: 16,
      data: fakePng(),
    }));

    expect(() => encodeIco(images)).toThrow(
      'at most 65535 images are supported',
    );
  });

  it('rejects a non-integer size', () => {
    expect(() => encodeIco([{ size: 16.5, data: fakePng() }])).toThrow(
      'size must be an integer between 1 and 256, got 16.5',
    );
  });

  it('rejects a size below the minimum', () => {
    expect(() => encodeIco([{ size: 0, data: fakePng() }])).toThrow(
      'size must be an integer between 1 and 256, got 0',
    );
  });

  it('rejects a size above the maximum', () => {
    expect(() => encodeIco([{ size: 257, data: fakePng() }])).toThrow(
      'size must be an integer between 1 and 256, got 257',
    );
  });

  it('rejects empty frame data', () => {
    expect(() => encodeIco([{ size: 16, data: new Uint8Array(0) }])).toThrow(
      'image data is empty',
    );
  });

  it('rejects data shorter than a PNG signature', () => {
    expect(() => encodeIco([{ size: 16, data: new Uint8Array(4) }])).toThrow(
      'image data is not a PNG',
    );
  });

  it('rejects data without a PNG signature', () => {
    const data = fakePng();
    data[3] = 0x00;

    expect(() => encodeIco([{ size: 16, data }])).toThrow(
      'image data is not a PNG',
    );
  });
});
