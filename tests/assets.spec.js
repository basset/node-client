jest.mock('fs');
const fs = require('fs');

const assets = require('../lib/assets');

jest.mock('../lib/generate-hash', () => ({
  generateHash: jest.fn(() => 'sha'),
  generateFileHash: jest.fn(() => `fileSha`),
}));

test('walk returns a list of assets', async () => {
  fs.stat.mockImplementation((p, cb) => (cb(null, { isDirectory: () => false })));
  fs.readdir.mockImplementation((p, cb) => cb(null, [
    '1.png',
    '2.png',
    '3.png',
    '4.png',
  ]));
  const data = await assets.walk('/', 'baseUrl', []);
  expect(data).toEqual(
    expect.objectContaining({
      'baseUrl/1.png': 'fileSha',
      'baseUrl/2.png': 'fileSha',
      'baseUrl/3.png': 'fileSha',
      'baseUrl/4.png': 'fileSha',
    }),
  );
});

test('walk recurisvely searches directories', async () => {
  fs.readdir
    .mockImplementationOnce((p, cb) => cb(null, ['dir']))
    .mockImplementationOnce((p, cb) => cb(null, ['test.png']));

  fs.stat
    .mockImplementationOnce((p, cb) => (cb(null, { isDirectory: () => true })))
    .mockImplementationOnce((p, cb) => cb(null, { isDirectory: () => false }));
  const data = await assets.walk('/', 'baseUrl', []);
  expect(data).toEqual(
    expect.objectContaining({
      'baseUrl/dir/test.png': 'fileSha',
    }),
  );
});
