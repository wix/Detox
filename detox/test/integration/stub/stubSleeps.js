const sleep = require('detox/src/utils/sleep');

module.exports = {
  sleepVeryLittle: () => sleep(10),
  sleepALittle: () => sleep(100),
  sleepSomeTime: () => sleep(1000),
  sleepALot: () => sleep(2000),
};
