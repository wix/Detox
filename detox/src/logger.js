const colors = require('colors/safe');

console.step = (string) => {
  console.log(colors.cyan(`#: ${string}`));
};

console.warn = (string) => {
  console.log(colors.yellow(`#: ${string}`));
};

console.error = (string) => {
  console.log(colors.red(`#: ${string}`));
};