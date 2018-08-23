const EMPTY = '00000000-0000-0000-0000-000000000000';
const ZERO_REGEXP = /[0-9a-f]/ig;

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}

function UUID() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-'
         + s4() + '-' + s4() + s4() + s4();
}

function isUUID(str) {
  return str.length === EMPTY.length && str.replace(ZERO_REGEXP, '0') === EMPTY;
}

module.exports = {
  UUID,
  isUUID
};
