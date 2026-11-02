jest.mock('@bybrave/proper-lockfile2');
jest.mock('signal-exit', () => jest.fn(() => () => {}));
jest.mock('../src/logger/DetoxLogger');
