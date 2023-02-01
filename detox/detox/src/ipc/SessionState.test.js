const SessionState = require('./SessionState');

describe('SessionState', () => {
  /** @type {function} */
  let someFunction;

  /** @type {SessionState} */
  let sessionState;

  beforeEach(() => {
    someFunction = () => { return 'foo'; };

    sessionState = new SessionState({
      id: '123',
      detoxConfig: {
        someFunction
      },
      detoxIPCServer: 'server',
      testResults: ['result1', 'result2'],
      testSessionIndex: 1,
      workersCount: 2,
    });
  });

  describe('when created without arguments', () => {
    it('should have default values', () => {
      expect(new SessionState({})).toEqual({
        id: '',
        detoxConfig: null,
        detoxIPCServer: '',
        testResults: [],
        testSessionIndex: 0,
        workersCount: 0,
      });
    });
  });

  it('should create the new session state with the given properties', () => {
    expect(sessionState.id).toEqual('123');
    expect(sessionState.detoxConfig).toEqual({ someFunction });
    expect(sessionState.detoxIPCServer).toEqual('server');
    expect(sessionState.testResults).toEqual(['result1', 'result2']);
    expect(sessionState.testSessionIndex).toEqual(1);
    expect(sessionState.workersCount).toEqual(2);
  });

  describe('patch', () => {
    it('should update the session state', () => {
      sessionState.patch({
        testResults: ['result3', 'result4'],
        testSessionIndex: 2,
        workersCount: 3,
      });

      expect(sessionState.testResults).toEqual(['result3', 'result4']);
      expect(sessionState.testSessionIndex).toEqual(2);
      expect(sessionState.workersCount).toEqual(3);
    });

    it('should not update with null params', () => {
      sessionState.patch({
        workersCount: 3,
      });

      expect(sessionState.testResults).toEqual(['result1', 'result2']);
      expect(sessionState.testSessionIndex).toEqual(1);
      expect(sessionState.workersCount).toEqual(3);
    });
  });

  it('should stringify correctly', () => {
    const expected = '{"id":"123",' +
      '"detoxConfig":{"someFunction":{"$fn":"(() => {\\n      return \'foo\';\\n    })"}},' +
      '"detoxIPCServer":"server","testResults":["result1","result2"],"testSessionIndex":1,"workersCount":2}';

    expect(sessionState.stringify()).toEqual(expected);
  });

  it('should parse stringified session state to class instance', () => {
    const stringified = '{"id":"123",' +
      '"detoxConfig":{"someFunction":{"$fn":"(() => {\\n      return \'foo\';\\n    })"}},' +
      '"detoxIPCServer":"server","testResults":["result1","result2"],"testSessionIndex":1,"workersCount":2}';

    const parsed = SessionState.parse(stringified);
    // There's no way to compare anonymous functions, so we'll just compare their stringified versions.
    expect(parsed.detoxConfig.someFunction.toString()).toEqual(someFunction.toString());
    expect(parsed.detoxConfig.someFunction()).toEqual(someFunction());

    // We're comparing the parsed object to the original object, but we remove the functions from the objects since
    // there's no way to compare anonymous functions.
    delete parsed.detoxConfig.someFunction;
    delete sessionState.detoxConfig.someFunction;
    expect(parsed).toEqual(sessionState);
  });
});
