const { AbstractEventBuilder } = require('trace-event-lib');

const getMainCategory = require('../getMainCategory');

const JSONLStringer = require('./JSONLStringer');
const { flatMapTransform } = require('./transformers');

class ChromeTraceTransformer {
  constructor() {
    /** @type {Map<string, number>} */
    this._globalThreadMap = null;
  }

  /**
   * @param {NodeJS.ReadableStream} eventStream
   */
  async scanThreadIDs(eventStream) {
    const processes = await new Promise((resolve, reject) => {
      const result = {};
      eventStream
        .on('end', () => resolve(result))
        .on('error', /* istanbul ignore next */ (err) => reject(err))
        .on('data', (event) => {
          const { ph, pid, tid, cat } = event;
          if (ph === 'B' || ph === 'i') {
            const categories = (result[pid] = result[pid] || {});
            const mainCategory = String(cat).split(',')[0];
            const tids = (categories[mainCategory] = categories[mainCategory] || []);
            if (!tids.includes(tid)) {
              tids.push(tid);
            }
          }
        });
    });

    const tidArray = Object.entries(processes).flatMap(([pid, categories]) => {
      return Object.entries(categories).flatMap(([category, tids]) => {
        return tids.map(tid => `${pid}:${category}:${tid}`);
      });
    });

    this._globalThreadMap = new Map(tidArray.map((hash, index) => [hash, index]));
  }

  /**
   * @returns {module:stream.internal.Transform}
   */
  createStream() {
    const transformFn = this._transformBunyanRecord.bind(this, {
      primaryPid: NaN,
      knownPids: new Set(),
      knownTids: new Set(),
    });

    return flatMapTransform(transformFn);
  }

  createSerializedStream() {
    const writable = this.createStream();
    const readable = JSONLStringer.serializeJSON();
    writable.pipe(readable);
    return { writable, readable };
  }

  /**
   * @param {{ knownPids: Set<number>; knownTids: Set<number>; primaryPid: number; }} state
   * @param {*} bunyanLogRecord
   * @returns {import('trace-event-lib').Event[]}
   * @private
   */
  _transformBunyanRecord(state, bunyanLogRecord) {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const { cat: rawCat, msg: name, ph, pid, tid: _tid, time, name: _name, hostname: _hostname, ...args } = bunyanLogRecord;
    const ts = new Date(time).getTime() * 1E3;
    const cat = rawCat || 'undefined';
    const tid = this._resolveGlobalTID(bunyanLogRecord);

    const builder = new SimpleEventBuilder();
    if (!state.knownPids.has(pid)) {
      if (Number.isNaN(state.primaryPid)) {
        state.primaryPid = pid;
      }

      builder.metadata({ pid, ts, name: 'process_name', args: { name: pid === state.primaryPid ? 'primary' : 'secondary' } });
      builder.metadata({ pid, ts, name: 'process_sort_index', args: { sort_index: state.knownPids.size } });
      state.knownPids.add(pid);
    }

    if (!state.knownTids.has(tid)) {
      const mainCategory = getMainCategory(cat);
      builder.metadata({ pid, tid, ts, name: 'thread_name', args: { name: mainCategory } });
      builder.metadata({ pid, tid, ts, name: 'thread_sort_index', args: { sort_index: tid } });
      state.knownTids.add(tid);
    }

    const event = { ph, name, pid, tid, cat, ts, args };
    if (ph === 'E') {
      delete event.name;
    }

    builder.events.push(event);
    return builder.events;
  }

  _resolveGlobalTID(event) {
    const hash = this._computeThreadHash(event);
    const tid = this._globalThreadMap ? this._globalThreadMap.get(hash) : event.tid;

    // Impossible condition, but anyway it is better to be safe than sorry.
    /* istanbul ignore next */
    return tid === undefined ? ChromeTraceTransformer.ERROR_TID : tid;
  }

  _computeThreadHash({ pid, tid, cat }) {
    return `${pid}:${getMainCategory(cat)}:${tid}`;
  }

  /* istanbul ignore next */
  static get ERROR_TID() {
    return 37707;
  }
}

class SimpleEventBuilder extends AbstractEventBuilder {
  events = [];

  send(event) {
    this.events.push(event);
  }
}

module.exports = ChromeTraceTransformer;
