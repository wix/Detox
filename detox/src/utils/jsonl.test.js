const fs = require('fs');
const { Readable } = require('stream');

const tempfile = require('tempfile');

jest.mock('./logger');

describe('JSONL', () => {
  let jsonl;

  beforeEach(() => {
    jsonl = require('./jsonl');
  });

  it('should sort JSON streams', async () => {
    const streamA = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', value: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', value: 'a2' },
      { time: '2000-01-01T00:00:00.004Z', value: 'a3' },
    ]));

    const streamB = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.000Z', value: 'b1' },
      { time: '2000-01-01T00:00:00.003Z', value: 'b2' },
      { time: '2000-01-01T00:00:00.005Z', value: 'b3' },
    ]));

    const jsonlStreamA = jsonl.toJSONLStream(streamA);
    const jsonlStreamB = jsonl.toJSONLStream(streamB);

    const result = jsonl.mergeSorted([jsonlStreamA, jsonlStreamB]);
    await expect(streamToJSONs(result)).resolves.toEqual([
      { time: new Date('2000-01-01T00:00:00.000Z'), value: 'b1' },
      { time: new Date('2000-01-01T00:00:00.001Z'), value: 'a1' },
      { time: new Date('2000-01-01T00:00:00.002Z'), value: 'a2' },
      { time: new Date('2000-01-01T00:00:00.003Z'), value: 'b2' },
      { time: new Date('2000-01-01T00:00:00.004Z'), value: 'a3' },
      { time: new Date('2000-01-01T00:00:00.005Z'), value: 'b3' },
    ]);
  });

  it('should handle unfinished JSON streams', async () => {
    const stringStream = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', value: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', value: 'a2' },
    ]).slice(0, -2));

    const result = jsonl.toJSONLStream(stringStream);

    await expect(streamToJSONs(result)).resolves.toEqual([
      { key: 0, value: { time: '2000-01-01T00:00:00.001Z', value: 'a1' } },
    ]);

    const logger = require('./logger');
    expect(logger.debug).toHaveBeenCalledWith({ event: 'JSONL_ERROR', err: expect.any(Error) });
  });

  it('should propagate errors from the input streams too', async () => {
    const nonexistentFileStream1 = fs.createReadStream(tempfile('.log'));
    const nonexistentFileStream2 = fs.createReadStream(tempfile('.log'));
    const jsonlStream1 = jsonl.toJSONLStream(nonexistentFileStream1);
    const jsonlStream2 = jsonl.toJSONLStream(nonexistentFileStream2);
    const mergedStream = jsonl.mergeSorted([jsonlStream1, jsonlStream2]);
    const stringifiedStream = jsonl.toStringifiedStream(mergedStream);
    await expect(streamToString(stringifiedStream)).rejects.toThrowError(/ENOENT/);
  });
});

//#region Helper functions

/***
 * @param {unknown[]} data
 */
function toJSONLString(data) {
  return data.map(j => JSON.stringify(j)).join('\n');
}

function stringToStream(str) {
  const s = new Readable();
  s._read = () => {};
  s.push(str);
  s.push(null); // eslint-disable-line unicorn/no-array-push-push
  return s;
}

/** @async */
function streamToString(stream) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

/** @async */
function streamToJSONs(stream) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => chunks.push(obj));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(chunks));
  });
}
//#endregion
