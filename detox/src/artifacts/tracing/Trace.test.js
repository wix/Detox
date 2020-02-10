const Trace = require('./Trace');

describe('Trace', () => {
  const tsMock = 1487076708000;
  class TestTrace extends Trace {
    constructor() {
      super({
        getTimeStampFn: () => tsMock,
        stringifyFn: (obj) => obj
      });
    }
  }

  const event = overrides => ({
    name: '',
    pid: undefined,
    tid: undefined,
    ts: tsMock,
    ph: '',
    args: {},
    ...overrides,
  });

  describe('constructor', () => {
    it('should not fail, if dependencies were not provided', () => {
      const constructor = () => new Trace();
      expect(constructor).not.toThrow();
    });
  });

  describe('startProcess and startThread', () => {
    it('should add process and thread metadata events', () => {
      const processId = 'testPid';
      const processName = 'detox';
      const threadId = 'testTid';
      const threadName = 'deviceType';

      const trace = new TestTrace()
        .startProcess({id: processId, name: processName})
        .startThread({id: threadId, name: threadName});
      const [processMetaEvent, threadMetaEvent] = trace.json();

      expect(processMetaEvent).toEqual(event({
        name: 'process_name',
        pid: processId,
        tid: threadId,
        ph: 'M',
        args: {name: processName},
      }));

      expect(threadMetaEvent).toEqual(event({
        name: 'thread_name',
        pid: processId,
        tid: threadId,
        ph: 'M',
        args: {name: threadName},
      }));
    });
  });

  describe('beginEvent', () => {
    it('should add begin event', () => {
      const name = 'eventName';

      const trace = new TestTrace().beginEvent(name);
      const [beginEvent] = trace.json();

      expect(beginEvent).toEqual(event({name, ph: 'B'}));
    });

    it('should add begin event with args', () => {
      const name = 'eventName';
      const arg = 'eventArg';

      const trace = new TestTrace().beginEvent(name, {arg});
      const [beginEvent] = trace.json();

      expect(beginEvent).toEqual(event({name, ph: 'B', args: {arg}}));
    });
  });

  describe('finishEvent', () => {
    it('should add end event', () => {
      const name = 'eventName';

      const trace = new TestTrace().finishEvent(name);
      const [endEvent] = trace.json();

      expect(endEvent).toEqual(event({name, ph: 'E'}));
    });

    it('should add end event with args', () => {
      const name = 'eventName';
      const arg = 'eventArg';

      const trace = new TestTrace().finishEvent(name, {arg});
      const [endEvent] = trace.json();

      expect(endEvent).toEqual(event({name, ph: 'E', args: {arg}}));
    });
  });

  describe('json', () => {
    it('should create json representation of all events', () => {
      const name = 'eventName';

      const trace = new Trace({getTimeStampFn: () => tsMock}).beginEvent(name).finishEvent(name);
      const json = trace.json();

      expect(json).toBe(JSON.stringify([event({name, ph: 'B'}), event({name, ph: 'E'})]));
    });
  });

  describe('traces', () => {
    const dataString = 'dataString';
    const jsonString = `[${dataString}]`;

    class TestTraceGeneration extends Trace {
      constructor() {
        super({stringifyFn: () => jsonString});
      }
    }

    it('should trim first and last character of the json representation', () => {
      const trace = new TestTraceGeneration();

      expect(trace.traces()).toEqual(dataString);
    });

    it('should add prefix', () => {
      const prefix = 'prefix';
      const trace = new TestTraceGeneration();

      expect(trace.traces({prefix})).toEqual(`${prefix}${dataString}`);
    });

    it('should add suffix', () => {
      const suffix = 'suffix';
      const trace = new TestTraceGeneration();

      expect(trace.traces({suffix})).toEqual(`${dataString}${suffix}`);
    });
  });
});
