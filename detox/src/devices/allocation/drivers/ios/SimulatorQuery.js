class SimulatorQuery {
  /** @param {Partial<Detox.IosSimulatorQuery>} query */
  constructor({ id, name, os, type }) {
    if (id != null) this.byId = id;
    if (name != null) this.byName = name;
    if (os != null) this.byOS = os;
    if (type != null) this.byType = type;
  }

  getDeviceComment() {
    return this.byId || [this.byName, this.byType, this.byOS].filter(Boolean).join(', ');
  }

  toString() {
    return [
      this.byId && `by UDID = ${JSON.stringify(this.byId)}`,
      this.byName && `by name = ${JSON.stringify(this.byName)}`,
      this.byType && `by type = ${JSON.stringify(this.byType)}`,
      this.byOS && `by OS = ${JSON.stringify(this.byOS)}`,
    ].filter(Boolean).join(' and ');
  }
}

module.exports = SimulatorQuery;
