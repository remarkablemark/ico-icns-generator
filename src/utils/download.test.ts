import { downloadBlob } from './download';

describe('downloadBlob', () => {
  let created: string[];
  let revoked: string[];

  beforeEach(() => {
    created = [];
    revoked = [];

    URL.createObjectURL = vi.fn(() => {
      const url = `blob:test-${String(created.length)}`;
      created.push(url);
      return url;
    });

    URL.revokeObjectURL = vi.fn((url: string) => {
      revoked.push(url);
    });
  });

  it('clicks a temporary anchor with the requested filename', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    downloadBlob(new Uint8Array([1, 2, 3]), 'icon.ico');

    expect(click).toHaveBeenCalledTimes(1);
    expect(created).toEqual(['blob:test-0']);
    expect(revoked).toEqual(['blob:test-0']);
    expect(document.querySelectorAll('a')).toHaveLength(0);
  });

  it('assigns the object URL and download attribute to the anchor', () => {
    const hrefs: string[] = [];
    const downloads: string[] = [];

    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      hrefs.push(this.href);
      downloads.push(this.download);
    });

    downloadBlob(new Uint8Array([9]), 'icon.icns');

    expect(hrefs).toEqual(['blob:test-0']);
    expect(downloads).toEqual(['icon.icns']);
  });
});
