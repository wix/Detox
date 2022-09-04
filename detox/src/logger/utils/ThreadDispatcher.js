const isUndefined = (x) => x === undefined;

class ThreadDispatcher {
  /**
   * @param {object} options
   * @param {Detox.Logger} options.logger
   * @param {string} options.name
   * @param {number} options.min
   * @param {number} [options.max]
   */
  constructor({ logger, name, min, max = Infinity }) {
    this.logger = logger;
    this.name = name;
    this.min = min;
    this.max = max;
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
    return this._transpose(tid);
  }

  /**
   * @param {string | number} [id]
   * @returns {number}
   */
  resolve(id) {
    const tid = this._findTID(id);
    return this._transpose(tid);
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
    return this._transpose(tid);
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

  _transpose(id) {
    const result = this.min + id;
    if (result > this.max) {
      this.logger.warn(
        { cat: ['logger', 'thread-dispatcher'] },
        `${this.name} trace thread dispatcher has run out of available thread IDs: ${this.min}..${this.max}`
      );
    }

    return Math.min(result, this.max);
  }
}

module.exports = ThreadDispatcher;
