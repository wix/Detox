jest.mock('./argparse');
require('./argparse').getArgValue.mockImplementation(key => {
  switch (key) {
    case 'artifacts-location': return 'tmp/logger';
    case 'record-logs': return 'all';
  }
});

const logger = require('./logger');

describe('logger', () => {
  it('should log something', () => {
    logger.info('something');
    logger.warn('a bit more');
  });

  it('should derive with a name', () => {
    const child = logger.child({ __filename });

    child.info('something from child');
    child.warn('a bit more from child');
  });

  it('should log multi-line stuff', () => {
    const stack = new Error().stack;
    logger.error({ stack }, `App crashed in test 'should log multi-line stuff', here's the native stack trace: \n${stack}`);
  });
});