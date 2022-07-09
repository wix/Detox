const session = () => require('../../../../../../../internals').session;

class GenyInstanceNaming {
  generateName() {
    const { id, workerId } = session();
    return `Detox-${id}.${workerId}`;
  }

  isFamilial(name) {
    return name === this.generateName();
  }
}

module.exports = GenyInstanceNaming;
