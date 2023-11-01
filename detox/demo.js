const signalExit = require('signal-exit');

function handler(code, signal) {
  console.error(`Demo stopped with code ${code} and signal ${signal}`);
  console.log(`Demo stopped with code ${code} and signal ${signal}`);
  console.error('');
  console.log('');
}

signalExit(handler);

console.log('Demo started', new Date());
setInterval(() => {
  console.log('Still running', new Date());
}, 1000);
