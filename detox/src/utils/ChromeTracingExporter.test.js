describe('Chrome-Tracing exporter', () => {
  const processId = 'mock-process-id';
  const processName = 'mock-process-name';
  const threadId = 'mock-thread-id';
  const threadName = 'mock-thread-name';

  const anEvent = ({ type }) => ({
    type,
    name: 'mock-name',
    ts: 111111,
    args: {
      a: 1,
      b: 2,
    },
  });

  let uut;
  beforeEach(() => {
    const ChromeTracingExporter = require('./ChromeTracingExporter');
    uut = new ChromeTracingExporter({
      process: { id: processId, name: processName },
      thread: { id: threadId, name: threadName },
    });
  });

  it('should export an empty set of events', () => {
    const result = uut.export([]);
    expect(result).toEqual('[');
  });

  it('should export a start-event with args', () => {
    const startEvent = anEvent({ type: 'start' });
    const expectedTs = startEvent.ts * 1000;
    const expectedObject = {
      name: startEvent.name,
      pid: processId,
      tid: threadId,
      ts: expectedTs,
      ph: 'B',
      args: startEvent.args,
    };
    const result = uut.export([startEvent]);
    expect(result).toEqual(`[${JSON.stringify(expectedObject)}`);
  });

  it('should export an end-event with args', () => {
    const endEvent = anEvent({ type: 'end' });
    const expectedTs = endEvent.ts * 1000;
    const expectedObject = {
      name: endEvent.name,
      pid: processId,
      tid: threadId,
      ts: expectedTs,
      ph: 'E',
      args: endEvent.args,
    };
    const result = uut.export([endEvent]);
    expect(result).toEqual(`[${JSON.stringify(expectedObject)}`);
  });

  it('should export an init-event onto a process-start & thread-start pair of events', () => {
    const initEvent = {
      type: 'init',
      ts: 1234,
    };
    const expectedTs = initEvent.ts * 1000;
    const expectedObjects = [{
      name: 'process_name',
      pid: processId,
      tid: threadId,
      ts: expectedTs,
      ph: 'M',
      args: { name: processName }
    }, {
      name: 'thread_name',
      pid: processId,
      tid: threadId,
      ts: expectedTs,
      ph: 'M',
      args: { name: threadName }
    }];
    const result = uut.export([initEvent]);
    expect(result).toEqual(`[${JSON.stringify(expectedObjects).slice(1, -1)}`);
  });

  it('should throw an error in case of an unfamiliar event type', () => {
    const bizarreEvent = {
      type: 'bizarre',
      ts: 666,
    };

    expect(() => uut.export([bizarreEvent])).toThrowError(/Invalid type 'bizarre'/);
  });

  it('should export multiple events', () => {
    const startEvent = anEvent({ type: 'start' });
    const endEvent = anEvent({ type: 'end' });
    const result = uut.export([startEvent, endEvent]);
    expect(result).toContain(`"ph":"B"`);
    expect(result).toContain(`"ph":"E"`);
  });

  it('should allow for appending content', () => {
    const result = uut.export([], true);
    expect(result).toEqual(',');
  });
});
