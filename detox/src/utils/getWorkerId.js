function getWorkerId() {
  return process.env.JEST_WORKER_ID;
}

module.exports = getWorkerId;
