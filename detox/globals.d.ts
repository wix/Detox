// Ambient globals for projects that run with `behavior.init.exposeGlobals`
// (the default): `/// <reference types="detox/globals" />` or a `types`
// entry in tsconfig makes `device`, `element`, `by`, `expect` and `waitFor`
// known without an import.
import DetoxCompat = require('./dist/index');

declare global {
  const detox: typeof DetoxCompat;
  const device: typeof DetoxCompat.device;
  const element: typeof DetoxCompat.element;
  const waitFor: typeof DetoxCompat.waitFor;
  const expect: typeof DetoxCompat.expect;
  const by: typeof DetoxCompat.by;
}
