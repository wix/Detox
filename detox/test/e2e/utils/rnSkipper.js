// Routes tests written for the other React Native architecture (or another
// RN minor) to `.skip`: the suite keeps both architectures' expectations side
// by side, tagged `@legacy` / `@new-arch` / `@rnNN`, and a test for the build
// we are not running against must register as a skip, not run and fail.
//
// A plain jest setup file: the registrars are wrapped, and a tagged name goes
// through `.skip` — under jest-circus a skipped describe registers every
// inner test as a skip and runs no hooks.
const { isRNNewArch, rnVersion } = require('../../../src/utils/rn-consts/rn-consts');

const shouldSkip = (name) => {
  if (isRNNewArch && name.includes('@legacy')) return true;
  if (!isRNNewArch && name.includes('@new-arch')) return true;
  const match = /@rn(\d+)/i.exec(name);
  return match !== null && match[1] !== String(rnVersion.minor);
};

const wrapRegistrar = (original) => {
  const wrapped = (name, fn, timeout) =>
    shouldSkip(name) ? original.skip(name, fn) : original(name, fn, timeout);
  // `.skip`/`.only`/`.todo`/`.each`/`.failing` keep jest's own behavior.
  return Object.assign(wrapped, original);
};

globalThis.describe = wrapRegistrar(globalThis.describe);
globalThis.it = wrapRegistrar(globalThis.it);
globalThis.test = wrapRegistrar(globalThis.test);
