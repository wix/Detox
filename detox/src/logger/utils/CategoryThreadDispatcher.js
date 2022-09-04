const _ = require('lodash');

const ThreadDispatcher = require('./ThreadDispatcher');

class CategoryThreadDispatcher {
  /**
   * @param {object} config
   * @param {Record<string, [number, number?]>} config.categories
   * @param {Detox.Logger} config.logger
   */
  constructor(config) {
    this.categories = config.categories;
    this.dispatchers = _.mapValues(this.categories, (range, name) => {
      return new ThreadDispatcher({
        name,
        logger: config.logger,
        min: range[0],
        max: range[1] || range[0],
      });
    });
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
    const mainCategory = cat ? cat.split(',', 1)[0] : '';
    return this.dispatchers[mainCategory] || this.dispatchers.default;
  }

  categorize(tid) {
    return _.findKey(this.categories, ([min, max]) => min <= tid && tid <= max) || 'default';
  }

  threadize(cat) {
    if (!cat) {
      return this.categories.default[0];
    }

    return _.find(this.categories, (_, key) => key === cat[0]);
  }
}

module.exports = CategoryThreadDispatcher;
