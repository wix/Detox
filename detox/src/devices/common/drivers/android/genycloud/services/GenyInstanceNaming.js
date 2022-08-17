const session = () => require('../../../../../../../internals').session;

class GenyInstanceNaming {
  generateName() {
    const { id, workerIndex } = session();
    return `Detox.${id}.${workerIndex}`;
  }

  isFamilial(name) {
    return name === this.generateName();
  }
}

module.exports = GenyInstanceNaming;
