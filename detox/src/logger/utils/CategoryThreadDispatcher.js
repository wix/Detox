const ThreadDispatcher = require('./ThreadDispatcher');
const getMainCategory = require('./getMainCategory');

class CategoryThreadDispatcher {
  constructor() {
    /** @type {Record<string, ThreadDispatcher>} */
    this._dispatchers = {};
  }

  /**
   * @param {'B' | 'E' | 'i'} ph
   * @param {string[] | undefined} cat
   * @param {string | number} id
   * @returns {number}
   */
  resolve(ph, cat, id) {
    const dispatcher = this._resolveDispatcher(cat);

    switch (ph) {
      case 'B': return dispatcher.begin(id);
      case 'E': return dispatcher.end(id);
      default: return dispatcher.resolve(id);
    }
  }

  /** @returns {ThreadDispatcher} */
  _resolveDispatcher(cat) {
    const mainCategory = getMainCategory(cat);
    if (!this._dispatchers[mainCategory]) {
      this._dispatchers[mainCategory] = new ThreadDispatcher(mainCategory);
    }

    return this._dispatchers[mainCategory];
  }
}

module.exports = CategoryThreadDispatcher;
