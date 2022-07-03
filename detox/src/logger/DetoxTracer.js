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
   * @returns {import('trace-event-lib').EndHandle<Detox.TraceEvent>}
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
    const event = typeof eventOrName === 'string' ? { name: eventOrName, args } : eventOrName;
    const mainCategory = event.cat ? event.cat.split(',', 1)[0] : '';
    const dispatcher = this.eventDispatchers[mainCategory] || this.defaultEventDispatcher;
    const tid = dispatcher.end(event.id);

    return this.builder.end({
      args: event.args,
      cname: event.cname,
      tid,
    });
  }

  section(sectionName, func) {
    let result;

    this.begin(sectionName);
    try {
      result = func();
      if (!isPromise(result)) {
        this.end(sectionName, { success: true });
      } else {
        result.then(
          () => this.end(sectionName, { success: true }),
          (err) => this.end(sectionName, { success: false, err }),
        );
      }
    } catch (err) {
      this.end(sectionName, { success: false, err });
      throw err;
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
    const tracer = new DetoxTracer(options)
      .registerThreads('lifecycle', [0, 0])
      .registerThreads('ipc', [29, 29])
      .registerThreads('ws-server', [30, 99])
      .registerThreads('ws-client', [100, 131])
      .registerThreads('artifacts-manager', [200, 209])
      .registerThreads('artifact-plugin', [210, 249])
      .registerThreads('artifact', [250, 299])
      .registerThreads('child-process', [300, 399]);

    return Object.assign(
      tracer.section.bind(tracer),
      {
        begin: tracer.begin.bind(tracer),
        startSection: tracer.begin.bind(tracer),
        end: tracer.end.bind(tracer),
        endSection: tracer.end.bind(tracer),
      });
  }
}

module.exports = DetoxTracer;
