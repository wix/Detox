const _ = require('lodash');

const isPromise = require('../utils/isPromise');

const DetoxTraceEventBuilder = require('./DetoxTraceEventBuilder');
const TraceThreadDispatcher = require('./TraceThreadDispatcher');

class DetoxTracer {
  /**
   * @param {object} options
   * @param {Detox.Logger} options.logger
   */
  constructor({ logger }) {
    this.logger = logger;
    this.builder = new DetoxTraceEventBuilder(this.logger.trace);
    this.categories = {};
    this.defaultEventDispatcher = new TraceThreadDispatcher({
      logger,
      name: 'Default',
      min: 10000,
    });
    this.eventDispatchers = { '': this.defaultEventDispatcher };
  }

  /**
   * @param {Detox.TraceEvent | string} eventOrName
   * @param {Detox.TraceEvent['args']} [args]
   * @returns {import('trace-event-lib').DurationEventHandle}
   */
  begin(eventOrName, args) {
    const event = typeof eventOrName === 'string' ? { name: eventOrName, args } : eventOrName;
    const mainCategory = event.cat ? event.cat.split(',', 1)[0] : '';
    const dispatcher = this.eventDispatchers[mainCategory] || this.defaultEventDispatcher;
    const tid = dispatcher.begin(event.id);

    return this.builder.begin({
      args: event.args,
      cat: event.cat || '',
      cname: event.cname,
      name: event.name,
      tid,
    });
  }

  end(eventOrName, args) {
    const event = typeof eventOrName === 'string' ? { name: eventOrName, args } : eventOrName || {};
    const mainCategory = event.cat ? event.cat.split(',', 1)[0] : '';
    const dispatcher = this.eventDispatchers[mainCategory] || this.defaultEventDispatcher;
    const tid = dispatcher.end(event.id);

    this.builder.end({
      args: event.args,
      cname: event.cname,
      tid,
    });
  }

  section(sectionName, funcOrPromise) {
    let result;

    this.begin(sectionName);
    try {
      result = typeof funcOrPromise === 'function'
        ? funcOrPromise()
        : funcOrPromise;

      if (!isPromise(result)) {
        this.end(sectionName, { success: true });
      } else {
        result.then(
          () => this.end(sectionName, { success: true }),
          (error) => this.end(sectionName, { success: false, error }),
        );
      }
    } catch (error) {
      this.end(sectionName, { success: false, error });
      throw error;
    }

    return result;
  }

  registerThreads(event, [min, max]) {
    this.eventDispatchers[event] = new TraceThreadDispatcher({
      logger: this.logger,
      name: event,
      min,
      max,
    });

    return this;
  }

  static default(options) {
    const tracer = new DetoxTracer(options);
    for (const [key, range] of Object.entries(this.CATEGORIES)) {
      tracer.registerThreads(key, range);
    }

    return Object.assign(
      tracer.section.bind(tracer),
      {
        begin: tracer.begin.bind(tracer),
        startSection: tracer.begin.bind(tracer),
        end: tracer.end.bind(tracer),
        endSection: tracer.end.bind(tracer),
      });
  }

  static categorize(tid) {
    return _.findKey(this.CATEGORIES, ([min, max]) => min <= tid && tid <= max) || 'user';
  }

  static threadize(cat) {
    const [mainCategory] = cat ? cat.split(',', 1) : 'user';
    const threads = _.find(this.CATEGORIES, (_, key) => key === mainCategory);
    return threads ? threads[0] : 10000;
  }

  /**
   * @type {Record<string, [number, number]>}
   */
  static CATEGORIES = {
    'lifecycle': [0, 0],
    'ipc': [29, 29],
    'ws-server': [50, 99],
    'ws-client': [100, 149],
    'device': [150, 159],
    'artifacts-manager': [300, 300],
    'artifact-plugin': [310, 349],
    'artifact': [350, 399],
    'child-process': [400, 499],
  };
}

module.exports = DetoxTracer;
