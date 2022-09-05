const internals = () => require('../../../../../../../internals');

class GenyInstanceNaming {
  generateName() {
    const { session, worker } = internals();
    return `Detox.${session.id}.${worker.id}`;
  }

  isFamilial(name) {
    return name === this.generateName();
  }
}

module.exports = GenyInstanceNaming;
