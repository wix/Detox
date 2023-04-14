const noop = () => {};

const _promise = Symbol('promise');
const _status = Symbol('status');
const _resolve = Symbol('resolve');
const _reject = Symbol('reject');

class Deferred {
  constructor() {
    this[_promise] = new Promise((resolve, reject) => {
      this[_status] = Deferred.PENDING;
      this[_resolve] = resolve;
      this[_reject] = reject;
    });

    this[_promise].catch(noop); // handle unhandled rejection warnings
    this.resolve = this.resolve.bind(this);
    this.reject = this.reject.bind(this);
  }

  static resolved(value) {
    const deferred = new Deferred();
    deferred.resolve(value);
    return deferred;
  }

  static rejected(error) {
    const deferred = new Deferred();
    deferred.reject(error);
    return deferred;
  }

  get status() {
    return this[_status];
  }

  get promise() {
    return this[_promise];
  }

  isPending() {
    return this.status === Deferred.PENDING;
  }

  isResolved() {
    return this.status === Deferred.RESOLVED;
  }

  isRejected() {
    return this.status === Deferred.REJECTED;
  }

  resolve(value) {
    if (this[_status] === Deferred.PENDING) {
      this[_resolve](value);
      this[_status] = Deferred.RESOLVED;
    }
  }

  reject(reason) {
    if (this[_status] === Deferred.PENDING) {
      this[_reject](reason);
      this[_status] = Deferred.REJECTED;
    }
  }
}

Deferred.PENDING = 'pending';
Deferred.RESOLVED = 'resolved';
Deferred.REJECTED = 'rejected';

module.exports = Deferred;
