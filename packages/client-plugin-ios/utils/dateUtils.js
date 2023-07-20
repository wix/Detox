// This is technically a super-lightweight lib to format date/time (which
// seems to be an issue in JS...). In case more advanced techniques are ever
// needed, dateFormat v4.5.1 may come in handy as a drop-in replacement.

function shortFormat(date) {
  const HH = date.getHours().toString().padStart(2, '0');
  const MM = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  const milli = date.getMilliseconds().toString().padStart(3, '0');
  return `${HH}:${MM}:${ss}.${milli}`;
}

function removeMilliseconds(isoDate) {
  return isoDate.replace(/(T\d\d:\d\d:\d\d)(\.\d\d\d)/, '$1');
}

module.exports = {
  shortFormat,
  removeMilliseconds,
};
