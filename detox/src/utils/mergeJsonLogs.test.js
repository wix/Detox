const fs = require('fs');
const { Readable } = require('stream');

const tempfile = require('tempfile');

jest.mock('./logger');

describe('mergeJsonLogs', () => {
  const START_TIME = new Date('2000-01-01T00:00:00.000Z').getTime();

  let mergeJsonLogs;

  beforeEach(() => {
    mergeJsonLogs = require('./mergeJsonLogs');
  });

  it('should sort JSON streams', async () => {
    const streamA = stringToStream(toJSONL([
      { time: new Date(START_TIME + 1), value: 'a1' },
      { time: new Date(START_TIME + 2), value: 'a2' },
      { time: new Date(START_TIME + 4), value: 'a3' },
    ]));

    const streamB = stringToStream(toJSONL([
      { time: new Date(START_TIME + 0), value: 'b1' },
      { time: new Date(START_TIME + 3), value: 'b2' },
      { time: new Date(START_TIME + 5), value: 'b3' },
    ]));

    const result = await streamToString(mergeJsonLogs([streamA, streamB]));
    expect(result).toBe(toJSONL([
      { time:'2000-01-01T00:00:00.000Z', value: 'b1' },
      { time:'2000-01-01T00:00:00.001Z', value: 'a1' },
      { time:'2000-01-01T00:00:00.002Z', value: 'a2' },
      { time:'2000-01-01T00:00:00.003Z', value: 'b2' },
      { time:'2000-01-01T00:00:00.004Z', value: 'a3' },
      { time:'2000-01-01T00:00:00.005Z', value: 'b3' },
    ]));
  });

  it('should handle unfinished JSON streams', async () => {
    const streamA = stringToStream(toJSONL([
      { time: new Date(START_TIME + 1), value: 'a1' },
      { time: new Date(START_TIME + 2), value: 'a2' },
    ]).slice(0, -2));

    const result = await streamToString(mergeJsonLogs([streamA]));
    expect(result).toBe(toJSONL([
      { time: new Date(START_TIME + 1), value: 'a1' }
    ]));

    const logger = require('./logger');
    expect(logger.debug).toHaveBeenCalledWith({ event: 'JSONL_ERROR', err: expect.any(Error) });
  });

  it('should propagate errors from the input streams too', async () => {
    const nonexistentFileStream = fs.createReadStream(tempfile('.log'));
    const mergedStream = mergeJsonLogs([nonexistentFileStream]);
    await expect(streamToString(mergedStream)).rejects.toThrowError(/ENOENT/);
  });
});

//#region Helper functions

/***
 * @param {unknown[]} data
 */
function toJSONL(data) {
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

//#endregion
