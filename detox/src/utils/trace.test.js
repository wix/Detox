describe('Trace util', () => {
  const timestampProviderFn = () => 1234;

  let Trace;
  let uut;
  beforeEach(() => {
    Trace = require('./trace').Trace;
    uut = new Trace();
    uut.init(timestampProviderFn);
  });

  it('should produce an empty events list upon creation', () => {
    expect(new Trace().events).toEqual([]);
  });

  it('should produce an init event at init time', () => {
    expect(uut.events).toEqual([{
      type: 'init',
      ts: 1234,
    }]);
  });

  it('should produce a section-start event', () => {
    const section = {
      name: 'section-name',
      args: { arg1: 'val1' },
    };

    uut.startSection(section.name, section.args);
    expect(uut.events[1]).toEqual({
      type: 'start',
      ts: 1234,
      ...section,
    });
  });

  it('should produce a section-end event', () => {
    const section = {
      name: 'section-name',
      args: { arg1: 'val1' },
    };

    uut.startSection(section.name, section.args);
    uut.endSection(section.name, section.args);
    expect(uut.events[2]).toEqual({
      type: 'end',
      ts: 1234,
      ...section,
    });
  });

  it('should be able to reset', () => {
    const section = {
      name: 'section-name',
      args: { arg1: 'val1' },
    };

    uut.startSection(section.name, section.args);
    uut.endSection(section.name, section.args);
    uut.reset();
    expect(uut.events).toEqual([{
      type: 'init',
      ts: 1234,
    }]);
  });

  it('should export an instance', () => {
    const { trace } = require('./trace');
    trace.init();
    trace.startSection('section1', {});
    trace.endSection('section1', {});
    trace.reset();
  });

  describe('should send to delegate if one is defined', () => {
    const delegate = ({
      addEvent: jest.fn(),
    });

    beforeEach(() => {
      uut.setDelegate(delegate);
    });

    it('should throw exception for passing null to setDelegate', () => {
      const error = new Error('You must pass a delegate to setDelegate!');
      expect(() => uut.setDelegate(null)).toThrowError(error);
    });

    it('should throw exception for passing delegate that does not implement addEvent', () => {
      const error = new Error('Delegate passed to setDelegate must implement addEvent function!');
      const badDelegate = () => ({
        badMethod: jest.fn(),
      })
      expect(() => uut.setDelegate(badDelegate)).toThrowError(error);
    });

    it('should send on startSection', () => {
      uut.startSection('section1', {});

      const expected = {"args": {}, "name": "section1", "ts": expect.any(Number), "type": "start"};
      expect(delegate.addEvent).toHaveBeenCalledWith(expected);
    });

    it('should send on endSection', () => {
      uut.endSection('section1', {});

      const expected = {"args": {}, "name": "section1", "ts": expect.any(Number), "type": "end"};
      expect(delegate.addEvent).toHaveBeenCalledWith(expected);
    });

    it('should send on reset', () => {
      uut.reset();

      const expected = {"ts": expect.any(Number), "type": "init"};
      expect(delegate.addEvent).toHaveBeenCalledWith(expected);
    });
  });

  describe('trace-call function', () => {
    const { trace, traceCall } = require('./trace');
    const sectionName = 'section-name';
    const startEventTraits = {
      type: 'start',
      name: sectionName,
    };
    const successEndEventTraits = {
      type: 'end',
      name: sectionName,
      args: {
        success: true,
      },
    };
    const aFailEndEventTraits = (error) => ({
      type: 'end',
      name: 'section-name',
      args: {
        success: false,
        error: error.toString(),
      },
    });

    afterEach(() => {
      trace.reset();
    });

    it('should trace a successful promise call', async () => {
      const promise = Promise.resolve(42);

      trace.init();
      const result = await traceCall(sectionName, promise);
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(startEventTraits),
        expect.objectContaining(successEndEventTraits),
      ]);
      expect(result).toEqual(42);
    });

    it('should trace a successful function call', async () => {
      const functionCall = () => Promise.resolve(42);

      trace.init();
      const result = await traceCall(sectionName, functionCall);
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(startEventTraits),
        expect.objectContaining(successEndEventTraits),
      ]);
      expect(result).toEqual(42);
    });

    it('should trace a failed promise call', async () => {
      const error = new Error('error mock');
      const promise = Promise.reject(error);

      trace.init();
      await expect(traceCall(sectionName, promise)).rejects.toThrowError(error);
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(startEventTraits),
        expect.objectContaining(aFailEndEventTraits(error)),
      ]);
    });

    it('should trace a failed function call', async () => {
      const error = new Error('error mock');
      const functionCall = () => Promise.reject(error);

      trace.init();
      await expect(traceCall(sectionName, functionCall)).rejects.toThrowError(error);
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(startEventTraits),
        expect.objectContaining(aFailEndEventTraits(error)),
      ]);
    });

  });

  describe('trace-invocation-call function', () => {
    const { trace, traceInvocationCall } = require('./trace');
    const sectionName = 'section-name';
    const invocation = {
      foo: 'bar'
    };
    const args = {
      context: 'invocation',
      invocation: JSON.stringify(invocation),
      stackTrace: expect.any(String)
    };

    afterEach(() => {
      trace.reset();
    });

    it('should trace a successful invocation call', async () => {
      const promise = Promise.resolve(42);

      trace.init();
      const result = await traceInvocationCall(sectionName, invocation, promise);

      const expectedStartEvent = {
        type: 'start',
        name: sectionName,
        args
      };
      const expectedEndEvent = {
        type: 'end',
        name: sectionName,
        args: { ...args, success: true },
      };
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(expectedStartEvent),
        expect.objectContaining(expectedEndEvent),
      ]);
      expect(result).toEqual(42);
    });

    it('should trace a failed invocation call', async () => {
      const error = new Error('error mock');
      const promise = Promise.reject(error);

      trace.init();
      await expect(traceInvocationCall(sectionName, invocation, promise)).rejects.toThrowError(error);

      const expectedStartEvent = {
        type: 'start',
        name: sectionName,
        args
      };
      const expectedEndEvent = {
        type: 'end',
        name: sectionName,
        args: { ...args, error: 'Error: error mock', success: false },
      };
      expect(trace.events).toEqual([
        expect.any(Object),
        expect.objectContaining(expectedStartEvent),
        expect.objectContaining(expectedEndEvent),
      ]);
    });
  });

});
