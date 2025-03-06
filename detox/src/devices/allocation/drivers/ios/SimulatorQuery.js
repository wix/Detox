class SimulatorQuery {
  /** @param {Partial<Detox.IosSimulatorQuery>} query */
  constructor({ id, name, os, type, booted }) {
    if (id != null) this.byId = id;
    if (name != null) this.byName = name;
    if (os != null) this.byOS = os;
    if (type != null) this.byType = type;
    if (booted != null) this.booted = booted;
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
      this.byBooted && `by booted = ${JSON.stringify(this.byBooted)}`,
    ].filter(Boolean).join(' and ');
  }
}

module.exports = SimulatorQuery;
