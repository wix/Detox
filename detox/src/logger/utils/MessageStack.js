const getMainCategory = require('./getMainCategory');

class MessageStack {
  constructor() {
    this._map = {};
  }

  push(context, msg) {
    const hash = this._hash(context);

    if (this._map[hash] == null) {
      this._map[hash] = [];
    }

    return this._map[hash].push(msg);
  }

  pop(context) {
    const hash = this._hash(context);
    const stack = this._map[hash];
    if (stack == null || stack.length === 0) {
      return ['<no begin message>'];
    }

    return stack.pop();
  }

  _hash(context) {
    const cat = getMainCategory(context.cat);
    const tid = context.tid;
    return `${cat}:${tid}`;
  }
}

module.exports = MessageStack;
