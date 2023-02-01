const fs = require('fs-extra');
const tempfile = require('tempfile');

describe('BunyanTransformer', () => {
  /** @type {import('./BunyanTransformer')} */
  let transformer;
  let DetoxLogger;
  let logger;
  let temporaryFiles;

  beforeEach(() => {
    temporaryFiles = [];

    const BunyanTransformer = require('./BunyanTransformer');

    DetoxLogger = jest.requireMock('../../DetoxLogger');
    logger = new DetoxLogger();
    transformer = new BunyanTransformer(logger);
  });

  afterEach(async () => {
    await Promise.all(temporaryFiles.map(filepath => fs.remove(filepath)));
    temporaryFiles = [];
  });

  it('should merge log files according to the timestamp', async () => {
    const fileA = saveAsFile(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', msg: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', msg: 'a2' },
      { time: '2000-01-01T00:00:00.004Z', msg: 'a3' },
    ]));

    const fileB = saveAsFile(toJSONLString([
      { time: '2000-01-01T00:00:00.000Z', msg: 'b1' },
      { time: '2000-01-01T00:00:00.003Z', msg: 'b2' },
      { time: '2000-01-01T00:00:00.005Z', msg: 'b3' },
    ]));

    const result = transformer.uniteSessionLogs([fileA, fileB]);
    await expect(toObjects(result)).resolves.toEqual([
      { time: new Date('2000-01-01T00:00:00.000Z'), msg: 'b1' },
      { time: new Date('2000-01-01T00:00:00.001Z'), msg: 'a1' },
      { time: new Date('2000-01-01T00:00:00.002Z'), msg: 'a2' },
      { time: new Date('2000-01-01T00:00:00.003Z'), msg: 'b2' },
      { time: new Date('2000-01-01T00:00:00.004Z'), msg: 'a3' },
      { time: new Date('2000-01-01T00:00:00.005Z'), msg: 'b3' },
    ]);
  });

  it('should handle unfinished JSON streams', async () => {
    const fileA = saveAsFile(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', msg: 'a1' },
      { time: '2000-01-01T00:00:00.002Z', msg: 'a2' },
    ]).slice(0, -2));

    const fileB = saveAsFile(toJSONLString([
      { time: '2000-01-01T00:00:01.001Z', msg: 'b1' },
      { time: '2000-01-01T00:00:01.002Z', msg: 'b2' },
    ]));

    const result = transformer.uniteSessionLogs([fileA, fileB]);
    await expect(toObjects(result)).resolves.toEqual([
      { time: new Date('2000-01-01T00:00:00.001Z'), msg: 'a1' },
      { time: new Date('2000-01-01T00:00:01.001Z'), msg: 'b1' },
      { time: new Date('2000-01-01T00:00:01.002Z'), msg: 'b2' },
    ]);

    expect(logger.debug).toHaveBeenCalledWith({ err: expect.any(Error) });
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });

  it('should convert bunyan JSON to bunyan debug streams', async () => {
    const logFile = saveAsFile(toJSONLString([
      { time: '2000-01-01T00:00:00.001Z', pid: 1, msg: 'Event 1', name: 'app', level: 30 },
      { time: '2000-01-01T00:00:00.002Z', pid: 1, msg: 'Event 2', name: 'app', level: 20 },
      { time: '2000-01-01T00:00:00.004Z', pid: 1, msg: 'Event 3', name: 'app', level: 10 },
    ]));
    const logStream = transformer.uniteSessionLogs([logFile]);
    const plainTransformer = transformer.createPlainTransformer({
      ...DetoxLogger.defaultOptions({ level: 'trace' }),
      showDate: time => time.toISOString(),
      showLevel: true,
    });

    logStream.pipe(plainTransformer.writable);
    await expect(toString(plainTransformer.readable)).resolves.toEqual([
      '2000-01-01T00:00:00.001Z app[1] INFO:  Event 1',
      '2000-01-01T00:00:00.002Z app[1] DEBUG: Event 2',
      '2000-01-01T00:00:00.004Z app[1] TRACE: Event 3',
      ''
    ].join('\n'));
  });

  it('should propagate errors from the input streams too', async () => {
    const logStream = transformer.uniteSessionLogs([tempfile()]);
    await expect(toString(logStream)).rejects.toThrowError(/ENOENT/);
  });

  //#region Helper functions

  /***
   * @param {unknown[]} data
   */
  function toJSONLString(data) {
    return data.map(j => JSON.stringify(j)).join('\n');
  }

  function saveAsFile(str) {
    const filename = tempfile();
    temporaryFiles.push(filename);
    fs.writeFileSync(filename, str);
    return filename;
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
});


