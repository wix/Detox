const _ = require('lodash');

const TRACE = {
  DEFAULT: { cat: 'misc', tid: 0 },
  PRIMARY_CONTEXT: { cat: 'lifecycle', tid: 1 },
  SECONARY_CONTEXT: { cat: 'lifecycle', tid: 1 },
  WS_SERVER: { cat: 'ws,ws-server', tid: 10 },
  WS_CLIENT: { cat: 'ws,ws-client', tid: 20 },
  ARTIFACTS_MANAGER: { cat: 'artifacts,artifacts-manager', tid: 100 },
  ARTIFACT_PLUGIN: { cat: 'artifacts,artifact-plugin', tid: 110 },
  ARTIFACT: { cat: 'artifacts,artifact-instance', tid: 150 },
  CHILD_PROCESS: { cat: 'child_process', tid: 8000 },
  IPC: { cat: 'ipc', tid: 9999 },
  USER: { cat: 'user', tid: 10000 },
};

const THREADS = _.mapValues(TRACE, ({ tid }) => ({ tid }));

module.exports = {
  TRACE,
  THREADS,
};
