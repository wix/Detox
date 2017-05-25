const instance = {
  type: 'EarlGrey',
  value: 'instance'
};

function call(method, ...args) {
  return {
    target: {
      type: 'EarlGrey',
      value: true,
    },
    method: method,
    args: args
  };
};

module.exports = {
  instance,
  call
};
