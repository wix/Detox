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

module.exports = {
  running,
  passed,
  failed,
};