const DetoxConfigErrorBuilder = require('../errors/DetoxConfigErrorBuilder');

describe('composeSessionConfig', () => {
  let composeSessionConfig;
  let detoxConfig, deviceConfig;
  /** @type {DetoxConfigErrorBuilder} */
  let errorBuilder;

  beforeEach(() => {
    composeSessionConfig = require('./composeSessionConfig');
    errorBuilder = new DetoxConfigErrorBuilder();
    detoxConfig = {};
    deviceConfig = {};
  });

  const compose = () => composeSessionConfig({
    detoxConfig,
    deviceConfig,
    errorBuilder,
  });

  it('should generate a default config', async () => {
    const sessionConfig = await compose();

    expect(sessionConfig).toMatchObject({
      autoStart: true,
      server: expect.stringMatching(/^ws:.*localhost:/),
      sessionId: expect.stringMatching(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i),
    });
  });

  describe('if detoxConfig.session is defined', function() {
    beforeEach(() => {
      detoxConfig.session = {
        server: 'ws://localhost:9999',
        sessionId: 'someSessionId',
      };
    })

    it('should return detoxConfig.session', async () => {
      expect(await compose()).toEqual({
        server: 'ws://localhost:9999',
        sessionId: 'someSessionId',
      });
    });

    test(`providing empty server config should throw`, () => {
      delete detoxConfig.session.server;
      expect(compose()).rejects.toThrowError(errorBuilder.missingServerProperty());
    });

    test(`providing server config with no session should throw`, () => {
      delete detoxConfig.session.sessionId;
      expect(compose()).rejects.toThrowError(errorBuilder.missingSessionIdProperty());
    });

    describe('if deviceConfig.session is defined', function() {
      beforeEach(() => {
        detoxConfig.session = {
          server: 'ws://localhost:1111',
          sessionId: 'anotherSession',
        };
      });

      it('should return deviceConfig.session instead of detoxConfig.session', async () => {
        expect(await compose()).toEqual({
          server: 'ws://localhost:1111',
          sessionId: 'anotherSession',
        });
      });
    });
  });
});

