const ExclusiveLockfile = require('../../../../utils/ExclusiveLockfile');
const { getAdbPortRegistryPath } = require('../../../../utils/environment');

class AdbPortRegistry {
  constructor({ lockfilePath = getAdbPortRegistryPath() } = {}) {
    this._registry = new Map();
    this._lockfile = new ExclusiveLockfile(lockfilePath, {
      getInitialState: () => ({}),
    });
  }

  /**
   * @param {string} adbName
   * @param {{ pid: number, port: number, sessionId: string }} owner
   */
  async reserve(adbName, { pid, port, sessionId }) {
    await this._lockfile.exclusively(() => {
      const registry = this._readRegistry();
      const existing = registry[adbName] || {};
      registry[adbName] = {
        adbName,
        createdAt: existing.createdAt || Date.now(),
        pid,
        port,
        sessionId,
        state: 'reserved',
        updatedAt: Date.now(),
      };
      this._lockfile.write(registry);
      this._setCache(registry);
    });
  }

  /**
   * @param {string} adbName
   * @param {{ pid: number, port: number, sessionId: string }} owner
   */
  async markReady(adbName, { pid, port, sessionId }) {
    await this._lockfile.exclusively(() => {
      const registry = this._readRegistry();
      const existing = registry[adbName] || {};

      registry[adbName] = {
        adbName,
        createdAt: existing.createdAt || Date.now(),
        pid,
        port,
        sessionId,
        state: 'ready',
        updatedAt: Date.now(),
      };
      this._lockfile.write(registry);
      this._setCache(registry);
    });
  }

  /**
   * @param {string} adbName
   * @param {{ sessionId?: string }} [owner]
   */
  async release(adbName, owner = {}) {
    await this._lockfile.exclusively(() => {
      const registry = this._readRegistry();
      const existing = registry[adbName];

      if (existing && (owner.sessionId == null || existing.sessionId === owner.sessionId)) {
        delete registry[adbName];
        this._lockfile.write(registry);
        this._setCache(registry);
      }
    });
  }

  /**
   * @param {string} sessionId
   */
  async releaseSession(sessionId) {
    await this._lockfile.exclusively(() => {
      const registry = this._readRegistry();
      for (const [adbName, entry] of Object.entries(registry)) {
        if (entry.sessionId === sessionId) {
          delete registry[adbName];
        }
      }

      this._lockfile.write(registry);
      this._setCache(registry);
    });
  }

  /**
   * @returns {Promise<Array<{ adbName: string, createdAt: number, pid: number, port: number, sessionId: string, state: string, updatedAt: number }>>}
   */
  async entries() {
    let entries = [];
    await this._lockfile.exclusively(() => {
      const registry = this._readRegistry();
      this._setCache(registry);
      entries = this._entriesFrom(registry);
    });
    return entries;
  }

  async reset() {
    await this._lockfile.exclusively(() => {
      const registry = {};
      this._lockfile.write(registry);
      this._setCache(registry);
    });
  }

  /**
   * @param {string} adbName
   * @returns {number | undefined}
   */
  getPort(adbName) {
    return this._registry.get(adbName)?.port;
  }

  _readRegistry() {
    const rawRegistry = this._lockfile.read() || {};
    return Object.fromEntries(
      Object.entries(rawRegistry).map(([adbName, entry]) => [adbName, {
        adbName,
        createdAt: Number(entry.createdAt || Date.now()),
        pid: Number(entry.pid),
        port: Number(entry.port),
        sessionId: entry.sessionId,
        state: entry.state,
        updatedAt: Number(entry.updatedAt || Date.now()),
      }])
    );
  }

  _setCache(registry) {
    this._registry = new Map(this._entriesFrom(registry).map((entry) => [entry.adbName, entry]));
  }

  _entriesFrom(registry) {
    return Object.values(registry);
  }
}

module.exports = new AdbPortRegistry();
module.exports.AdbPortRegistry = AdbPortRegistry;
