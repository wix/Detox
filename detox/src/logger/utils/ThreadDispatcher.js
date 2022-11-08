const isUndefined = (x) => x === undefined;

class ThreadDispatcher {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
    this.stacks = [];
    this.threads = [];
  }

  /**
   * @param {string | number} [id]
   * @returns {number}
   */
  begin(id) {
    const tid = this._findTID(id);
    this.threads[tid] = id;
    this.stacks[tid] = (this.stacks[tid] || 0) + 1;
    return tid;
  }

  /**
   * @param {string | number} [id]
   * @returns {number}
   */
  resolve(id) {
    return this._findTID(id);
  }

  /**
   * @param {string | number} [id]
   * @returns {number}
   */
  end(id) {
    const tid = this._findTID(id);
    if (this.stacks[tid] && --this.stacks[tid] === 0) {
      delete this.threads[tid];
    }
    return tid;
  }

  /**
   * @param {string | number | undefined} id
   * @returns {number}
   * @private
   *
   * Memory-efficient finder of a free item index in the threads array.
   */
  _findTID(id) {
    let tid = this.threads.indexOf(id);
    if (tid === -1) {
      // Try to find a recently released slot in the array:
      tid = this.threads.findIndex(isUndefined);
    }
    return tid === -1 ? this.threads.length : tid;
  }
}

module.exports = ThreadDispatcher;
