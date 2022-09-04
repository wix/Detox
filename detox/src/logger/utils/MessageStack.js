class MessageStack {
  constructor() {
    this._map = {};
  }

  push(tid, msg) {
    if (this._map[tid] == null) {
      this._map[tid] = [];
    }

    return this._map[tid].push(msg);
  }

  pop(tid) {
    const stack = this._map[tid];
    if (stack == null || stack.length === 0) {
      return ['<no begin message>'];
    }

    return stack.pop();
  }
}

module.exports = MessageStack;
