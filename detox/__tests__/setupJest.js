jest.mock('proper-lockfile');
jest.mock('signal-exit', () => jest.fn(() => () => {}));
jest.mock('../src/logger/DetoxLogger');
