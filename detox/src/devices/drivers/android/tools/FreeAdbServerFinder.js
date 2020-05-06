const _ = require('lodash');
const log = require('../../../../utils/logger').child({ __filename });

const ADB_LOOKUP_LOG_EV = 'ADB_LOOKUP_EV';
const ADB_MAX_PORTS_COUNT = 32;

class FreeAdbServerFinder {
  constructor(adbsRegistry, basePort = 20000) {
    this._registry = adbsRegistry;
    this._potentialAdbPorts = this._getPotentialPorts(basePort);
  }

  findFreeAdbServer() {
    const takenAdbServerPorts = this._registry.readAll();
    log.debug({ event: ADB_LOOKUP_LOG_EV }, `Searching through for a free port minding these:`, takenAdbServerPorts);
    const freePorts = _.without(this._potentialAdbPorts, ...takenAdbServerPorts);
    const freePort = freePorts.shift();
    log.debug({ event: ADB_LOOKUP_LOG_EV }, `Found server at port ${freePort}!`);
    return freePort ? freePort : null;
  }

  _getPotentialPorts(basePort) {
    const mapFn = (__, i) => (basePort + i * 2); // i.e. given basePort=100 ==> [100, 102, 104, ...];
    return Array.from({ length: ADB_MAX_PORTS_COUNT }, mapFn);
  }
}

module.exports = FreeAdbServerFinder;
