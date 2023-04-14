function call(target, method, ...args) {
  return function() {
    if (typeof target === 'function') {
      target = {
        type: 'Invocation',
        value: target()
      };
    }
    for (let i = 0; i < args.length; i++) {
      if (typeof args[i] === 'function') {
        args[i] = {
          type: 'Invocation',
          value: args[i]()
        };
      }
    }
    return {
      target: target,
      method: method,
      args: args
    };
  };
}

function callDirectly(json) {
  return {
    type: 'Invocation',
    value: json
  };
}

const genericInvokeObject = new Proxy({},
  {
    get: (target, prop) => {
      return (p) => {
        return {
          type: prop,
          value: p
        };
      };
    }
  });

module.exports = {
  call,
  callDirectly,
  genericInvokeObject
};
