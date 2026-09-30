import { fakePng } from 'src/testUtils/fixtures';

import { encodeIcns, ICNS_SIZES } from './icns';

function view(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function readAscii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

describe('encodeIcns', () => {
  it('writes the icns header with the total file length', () => {
    const png = fakePng(16);
    const bytes = encodeIcns([{ size: 128, data: png }]);

    expect(readAscii(bytes, 0, 4)).toBe('icns');
    expect(view(bytes).getUint32(4, false)).toBe(8 + 8 + png.length);
  });

  it('writes an element with the OS type for the size', () => {
    const png = fakePng(4);
    const bytes = encodeIcns([{ size: 256, data: png }]);

    expect(readAscii(bytes, 8, 4)).toBe('ic08');
    expect(view(bytes).getUint32(12, false)).toBe(8 + png.length);
    expect(bytes.subarray(16)).toEqual(png);
  });

  it('maps every default size to an OS type', () => {
    const types = ICNS_SIZES.map((size) =>
      readAscii(encodeIcns([{ size, data: fakePng() }]), 8, 4),
    );

    expect(types).toEqual([
      'icp4',
      'icp5',
      'icp6',
      'ic07',
      'ic08',
      'ic09',
      'ic10',
    ]);
  });

  it('concatenates multiple elements', () => {
    const first = fakePng(8);
    const second = fakePng(24);
    const bytes = encodeIcns([
      { size: 16, data: first },
      { size: 1024, data: second },
    ]);

    expect(readAscii(bytes, 8, 4)).toBe('icp4');
    expect(view(bytes).getUint32(12, false)).toBe(8 + first.length);
    expect(readAscii(bytes, 8 + 8 + first.length, 4)).toBe('ic10');
    expect(bytes.subarray(8 + 8 + 8 + first.length)).toEqual(second);
    expect(view(bytes).getUint32(4, false)).toBe(bytes.length);
  });

  it('rejects an empty frame list', () => {
    expect(() => encodeIcns([])).toThrow('at least one image is required');
  });

  it('rejects an unsupported size', () => {
    expect(() => encodeIcns([{ size: 24, data: fakePng() }])).toThrow(
      'unsupported size 24',
    );
  });

  it('rejects empty frame data', () => {
    expect(() => encodeIcns([{ size: 16, data: new Uint8Array(0) }])).toThrow(
      'image data is empty',
    );
  });

  it('rejects data shorter than a PNG signature', () => {
    expect(() => encodeIcns([{ size: 16, data: new Uint8Array(4) }])).toThrow(
      'image data is not a PNG',
    );
  });

  it('rejects data without a PNG signature', () => {
    expect(() => encodeIcns([{ size: 16, data: new Uint8Array(8) }])).toThrow(
      'image data is not a PNG',
    );
  });
});
