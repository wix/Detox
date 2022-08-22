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

    it('should trace a successful call', async () => {
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

    it('should trace a failed call', async () => {
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
  });
});
