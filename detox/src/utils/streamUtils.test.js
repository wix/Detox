const fs = require('fs');
const { Readable } = require('stream');

const pipe = require('multipipe');
const tempfile = require('tempfile');

jest.mock('./logger');

describe('JSONL', () => {
  let utils;

  beforeEach(() => {
    utils = require('./streamUtils');
  });

  it('should sort JSON streams', async () => {
    const streamA = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', value: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', value: 'a2' },
      { time: '2000-01-01T00:00:00.004Z', value: 'a3' },
    ])).pipe(utils.readJSONL());

    const streamB = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.000Z', value: 'b1' },
      { time: '2000-01-01T00:00:00.003Z', value: 'b2' },
      { time: '2000-01-01T00:00:00.005Z', value: 'b3' },
    ])).pipe(utils.readJSONL());

    const result = utils.mergeSortedJSONL([streamA, streamB]);
    await expect(toObjects(result)).resolves.toEqual([
      { time: new Date('2000-01-01T00:00:00.000Z'), value: 'b1' },
      { time: new Date('2000-01-01T00:00:00.001Z'), value: 'a1' },
      { time: new Date('2000-01-01T00:00:00.002Z'), value: 'a2' },
      { time: new Date('2000-01-01T00:00:00.003Z'), value: 'b2' },
      { time: new Date('2000-01-01T00:00:00.004Z'), value: 'a3' },
      { time: new Date('2000-01-01T00:00:00.005Z'), value: 'b3' },
    ]);
  });

  it('should handle unfinished JSON streams', async () => {
    const jsonlStream = stringToStream(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', value: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', value: 'a2' },
    ]).slice(0, -2)).pipe(utils.readJSONL());

    await expect(toObjects(jsonlStream)).resolves.toEqual([
      { key: 0, value: { time: '2000-01-01T00:00:00.001Z', value: 'a1' } },
    ]);

    const logger = require('./logger');
    expect(logger.debug).toHaveBeenCalledWith({ event: 'JSONL_ERROR', err: expect.any(Error) });
  });

  it('should convert bunyan JSON to bunyan debug streams', async () => {
    const events = objectsToStream([
      { time: '2000-01-01T00:00:00.001Z', pid: 1, msg: 'Event 1', name: 'app', level: 30 },
      { time: '2000-01-01T00:00:00.002Z', pid: 1, msg: 'Event 2', name: 'app', level: 20 },
      { time: '2000-01-01T00:00:00.004Z', pid: 1, msg: 'Event 3', name: 'app', level: 10 },
    ]);

    const bsd = events.pipe(utils.debugStream());
    await expect(toString(bsd)).resolves.toEqual([
      '2000-01-01T00:00:00.001Z app[1] INFO:  Event 1',
      '2000-01-01T00:00:00.002Z app[1] DEBUG: Event 2',
      '2000-01-01T00:00:00.004Z app[1] TRACE: Event 3',
      ''
    ].join('\n'));
  });

  it('should propagate errors from the input streams too', async () => {
    const nonexistentFileStream1 = pipe(fs.createReadStream(tempfile('.log')), utils.readJSONL());
    const nonexistentFileStream2 = pipe(fs.createReadStream(tempfile('.log')), utils.readJSONL());
    const mergedStream = utils.mergeSortedJSONL([nonexistentFileStream1, nonexistentFileStream2]);
    const stringifiedStream = pipe(mergedStream, utils.writeJSONL());
    await expect(toString(stringifiedStream)).rejects.toThrowError(/ENOENT/);
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

function objectsToStream(objs) {
  const s = new Readable({ objectMode: true });
  s._read = () => {};
  for (const o of objs) {
    s.push(o);
  }
  s.push(null); // eslint-disable-line unicorn/no-array-push-push
  return s;
}

/** @async */
function toString(stream) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('finish', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

/** @async */
function toObjects(stream) {
  const chunks = [];

  return new Promise((resolve, reject) => {
    stream.on('data', (obj) => chunks.push(obj));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(chunks));
  });
}
//#endregion
