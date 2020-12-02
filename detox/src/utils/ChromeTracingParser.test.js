describe('Chrome-Tracing parser', () => {
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
    const ChromeTracingParser = require('./ChromeTracingParser');
    uut = new ChromeTracingParser({
      process: { id: processId, name: processName },
      thread: { id: threadId, name: threadName },
    });
  });

  it('should parse an empty set of events', () => {
    const result = uut.parse([]);
    expect(result).toEqual('[');
  });

  it('should parse a start-event with args', () => {
    const startEvent = anEvent({ type: 'start' });
    const expectedObject = {
      name: startEvent.name,
      pid: processId,
      tid: threadId,
      ts: startEvent.ts,
      ph: 'B',
      args: startEvent.args,
    };
    const result = uut.parse([ startEvent ]);
    expect(result).toEqual(`[${JSON.stringify(expectedObject)}`);
  });

  it('should parse an end-event with args', () => {
    const endEvent = anEvent({ type: 'end' });
    const expectedObject = {
      name: endEvent.name,
      pid: processId,
      tid: threadId,
      ts: endEvent.ts,
      ph: 'E',
      args: endEvent.args,
    };
    const result = uut.parse([ endEvent ]);
    expect(result).toEqual(`[${JSON.stringify(expectedObject)}`);
  });

  it('should parse an init-event onto a process-start & thread-start pair of events', () => {
    const initEvent = {
      type: 'init',
      ts: 1234,
    };
    const expectedObjects = [{
      name: 'process_name',
      pid: processId,
      tid: threadId,
      ts: initEvent.ts,
      ph: 'M',
      args: { name: processName }
    }, {
      name: 'thread_name',
      pid: processId,
      tid: threadId,
      ts: initEvent.ts,
      ph: 'M',
      args: { name: threadName }
    }];
    const result = uut.parse([ initEvent ]);
    expect(result).toEqual(`[${JSON.stringify(expectedObjects).slice(1, -1)}`);
  });

  it('should throw an error in case of an unfamiliar event type', () => {
    const bizarreEvent = {
      type: 'bizarre',
      ts: 666,
    };

    expect(() => uut.parse([ bizarreEvent ])).toThrowError(/Invalid type 'bizarre'/);
  });

  it('should parse multiple events', () => {
    const startEvent = anEvent({ type: 'start' });
    const endEvent = anEvent({ type: 'end' });
    const result = uut.parse([ startEvent, endEvent ]);
    expect(result).toContain(`"ph":"B"`);
    expect(result).toContain(`"ph":"E"`);
  });

  it('should allow for appending content', () => {
    const result = uut.parse([], true);
    expect(result).toEqual(',');
  });
});
