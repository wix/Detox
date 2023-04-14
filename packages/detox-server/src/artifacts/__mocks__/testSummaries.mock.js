const running = () => ({
  title: 'test',
  fullName: 'Suite test',
  status: 'running',
});

const passed = () => ({
  title: 'test',
  fullName: 'Suite test',
  status: 'passed',
});

const failed = () => ({
  title: 'test',
  fullName: 'Suite test',
  status: 'failed',
});

const timedOut = () => ({
  ...failed(),
  timedOut: true,
});

module.exports = {
  running,
  passed,
  failed,
  timedOut,
};